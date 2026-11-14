import type { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      id?: string;
    }
  }
}

/**
 * Middleware that attaches a unique Request ID to each incoming request.
 * Preserves upstream request ID if provided and valid, otherwise generates a UUID v4.
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction): void {
  const existingHeader = req.header('X-Request-Id');
  const requestId = existingHeader && uuidValidate(existingHeader) ? existingHeader : uuidv4();

  req.id = requestId;
  req.headers['x-request-id'] = requestId;
  res.setHeader('X-Request-Id', requestId);

  next();
}
