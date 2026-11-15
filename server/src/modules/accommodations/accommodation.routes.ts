import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { AccommodationController } from './accommodation.controller.js';

export const accommodationRouter = Router();

const submitSchema = {
  body: z.object({
    category: z.string().trim().min(2).max(80),
    details: z.string().trim().min(5).max(5000),
  }).strict(),
};

accommodationRouter.post('/', authenticate, validateRequest(submitSchema), AccommodationController.submit);
accommodationRouter.get('/mine', authenticate, AccommodationController.listMine);
