import type { Request, Response, NextFunction } from 'express';
import { LearnerService } from './learner.service.js';
import { UnauthorizedError, ForbiddenError } from '../../shared/errors/index.js';

export class LearnerController {
  static async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication is required');
      if (req.user.role !== 'LEARNER') throw new ForbiddenError('Learner access is required');
      if (!req.user.organizationId) throw new UnauthorizedError('An organization-linked account is required');
      const profile = await LearnerService.getProfile(req.user.id, req.user.organizationId);
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }

  static async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication is required');
      if (req.user.role !== 'LEARNER') throw new ForbiddenError('Learner access is required');
      if (!req.user.organizationId) throw new UnauthorizedError('An organization-linked account is required');
      const profile = await LearnerService.updateProfile(
        req.user.id,
        req.user.organizationId,
        req.body
      );
      res.status(200).json({ success: true, data: profile });
    } catch (error) {
      next(error);
    }
  }
}

