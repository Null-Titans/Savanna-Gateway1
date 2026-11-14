import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { AppError, type ErrorDetail } from '../shared/errors/index.js';
import { logger } from '../shared/logger.js';
import { env } from '../config/env.js';

interface StandardErrorPayload {
  success: false;
  error: {
    code: string;
    message: string;
    details: ErrorDetail[];
  };
  message: string; // Top-level compatibility for existing frontend restAdapter
}

/**
 * Centralized Application Error Handling Middleware.
 * Catches all operational and unexpected errors, logs them structured with request context,
 * and formats the HTTP response consistently.
 *
 * Stack traces and sensitive internal error states are NEVER exposed in production.
 */
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // Express requires 4 arguments to identify this as an error-handling middleware
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  let statusCode = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'An unexpected internal server error occurred.';
  let details: ErrorDetail[] = [];

  // 1. Handle Known Operational AppErrors
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    code = err.code;
    message = err.message;
    details = err.details;
  }
  // 2. Handle Direct Zod Validation Errors
  else if (err instanceof ZodError) {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    message = 'Request validation failed';
    details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
  }
  // 3. Handle Malformed JSON Request Bodies
  else if (err instanceof SyntaxError && 'status' in err && (err as { status: number }).status === 400) {
    statusCode = 400;
    code = 'MALFORMED_JSON';
    message = 'Malformed JSON payload in request body';
    details = [{ message: err.message }];
  }
  // 4. Handle Mongoose / MongoDB Specific Errors
  else if (err && typeof err === 'object') {
    const errorObj = err as Record<string, unknown>;

    // MongoDB Duplicate Key Error (E11000)
    if (errorObj['code'] === 11000) {
      statusCode = 409;
      code = 'CONFLICT';
      message = 'A resource with conflicting unique fields already exists.';
      if (errorObj['keyValue'] && typeof errorObj['keyValue'] === 'object') {
        const fields = Object.keys(errorObj['keyValue'] as object);
        details = fields.map((field) => ({
          field,
          message: `Field '${field}' must be unique`,
        }));
      }
    }
    // Mongoose Validation Error
    else if (errorObj['name'] === 'ValidationError' && errorObj['errors'] && typeof errorObj['errors'] === 'object') {
      statusCode = 400;
      code = 'VALIDATION_ERROR';
      message = 'Database schema validation failed';
      const mongooseErrors = errorObj['errors'] as Record<string, { path?: string; message?: string }>;
      details = Object.values(mongooseErrors).map((item) => ({
        field: item.path,
        message: item.message || 'Validation error on field',
      }));
    }
    // Mongoose CastError (e.g. invalid ObjectId format)
    else if (errorObj['name'] === 'CastError') {
      statusCode = 400;
      code = 'VALIDATION_ERROR';
      message = 'Invalid parameter format';
      details = [
        {
          field: typeof errorObj['path'] === 'string' ? errorObj['path'] : undefined,
          message: `Invalid format for value '${String(errorObj['value'])}'`,
        },
      ];
    }
    // Fallback for generic errors in development mode
    else if (env.NODE_ENV !== 'production' && err instanceof Error) {
      message = err.message;
    }
  }

  // Structured Logging with Request Correlation
  const logContext = {
    requestId: req.id,
    path: req.originalUrl,
    method: req.method,
    statusCode,
    code,
    detailsCount: details.length,
    err: err instanceof Error ? { message: err.message, stack: err.stack } : err,
  };

  if (statusCode >= 500) {
    logger.error(logContext, 'Server error handled by errorHandler');
  } else {
    logger.warn(logContext, 'Client error handled by errorHandler');
  }

  const responsePayload: StandardErrorPayload = {
    success: false,
    error: {
      code,
      message,
      details,
    },
    message,
  };

  res.status(statusCode).json(responsePayload);
}
