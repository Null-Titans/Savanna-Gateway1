import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../../middleware/authenticate.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { PartnerIntegrationController } from './partnerIntegration.controller.js';

export const partnerIntegrationRouter = Router();

const createSchema = {
  body: z.object({
    name: z.string().trim().min(2).max(120),
    integrationType: z.enum(['lms', 'ats', 'ngo', 'university', 'employer_platform']),
    externalOrganizationRef: z.string().trim().max(160).optional(),
    callbackUrl: z.string().url().max(500).optional(),
  }).strict(),
};

const statusSchema = {
  body: z.object({
    status: z.enum(['pending', 'active', 'suspended']),
  }).strict(),
};

partnerIntegrationRouter.use(authenticate);
partnerIntegrationRouter.get('/', PartnerIntegrationController.list);
partnerIntegrationRouter.post('/', validateRequest(createSchema), PartnerIntegrationController.create);
partnerIntegrationRouter.patch('/:id/status', validateRequest(statusSchema), PartnerIntegrationController.updateStatus);
