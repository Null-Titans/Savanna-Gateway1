import type { Request, Response, NextFunction } from 'express';
import { PartnerIntegrationService } from './partnerIntegration.service.js';
import { ForbiddenError, UnauthorizedError, NotFoundError } from '../../shared/errors/index.js';

function getOrganizationContext(req: Request) {
  if (!req.user) throw new UnauthorizedError('Authentication is required');

  if (!['ORGANIZATION_ADMIN', 'PLATFORM_ADMIN'].includes(req.user.role)) {
    throw new ForbiddenError('Organization administrator access is required');
  }

  if (!req.user.organizationId) {
    throw new ForbiddenError('An organization-linked account is required');
  }

  return {
    organizationId: req.user.organizationId,
    userId: req.user.id,
  };
}

export class PartnerIntegrationController {
  static async list(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getOrganizationContext(req);
      const integrations = await PartnerIntegrationService.list(context.organizationId);
      res.status(200).json({ success: true, data: integrations });
    } catch (error) {
      next(error);
    }
  }

  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getOrganizationContext(req);
      const integration = await PartnerIntegrationService.create(
        context.organizationId,
        context.userId,
        req.body
      );
      res.status(201).json({ success: true, data: integration });
    } catch (error) {
      next(error);
    }
  }

  static async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getOrganizationContext(req);
      const integration = await PartnerIntegrationService.updateStatus(
        context.organizationId,
        (req.params.id ?? ''),
        req.body.status
      );

      if (!integration) throw new NotFoundError('Partner integration not found');

      res.status(200).json({ success: true, data: integration });
    } catch (error) {
      next(error);
    }
  }
}

