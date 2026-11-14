import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../modules/authentication/auth.service.js';
import { UnauthorizedError } from '../shared/errors/index.js';

/**
 * Extracts Bearer token from the standard Authorization header
 */
function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }

  const parts = authHeader.trim().split(/\s+/);
  if (parts.length !== 2 || parts[0]?.toLowerCase() !== 'bearer') {
    return null;
  }

  return parts[1] || null;
}

/**
 * Middleware: Enforces that a valid JWT Access Token is present.
 * Decodes the token, verifies cryptographic signature, checks user status,
 * and attaches typed AuthenticatedUser to `req.user`.
 */
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const token = extractBearerToken(req);
    if (!token) {
      throw new UnauthorizedError(
        'Authentication required. Provide a valid Bearer token in the Authorization header.',
        'MISSING_BEARER_TOKEN',
      );
    }
    const authenticatedUser = await AuthService.verifyAccessToken(token);
    req.user = authenticatedUser;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Optional authentication: Populates `req.user` if a valid token is provided,
 * but does not reject the request if no header is present.
 */
export async function optionalAuthenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      // No token supplied – treat as unauthenticated.
      return next();
    }
    const token = extractBearerToken(req);
    if (!token) {
      // Header present but malformed.
      throw new UnauthorizedError(
        'Malformed Authorization header. Expected Bearer token.',
        'MALFORMED_TOKEN',
      );
    }
    const authenticatedUser = await AuthService.verifyAccessToken(token);
    req.user = authenticatedUser;
    return next();
  } catch (err) {
    return next(err);
  }
}
