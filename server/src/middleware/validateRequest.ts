import type { Request, Response, NextFunction } from 'express';
import { ZodError, type ZodTypeAny } from 'zod';
import { ValidationError, type ErrorDetail } from '../shared/errors/index.js';

export interface RequestValidationSchema {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

function formatZodIssues(issues: ZodError['issues']): ErrorDetail[] {
  return issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
  }));
}

/**
 * Generic Request Validation Middleware using Zod.
 * Validates body, query, and params independently.
 * Assigns parsed and coerced values back to request upon success.
 */
export function validateRequest(schema: RequestValidationSchema) {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    const errorDetails: ErrorDetail[] = [];

    try {
      if (schema.params) {
        const result = await schema.params.safeParseAsync(req.params);
        if (!result.success) {
          errorDetails.push(...formatZodIssues(result.error.issues));
        } else {
          req.params = result.data;
        }
      }

      if (schema.query) {
        const result = await schema.query.safeParseAsync(req.query);
        if (!result.success) {
          errorDetails.push(...formatZodIssues(result.error.issues));
        } else {
          req.query = result.data;
        }
      }

      if (schema.body) {
        const result = await schema.body.safeParseAsync(req.body);
        if (!result.success) {
          errorDetails.push(...formatZodIssues(result.error.issues));
        } else {
          req.body = result.data;
        }
      }

      if (errorDetails.length > 0) {
        return next(new ValidationError('Request validation failed', errorDetails));
      }

      next();
    } catch (err) {
      next(err);
    }
  };
}
