import type { Request, Response, NextFunction } from 'express';
import type { UserRole } from '../../types/express.js';
import { ForbiddenError, UnauthorizedError } from '../errors/index.js';

export type Permission =
  | 'organizations:read'
  | 'organizations:update'
  | 'members:manage'
  | 'onboarding:read'
  | 'onboarding:manage'
  | 'jobs:read'
  | 'jobs:create'
  | 'jobs:update'
  | 'jobs:delete'
  | 'applications:read'
  | 'applications:manage'
  | 'accommodations:read'
  | 'accommodations:manage'
  | 'integrations:manage'
  | 'analytics:read';

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  PLATFORM_ADMIN: [
    'organizations:read', 'organizations:update', 'members:manage',
    'onboarding:read', 'onboarding:manage',
    'jobs:read', 'jobs:create', 'jobs:update', 'jobs:delete',
    'applications:read', 'applications:manage',
    'accommodations:read', 'accommodations:manage',
    'integrations:manage', 'analytics:read',
  ],
  ORGANIZATION_ADMIN: [
    'organizations:read', 'organizations:update', 'members:manage',
    'onboarding:read', 'onboarding:manage',
    'jobs:read', 'jobs:create', 'jobs:update', 'jobs:delete',
    'applications:read', 'applications:manage',
    'accommodations:read', 'accommodations:manage',
    'integrations:manage', 'analytics:read',
  ],
  ORGANIZATION_MEMBER: [
    'organizations:read',
    'onboarding:read', 'onboarding:manage',
    'jobs:read', 'jobs:create', 'jobs:update',
    'applications:read',
    'accommodations:read',
    'analytics:read',
  ],
  EMPLOYER: [
    'jobs:read', 'jobs:create', 'jobs:update',
    'applications:read', 'applications:manage',
    'accommodations:read',
  ],
  PARTNER: [
    'organizations:read',
    'onboarding:read', 'onboarding:manage',
    'jobs:read',
  ],
  LEARNER: [
    'onboarding:read', 'onboarding:manage',
    'jobs:read',
    'applications:read',
    'accommodations:read',
  ],
};

export function getRolePermissions(role: UserRole): Permission[] {
  return ROLE_PERMISSIONS[role] ?? [];
}

export function hasPermission(
  role: UserRole,
  permission: Permission
): boolean {
  return getRolePermissions(role).includes(permission);
}

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new UnauthorizedError('Authentication required', 'UNAUTHENTICATED'));
      return;
    }

    const granted = getRolePermissions(req.user.role);
    const allowed = permissions.every((permission) =>
      granted.includes(permission)
    );

    if (!allowed) {
      next(new ForbiddenError(
        'You do not have permission to perform this action',
        'INSUFFICIENT_PERMISSION'
      ));
      return;
    }

    next();
  };
}
