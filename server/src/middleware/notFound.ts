import type { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../shared/errors/index.js';

/**
 * Fallthrough 404 handler for unmatched routes.
 * Creates a standard NotFoundError and passes it to the centralized errorHandler.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new NotFoundError(`Cannot ${req.method} ${req.originalUrl}`));
}
