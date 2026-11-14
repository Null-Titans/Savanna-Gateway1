import type { Request, Response, NextFunction } from 'express';
import { OrganizationService } from './organization.service.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { ValidationError, UnauthorizedError } from '../../shared/errors/index.js';

export class OrganizationController {
  /**
   * GET /api/v1/organizations/public-config
   * Public onboarding widget configuration endpoint.
   * Returns safe branding, accessibility settings, and supported languages.
   */
  public static async getPublicConfig(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const identifier =
        (req.query['id'] as string) ||
        (req.query['slug'] as string) ||
        (req.query['organizationId'] as string) ||
        (req.query['orgSlug'] as string) ||
        (req.headers['x-organization-id'] as string) ||
        (req.headers['x-tenant-id'] as string) ||
        (req.headers['x-organization-slug'] as string) ||
        req.tenant?.slug ||
        req.tenant?.id;

      if (!identifier) {
        throw new ValidationError(
          'Organization identifier is required. Provide ?id=, ?slug=, or X-Organization-Id header.'
        );
      }

      const config = await OrganizationService.getPublicConfig(identifier);
      sendSuccess(res, config, { cacheControl: 'public, max-age=300' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/organizations
   * Creates a new tenant organization.
   */
  public static async create(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await OrganizationService.createOrganization(req.body);
      sendSuccess(
        res,
        {
          organization: result.organization,
          publicWidgetKey: result.publicWidgetKey,
        },
        { notice: 'Store the publicWidgetKey securely. It will not be shown again.' },
        201
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/organizations/current
   * Retrieves full details for the authenticated user's organization.
   */
  public static async getCurrent(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenant) {
        throw new UnauthorizedError('No active tenant context resolved');
      }

      sendSuccess(res, req.tenant);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PATCH /api/v1/organizations/current
   * Updates branding and settings for current organization.
   */
  public static async updateCurrent(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenant) {
        throw new UnauthorizedError('No active tenant context resolved');
      }

      const updated = await OrganizationService.updateOrganization(
        req.tenant.id,
        req.body
      );

      sendSuccess(res, updated);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/organizations/current/api-keys
   * Generates a new API key for the current organization.
   */
  public static async createApiKey(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenant) {
        throw new UnauthorizedError('No active tenant context resolved');
      }

      const { name, keyType, scopes } = req.body;
      const result = await OrganizationService.generateApiKey(
        req.tenant.id,
        name,
        keyType,
        scopes
      );

      sendSuccess(
        res,
        result.apiKey,
        {
          notice:
            'Store this secret API key safely. The plain key cannot be retrieved again after generation.',
        },
        201
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * DELETE /api/v1/organizations/current/api-keys/:keyId
   * Revokes an existing API key.
   */
  public static async revokeApiKey(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.tenant) {
        throw new UnauthorizedError('No active tenant context resolved');
      }

      const { keyId } = req.params;
      if (!keyId) {
        throw new ValidationError('keyId parameter is required');
      }

      await OrganizationService.revokeApiKey(req.tenant.id, keyId);
      sendSuccess(res, { revoked: true });
    } catch (err) {
      next(err);
    }
  }
}
