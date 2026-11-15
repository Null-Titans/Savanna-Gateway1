import type { RequestHandler } from 'express';

export const requireTenantAccess: RequestHandler = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
  }

  // Platform administrators can operate across organizations.
  if (req.user.role === 'PLATFORM_ADMIN') {
    return next();
  }

  const request = req as typeof req & {
    tenant?: { _id?: unknown; id?: string };
  };

  const tenantId = String(
    request.tenant?._id ?? request.tenant?.id ?? ''
  );

  const userOrganizationId = String(req.user.organizationId ?? '');

  if (!tenantId || !userOrganizationId) {
    return res.status(403).json({
      success: false,
      message: 'Organization context is required.',
    });
  }

  if (tenantId !== userOrganizationId) {
    return res.status(403).json({
      success: false,
      message: 'Access to this organization is forbidden.',
    });
  }

  next();
};
