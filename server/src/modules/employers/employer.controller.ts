import type { Request, Response, NextFunction } from 'express';
import { EmployerService } from './employer.service.js';
import { ForbiddenError, UnauthorizedError } from '../../shared/errors/index.js';

function getEmployerContext(req: Request) {
  if (!req.user) {
    throw new UnauthorizedError('Authentication is required');
  }

  if (!['EMPLOYER', 'ORGANIZATION_ADMIN'].includes(req.user.role)) {
    throw new ForbiddenError('Employer access is required');
  }

  if (!req.user.organizationId) {
    throw new ForbiddenError('An organization-linked account is required');
  }

  return {
    userId: req.user.id,
    organizationId: req.user.organizationId,
  };
}

export class EmployerController {
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getEmployerContext(req);
      const profile = await EmployerService.getProfile(
        context.userId,
        context.organizationId
      );

      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getEmployerContext(req);
      const profile = await EmployerService.updateProfile(
        context.userId,
        context.organizationId,
        req.body
      );

      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }
}
