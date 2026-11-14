import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../types/express.js';
import { UnauthorizedError, ForbiddenError } from '../shared/errors/index.js';

/**
 * Role-Based Access Control (RBAC) Middleware.
 * Enforces that the authenticated user possesses one of the explicitly allowed roles.
 */
export function requireRole(allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(
        new UnauthorizedError('Authentication required before authorization check', 'UNAUTHENTICATED')
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Forbidden: Insufficient permissions. Required one of [${allowedRoles.join(', ')}], got '${req.user.role}'`,
          'INSUFFICIENT_ROLE'
        )
      );
    }

    next();
  };
}

/**
 * Tenant Ownership Guard Middleware:
 * Enforces that an authenticated user can only operate on the tenant matching their own organizationId,
 * unless they are a PLATFORM_ADMIN.
 */
export function requireSameTenantOrPlatformAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    return next(new UnauthorizedError('Authentication required', 'UNAUTHENTICATED'));
  }

  if (req.user.role === 'PLATFORM_ADMIN') {
    return next();
  }

  if (!req.tenant) {
    return next(new ForbiddenError('No active tenant context to authorize against', 'MISSING_TENANT_CONTEXT'));
  }

  if (req.user.organizationId !== req.tenant.id) {
    return next(
      new ForbiddenError(
        'Cross-tenant modification forbidden: User does not belong to the target organization',
        'CROSS_TENANT_FORBIDDEN'
      )
    );
  }

  next();
}
