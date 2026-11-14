import { Router } from 'express';
import { z } from 'zod';
import { OnboardingController } from './onboarding.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { tenantContextMiddleware } from '../../middleware/tenantContext.js';

export const onboardingRouter = Router();

const startSessionSchema = {
  body: z.object({
    isSharedDevice: z.boolean().default(false),
    registrationMode: z.enum(['self', 'partner_assisted']).default('self'),
    widgetKey: z.string().optional(),
  }),
};

const updateDraftSchema = {
  body: z.object({
    isSharedDevice: z.boolean().nullable().optional(),
    registrationMode: z.enum(['self', 'partner_assisted']).optional(),
    fullName: z.string().optional(),
    contactMethod: z.enum(['phone', 'email', 'partner_contact', 'none']).optional(),
    contactValue: z.string().optional(),
    identityRoute: z
      .enum([
        'national_id',
        'refugee_id',
        'other_document',
        'no_documents',
        'partner_referral',
        'none',
        '',
      ])
      .optional(),
    identityReferenceNumber: z.string().optional(),
    partnerReferralOrg: z.string().optional(),
    supportPreferences: z.array(z.string()).optional(),
    supportNotes: z.string().optional(),
    stepIndex: z.number().int().min(0).optional(),
    stepKey: z.string().optional(),
    stepValue: z.unknown().optional(),
    partnerConsent: z
      .object({
        learnerConsented: z.boolean(),
        consentLanguage: z.string().optional(),
        partnerOrganizationName: z.string().optional(),
        representativeName: z.string().optional(),
        sharedFieldsSummary: z.array(z.string()).optional(),
        recordedAtIso: z.string(),
      })
      .optional(),
  }),
};

const submitDirectSchema = {
  body: z.object({
    isSharedDevice: z.boolean().nullable().optional(),
    registrationMode: z.enum(['self', 'partner_assisted']).default('self'),
    fullName: z.string().optional(),
    contactMethod: z.enum(['phone', 'email', 'partner_contact', 'none']).default('none'),
    contactValue: z.string().optional(),
    identityRoute: z
      .enum([
        'national_id',
        'refugee_id',
        'other_document',
        'no_documents',
        'partner_referral',
        'none',
        '',
      ])
      .optional(),
    identityReferenceNumber: z.string().optional(),
    partnerReferralOrg: z.string().optional(),
    supportPreferences: z.array(z.string()).optional(),
    supportNotes: z.string().optional(),
    partnerConsent: z
      .object({
        learnerConsented: z.boolean(),
        consentLanguage: z.string().optional(),
        partnerOrganizationName: z.string().optional(),
        representativeName: z.string().optional(),
        sharedFieldsSummary: z.array(z.string()).optional(),
        recordedAtIso: z.string(),
      })
      .optional(),
    updatedAtIso: z.string().optional(),
  }),
};

const supportRequestSchema = {
  body: z.object({
    sessionReference: z.string().min(1, 'sessionReference is required'),
    learnerName: z.string().optional(),
    contactMethod: z.string().optional(),
    contactValue: z.string().optional(),
    supportPreferences: z.array(z.string()).default([]),
    supportNotes: z.string().min(1, 'supportNotes is required'),
  }),
};

const smsResumeSchema = {
  body: z.object({
    phone: z.string().min(6, 'Valid phone number required'),
    draftToken: z.string().min(6, 'draftToken required'),
  }),
};

// 1. Session-based onboarding endpoints
onboardingRouter.post(
  '/sessions',
  tenantContextMiddleware,
  validateRequest(startSessionSchema),
  OnboardingController.startSession
);

onboardingRouter.get(
  '/sessions/:sessionId/draft',
  OnboardingController.getDraft
);

onboardingRouter.put(
  '/sessions/:sessionId/draft',
  validateRequest(updateDraftSchema),
  OnboardingController.updateDraft
);

onboardingRouter.post(
  '/sessions/:sessionId/submit',
  OnboardingController.submitSession
);

// 2. Direct submissions endpoint (frontend restAdapter.ts compatibility)
onboardingRouter.post(
  '/submissions',
  validateRequest(submitDirectSchema),
  OnboardingController.submitDirect
);

// 3. Private support requests walled off from employers
onboardingRouter.post(
  '/support-requests',
  tenantContextMiddleware,
  validateRequest(supportRequestSchema),
  OnboardingController.submitPrivateSupport
);

// 4. SMS Resume Recovery
onboardingRouter.post(
  '/resume-sms',
  validateRequest(smsResumeSchema),
  OnboardingController.requestSmsResume
);
