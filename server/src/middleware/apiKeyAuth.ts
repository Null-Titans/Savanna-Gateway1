import type { Request, Response, NextFunction } from 'express';
import { Organization } from '../modules/organizations/organization.model.js';
import { hashSha256 } from '../shared/utils/crypto.js';
import { UnauthorizedError, ForbiddenError } from '../shared/errors/index.js';

export interface ApiKeyAuthOptions {
  allowPublicWidget?: boolean;
  requiredScopes?: string[];
}

/**
 * Extracts raw API key from standard headers
 */
function extractApiKey(req: Request): string | null {
  const headerKey = req.headers['x-api-key'];
  if (typeof headerKey === 'string' && headerKey.trim().length > 0) {
    return headerKey.trim();
  }

  const authHeader = req.headers.authorization;
  if (authHeader && typeof authHeader === 'string') {
    const parts = authHeader.trim().split(/\s+/);
    if (parts.length === 2 && parts[0]?.toLowerCase() === 'apikey') {
      return parts[1] || null;
    }
  }

  return null;
}

/**
 * Validates API key and sets `req.apiKey` and `req.tenant`.
 * Options allow controlling whether public widget keys are accepted
 * and what scopes are required.
 */
export function requireApiKey(options: ApiKeyAuthOptions = {}) {
  const { allowPublicWidget = false, requiredScopes = [] } = options;

  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const rawKey = extractApiKey(req);
      if (!rawKey) {
        throw new UnauthorizedError(
          'API key required. Provide key in X-Api-Key or Authorization: ApiKey <key> header.',
          'MISSING_API_KEY'
        );
      }

      const keyHash = hashSha256(rawKey);
      const match = await Organization.findByApiKeyHash(keyHash);

      if (!match) {
        throw new UnauthorizedError('Invalid or revoked API key', 'INVALID_API_KEY');
      }

      const { organization, apiKey } = match;

      // Strict Privilege Enclosure:
      // Public widget keys MUST NEVER grant administrative or non-widget capabilities
      if (apiKey.keyType === 'public_widget' && !allowPublicWidget) {
        throw new ForbiddenError(
          'Public widget API keys are restricted to onboarding/widget clients and cannot access administrative or protected endpoints.',
          'PUBLIC_KEY_RESTRICTED'
        );
      }

      // Check required scopes
      if (requiredScopes.length > 0) {
        const hasAllScopes = requiredScopes.every(
          (scope) => apiKey.scopes.includes('*') || apiKey.scopes.includes(scope)
        );
        if (!hasAllScopes) {
          throw new ForbiddenError(
            `Insufficient API key permissions. Required scopes: [${requiredScopes.join(', ')}]`,
            'INSUFFICIENT_SCOPES'
          );
        }
      }

      // Update last used timestamp asynchronously (fire and forget for latency optimization)
      Organization.updateOne(
        { _id: organization._id, 'apiKeys.id': apiKey.id },
        { $set: { 'apiKeys.$.lastUsedAt': new Date() } }
      ).catch(() => {});

      // Attach API key context
      req.apiKey = {
        id: apiKey.id,
        name: apiKey.name,
        keyType: apiKey.keyType,
        scopes: apiKey.scopes,
        organizationId: organization._id.toString(),
      };

      // Also set tenant context from the organization bound to this API key
      req.tenant = {
        id: organization._id.toString(),
        name: organization.name,
        slug: organization.slug,
        status: organization.status,
        branding: {
          logoUrl: organization.branding?.logoUrl,
          theme: organization.branding?.theme ?? 'light',
          primaryColor: organization.branding?.primaryColor ?? '#2563EB',
          secondaryColor: organization.branding?.secondaryColor,
          accentColor: organization.branding?.accentColor,
          backgroundColor: organization.branding?.backgroundColor,
          customCss: organization.branding?.customCss,
        },
        settings: {
          supportedLanguages: organization.settings?.supportedLanguages ?? ['en', 'am', 'om'],
          defaultLanguage: organization.settings?.defaultLanguage ?? 'en',
          accessibilityMode: organization.settings?.accessibilityMode ?? {
            highContrastDefault: false,
            screenReaderOptimized: true,
            simplifiedUI: false,
          },
          allowGuestOnboarding: organization.settings?.allowGuestOnboarding ?? true,
        },
      };

      next();
    } catch (err) {
      next(err);
    }
  };
}
