import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { LearnerController } from './learner.controller.js';

export const learnerRouter = Router();

const updateProfileSchema = {
  body: z.object({
    displayName: z.string().trim().min(1).max(120).optional(),
    preferredLanguage: z.enum(['en', 'am', 'om']).optional(),
    education: z.string().max(2000).optional(),
    skills: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
    accessibilityPreferences: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
  }).strict(),
};

learnerRouter.get('/me', authenticate, LearnerController.getMe);
learnerRouter.patch('/me', authenticate, validateRequest(updateProfileSchema), LearnerController.updateMe);
