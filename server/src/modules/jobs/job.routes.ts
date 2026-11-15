import { Router } from 'express';
import { z } from 'zod';
import { JobController } from './job.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authenticate, optionalAuthenticate } from '../../middleware/authenticate.js';
import { requireRole } from '../../middleware/authorize.js';
import { requirePermission } from '../../shared/security/permissions.js';
import { tenantContextMiddleware, requireTenant } from '../../middleware/tenantContext.js';

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

// 2. Job Creation (authenticated and permission-protected)
jobRouter.post(
  '/',
  authenticate,
  requirePermission('jobs:create'),
  tenantContextMiddleware,
  requireTenant,
  validateRequest(createJobSchema),
  JobController.createJob
);
// 3. Submit application for a job
jobRouter.post(
  '/:jobId/applications',
  optionalAuthenticate,
  validateRequest(submitAppSchema),
  JobController.submitApplication
);

// 4. Employer application review (authenticated and tenant-scoped)
jobRouter.get(
  '/:jobId/applications',
  authenticate,
  requireRole(['PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'EMPLOYER']),
  requirePermission('applications:read'),
  tenantContextMiddleware,
  requireTenant,
  JobController.getEmployerApplications
);

// 5. Private application status lookup
applicationRouter.get(
  '/:applicationId',
  authenticate,
  requirePermission('applications:read'),
  JobController.getApplication
);

