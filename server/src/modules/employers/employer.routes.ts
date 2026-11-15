import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { EmployerController } from './employer.controller.js';

export const employerRouter = Router();

const updateProfileSchema = {
  body: z.object({
    companyName: z.string().trim().min(2).max(160).optional(),
    website: z.string().url().max(300).optional(),
    industry: z.string().trim().max(120).optional(),
    description: z.string().trim().max(3000).optional(),
    contactName: z.string().trim().max(120).optional(),
    contactEmail: z.string().email().max(254).optional(),
    phone: z.string().trim().max(40).optional(),
  }).strict(),
};

employerRouter.get('/me', authenticate, EmployerController.getMe);

employerRouter.patch(
  '/me',
  authenticate,
  validateRequest(updateProfileSchema),
  EmployerController.updateMe
);
