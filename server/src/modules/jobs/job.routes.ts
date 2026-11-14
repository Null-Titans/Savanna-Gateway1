import { Router } from 'express';
import { z } from 'zod';
import { JobController } from './job.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { optionalAuthenticate, authenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { tenantContextMiddleware } from '../../middleware/tenantContext.js';

export const jobRouter = Router();
export const applicationRouter = Router();

const createJobSchema = {
  body: z.object({
    title: z.string().min(2, 'Job title is required').max(150),
    organization: z.string().min(2, 'Organization name is required').max(150),
    location: z.string().min(1, 'Location is required'),
    isRemote: z.boolean().optional(),
    employmentType: z
      .enum(['Full-time', 'Part-time', 'Apprenticeship', 'Contract', 'Fellowship'])
      .optional(),
    descriptionSummary: z.string().min(10, 'Description summary is required'),
    requiredSkills: z.array(z.string()).optional(),
    accommodationCategories: z.array(z.string()).optional(),
    accommodationsOffered: z.array(z.string()).optional(),
    accommodationDetails: z
      .object({
        workEnvironmentAccessibility: z.string().optional(),
        remoteOrFlexibleArrangements: z.string().optional(),
        assistiveTechnologyAvailable: z.string().optional(),
        communicationOptions: z.string().optional(),
        interviewAccommodations: z.string().optional(),
        applicationProcessAccommodations: z.string().optional(),
        additionalSupportOffered: z.string().optional(),
      })
      .optional(),
    applicationDeadline: z.string().optional(),
  }),
};

const submitAppSchema = {
  body: z.object({
    applicantName: z.string().min(1, 'Applicant name is required').max(100),
    contactValue: z.string().min(3, 'Valid contact information is required').max(120),
    relevantExperience: z.string().optional(),
    shareAccommodationRequest: z.boolean().optional(),
    accommodationRequestNote: z.string().optional(),
    explicitConsentToShare: z.boolean().optional(),
  }),
};

// 1. Public Job Board Endpoints
jobRouter.get('/', JobController.listJobs);
jobRouter.get('/:jobId', JobController.getJob);

// 2. Job Creation (Supports employer JWT or legacy post)
jobRouter.post(
  '/',
  optionalAuthenticate,
  tenantContextMiddleware,
  validateRequest(createJobSchema),
  JobController.createJob
);

// 3. Submit application for a job
jobRouter.post(
  '/:jobId/applications',
  validateRequest(submitAppSchema),
  JobController.submitApplication
);

// 4. Employer application review (requires employer/admin role)
jobRouter.get(
  '/:jobId/applications',
  authenticate,
  requireRole(['PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'EMPLOYER']),
  JobController.getEmployerApplications
);

// 5. Application Lookup (Learner status check)
applicationRouter.get('/:applicationId', JobController.getApplication);
