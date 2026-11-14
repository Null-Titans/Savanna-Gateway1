import { Router } from 'express';
import { z } from 'zod';
import { OrganizationController } from './organization.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authenticate } from '../../middleware/authenticate.js';
import { requireRole, requireSameTenantOrPlatformAdmin } from '../../middleware/authorize.js';
import { tenantContextMiddleware, requireTenant } from '../../middleware/tenantContext.js';

export const organizationRouter = Router();

const createOrgSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must have at least 2 characters').max(120),
    slug: z
      .string()
      .min(2)
      .max(60)
      .regex(
        /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
        'Slug must consist of lowercase letters, numbers, and single hyphens'
      ),
    branding: z
      .object({
        logoUrl: z.string().url().optional(),
        theme: z.enum(['light', 'dark', 'high_contrast', 'system']).optional(),
        primaryColor: z
          .string()
          .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, 'Must be a valid hex color')
          .optional(),
        secondaryColor: z.string().optional(),
        accentColor: z.string().optional(),
        backgroundColor: z.string().optional(),
        customCss: z.string().optional(),
      })
      .optional(),
    settings: z
      .object({
        supportedLanguages: z
          .array(z.string())
          .min(1, 'At least one supported language is required')
          .optional(),
        defaultLanguage: z.string().optional(),
        accessibilityMode: z
          .object({
            highContrastDefault: z.boolean().optional(),
            screenReaderOptimized: z.boolean().optional(),
            simplifiedUI: z.boolean().optional(),
          })
          .optional(),
        allowGuestOnboarding: z.boolean().optional(),
      })
      .optional(),
  }),
};

const updateOrgSchema = {
  body: z.object({
    name: z.string().min(2).max(120).optional(),
    branding: z
      .object({
        logoUrl: z.string().url().optional(),
        theme: z.enum(['light', 'dark', 'high_contrast', 'system']).optional(),
        primaryColor: z
          .string()
          .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
          .optional(),
        secondaryColor: z.string().optional(),
        accentColor: z.string().optional(),
        backgroundColor: z.string().optional(),
        customCss: z.string().optional(),
      })
      .optional(),
    settings: z
      .object({
        supportedLanguages: z.array(z.string()).min(1).optional(),
        defaultLanguage: z.string().optional(),
        accessibilityMode: z
          .object({
            highContrastDefault: z.boolean().optional(),
            screenReaderOptimized: z.boolean().optional(),
            simplifiedUI: z.boolean().optional(),
          })
          .optional(),
        allowGuestOnboarding: z.boolean().optional(),
      })
      .optional(),
  }),
};

const createApiKeySchema = {
  body: z.object({
    name: z.string().min(2, 'Key name must have at least 2 characters').max(80),
    keyType: z.enum(['public_widget', 'secret_admin']),
    scopes: z.array(z.string()).optional(),
  }),
};

// 1. Public branding and configuration endpoint (No auth required - used by learner onboarding widgets)
organizationRouter.get(
  '/public-config',
  tenantContextMiddleware,
  OrganizationController.getPublicConfig
);

// 2. Create organization (Permitted for initial onboarding or PLATFORM_ADMIN)
organizationRouter.post(
  '/',
  validateRequest(createOrgSchema),
  OrganizationController.create
);

// 3. Current tenant operations (requires authentication + tenant context)
organizationRouter.get(
  '/current',
  authenticate,
  tenantContextMiddleware,
  requireTenant,
  requireSameTenantOrPlatformAdmin,
  OrganizationController.getCurrent
);

organizationRouter.patch(
  '/current',
  authenticate,
  tenantContextMiddleware,
  requireTenant,
  requireSameTenantOrPlatformAdmin,
  requireRole(['PLATFORM_ADMIN', 'ORGANIZATION_ADMIN']),
  validateRequest(updateOrgSchema),
  OrganizationController.updateCurrent
);

// 4. API Key management for organization
organizationRouter.post(
  '/current/api-keys',
  authenticate,
  tenantContextMiddleware,
  requireTenant,
  requireSameTenantOrPlatformAdmin,
  requireRole(['PLATFORM_ADMIN', 'ORGANIZATION_ADMIN']),
  validateRequest(createApiKeySchema),
  OrganizationController.createApiKey
);

organizationRouter.delete(
  '/current/api-keys/:keyId',
  authenticate,
  tenantContextMiddleware,
  requireTenant,
  requireSameTenantOrPlatformAdmin,
  requireRole(['PLATFORM_ADMIN', 'ORGANIZATION_ADMIN']),
  OrganizationController.revokeApiKey
);
