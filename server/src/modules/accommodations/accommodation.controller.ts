import type { Request, Response, NextFunction } from 'express';
import { AccommodationService } from './accommodation.service.js';
import { UnauthorizedError, ForbiddenError } from '../../shared/errors/index.js';

export class AccommodationController {
  static async submit(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication is required');
      if (req.user.role !== 'LEARNER') throw new ForbiddenError('Learner access is required');
      if (!req.user.organizationId) throw new UnauthorizedError('An organization-linked account is required');

      const result = await AccommodationService.submit(
        req.user.id,
        req.user.organizationId,
        req.body.category,
        req.body.details
      );

      res.status(201).json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }

  static async listMine(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) throw new UnauthorizedError('Authentication is required');
      if (req.user.role !== 'LEARNER') throw new ForbiddenError('Learner access is required');
      if (!req.user.organizationId) throw new UnauthorizedError('An organization-linked account is required');

      const requests = await AccommodationService.listMine(
        req.user.id,
        req.user.organizationId
      );

      res.status(200).json({ success: true, data: requests });
    } catch (error) {
      next(error);
    }
  }
}

