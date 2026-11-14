import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { Organization, type IOrganization } from '../modules/organizations/organization.model.js';
import {
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from '../shared/errors/index.js';
import type { TenantContext } from '../types/express.js';

/**
 * Extracts candidate organization identifier from request headers or subdomain
 */
function extractTenantIdentifier(req: Request): string | null {
  const headerId =
    (req.headers['x-organization-id'] as string) ||
    (req.headers['x-tenant-id'] as string) ||
    (req.headers['x-organization-slug'] as string);

  if (headerId && typeof headerId === 'string' && headerId.trim().length > 0) {
    return headerId.trim();
  }

  // Extract from query parameter if provided (e.g. for public widget embed requests)
  if (req.query['organizationId'] && typeof req.query['organizationId'] === 'string') {
    return req.query['organizationId'].trim();
  }
  if (req.query['orgSlug'] && typeof req.query['orgSlug'] === 'string') {
    return req.query['orgSlug'].trim();
  }

  // Optional: Extract subdomain if custom domain/subdomain routing is used
  const host = (req.headers.host || '').split(':')[0] || '';
  // Ignore IP addresses (IPv4 or localhost)
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(host) || host === 'localhost' || host === '127.0.0.1') {
    return null;
  }

  const parts = host.split('.');
  if (parts.length > 2 && parts[0] && parts[0] !== 'api' && parts[0] !== 'www' && parts[0] !== 'localhost') {
    return parts[0].toLowerCase();
  }

  return null;
}

/**
 * Builds the runtime TenantContext from an Organization document
 */
function toTenantContext(org: IOrganization): TenantContext {
  return {
    id: org._id.toString(),
    name: org.name,
    slug: org.slug,
    status: org.status,
    branding: {
      logoUrl: org.branding?.logoUrl,
      theme: org.branding?.theme ?? 'light',
      primaryColor: org.branding?.primaryColor ?? '#2563EB',
      secondaryColor: org.branding?.secondaryColor,
      accentColor: org.branding?.accentColor,
      backgroundColor: org.branding?.backgroundColor,
      customCss: org.branding?.customCss,
    },
    settings: {
      supportedLanguages: org.settings?.supportedLanguages ?? ['en', 'am', 'om'],
      defaultLanguage: org.settings?.defaultLanguage ?? 'en',
      accessibilityMode: org.settings?.accessibilityMode ?? {
        highContrastDefault: false,
        screenReaderOptimized: true,
        simplifiedUI: false,
      },
      allowGuestOnboarding: org.settings?.allowGuestOnboarding ?? true,
    },
  };
}

/**
 * Resolves tenant from request header/query or authenticated user session.
 * Attaches validated `req.tenant` to request.
 * Strictly checks organization status and cross-tenant boundaries.
 */
export async function tenantContextMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let tenantIdentifier = extractTenantIdentifier(req);

    // Fallback: If no header/query is specified but user is authenticated, derive from req.user
    if (!tenantIdentifier && req.user?.organizationId) {
      tenantIdentifier = req.user.organizationId;
    }

    if (!tenantIdentifier) {
      return next();
    }

    // Validate format if it claims to be a MongoDB ObjectId
    if (tenantIdentifier.length === 24 && !mongoose.Types.ObjectId.isValid(tenantIdentifier)) {
      throw new ValidationError('Invalid organization identifier format');
    }

    const org = await Organization.findBySlugOrId(tenantIdentifier);
    if (!org) {
      throw new NotFoundError(`Organization '${tenantIdentifier}' not found`, 'ORGANIZATION_NOT_FOUND');
    }

    if (org.status === 'suspended') {
      throw new ForbiddenError('Organization account is currently suspended', 'ORGANIZATION_SUSPENDED');
    }

    if (org.status === 'pending') {
      throw new ForbiddenError('Organization account is pending verification', 'ORGANIZATION_PENDING');
    }

    // Cross-tenant boundary enforcement:
    // If request is authenticated, ensure user belongs to this tenant unless PLATFORM_ADMIN
    if (req.user && req.user.role !== 'PLATFORM_ADMIN') {
      if (req.user.organizationId && req.user.organizationId !== org._id.toString()) {
        throw new ForbiddenError(
          'Cross-tenant access prohibited: User does not belong to the requested organization',
          'CROSS_TENANT_ACCESS_FORBIDDEN'
        );
      }
    }

    req.tenant = toTenantContext(org);
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Strict middleware enforcing that an active tenant context must exist on the request.
 */
export function requireTenant(req: Request, _res: Response, next: NextFunction): void {
  if (!req.tenant) {
    return next(
      new UnauthorizedError(
        'Organization context is required. Provide X-Organization-Id header or authenticate with an organization user.',
        'TENANT_CONTEXT_REQUIRED'
      )
    );
  }
  next();
}

/**
 * Tenant Query Isolation Helper:
 * Returns a MongoDB query filter guaranteed to constrain queries to the current tenant.
 * Throws UnauthorizedError if called without an active tenant context.
 */
export function getTenantFilter(req: Request): { organizationId: mongoose.Types.ObjectId } {
  if (!req.tenant) {
    throw new UnauthorizedError(
      'Cannot construct tenant filter: No active tenant context found on request',
      'MISSING_TENANT_CONTEXT'
    );
  }

  return { organizationId: new mongoose.Types.ObjectId(req.tenant.id) };
}

/**
 * Safe scoped query wrapper:
 * Merges arbitrary MongoDB query conditions with the enforced organizationId.
 */
export function withTenantScope<T extends Record<string, unknown>>(
  req: Request,
  filter: T = {} as T
): T & { organizationId: mongoose.Types.ObjectId } {
  const tenantFilter = getTenantFilter(req);
  return {
    ...filter,
    organizationId: tenantFilter.organizationId,
  };
}
