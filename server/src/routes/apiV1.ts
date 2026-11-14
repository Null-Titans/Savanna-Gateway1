import { Router, type Request, type Response } from 'express';
import { healthRouter } from './health.js';
import { authRouter } from '../modules/authentication/auth.routes.js';
import { organizationRouter } from '../modules/organizations/organization.routes.js';
import { onboardingRouter } from '../modules/onboarding/onboarding.routes.js';
import { jobRouter, applicationRouter } from '../modules/jobs/job.routes.js';
import { speechRouter } from '../modules/speech/speech.routes.js';
import { SpeechService } from '../modules/speech/speech.service.js';
import { Organization } from '../modules/organizations/organization.model.js';
import { hashSha256 } from '../shared/utils/crypto.js';

export const apiV1Router = Router();

// 1. Health Check (/api/v1/health)
apiV1Router.use('/health', healthRouter);

// 2. Server Capabilities Flag Endpoint (/api/v1/capabilities)
apiV1Router.get('/capabilities', (_req: Request, res: Response) => {
  const isSpeechConfigured = SpeechService.isConfigured();
  const caps = {
    serverDraftsEnabled: true,
    smsResumeEnabled: true,
    jobBoardEnabled: true,
    speechServiceEnabled: isSpeechConfigured,
    supportedLanguages: ['en', 'am', 'om'],
    apiVersions: ['v1'],
  };

  // Dual format: Top-level properties for restAdapter compatibility + { success, data, meta }
  res.status(200).json({
    ...caps,
    success: true,
    data: caps,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});

// 3. Widget Public Configuration (/api/v1/widget/:widgetKey/config)
apiV1Router.get('/widget/:widgetKey/config', async (req: Request, res: Response) => {
  try {
    const { widgetKey } = req.params;
    let org = null;

    if (widgetKey) {
      const match = await Organization.findByApiKeyHash(hashSha256(widgetKey));
      if (match) {
        org = match.organization;
      } else {
        org = await Organization.findBySlugOrId(widgetKey);
      }
    }

    // Fallback: If not found, use first active organization or default branding
    if (!org) {
      org = await Organization.findOne({ status: 'active' }).exec();
    }

    const orgName = org?.name ?? 'Savanna Career Gateway';
    const primaryColor = org?.branding?.primaryColor ?? '#1A73E8';
    const logoUrl = org?.branding?.logoUrl ?? '';
    const supportedLanguages = org?.settings?.supportedLanguages ?? ['en', 'am', 'om'];
    const defaultLanguage = org?.settings?.defaultLanguage ?? 'en';

    const widgetConfig = {
      organizationName: orgName,
      primaryColor,
      logoUrl,
      welcomeMessage: `Welcome to ${orgName} — let's get you started.`,
      enableSmsResume: true,
      enablePartnerReferral: true,
      jobBoardEnabled: true,
      supportedLanguages,
      defaultLanguage,
    };

    res.status(200).json({
      ...widgetConfig,
      success: true,
      data: widgetConfig,
      meta: {},
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: {
        code: 'WIDGET_CONFIG_ERROR',
        message: err instanceof Error ? err.message : 'Failed to retrieve widget config',
        details: [],
      },
      message: 'Failed to retrieve widget config',
    });
  }
});

// 4. Onboarding Endpoints (/api/v1/onboarding/*)
apiV1Router.use('/onboarding', onboardingRouter);

// 5. Job Board & Applications (/api/v1/jobs/* & /api/v1/applications/*)
apiV1Router.use('/jobs', jobRouter);
apiV1Router.use('/applications', applicationRouter);

// 6. Organization Authentication (/api/v1/auth/* & /api/v1/org/auth/*)
apiV1Router.use('/auth', authRouter);
apiV1Router.use('/org/auth', authRouter);

// 7. Organization Management (/api/v1/organizations/* & /api/v1/org/*)
apiV1Router.use('/organizations', organizationRouter);
apiV1Router.use('/org', organizationRouter);

// 8. Speech Integration Boundary (/api/v1/speech/*)
apiV1Router.use('/speech', speechRouter);

// 9. API Discovery Root (/api/v1)
apiV1Router.get('/', (_req: Request, res: Response) => {
  const discovery = {
    name: 'Accessible Onboarding & Career Gateway API',
    version: 'v1',
    status: 'operational',
    docs: '/api/v1/openapi.yaml',
    endpoints: {
      health: '/api/v1/health',
      capabilities: '/api/v1/capabilities',
      widgetConfig: '/api/v1/widget/:widgetKey/config',
      onboardingSessions: '/api/v1/onboarding/sessions',
      onboardingSubmissions: '/api/v1/onboarding/submissions',
      jobs: '/api/v1/jobs',
      applications: '/api/v1/applications',
      auth: '/api/v1/auth/login',
      organizations: '/api/v1/organizations/public-config',
      speech: '/api/v1/speech/capabilities',
    },
  };

  res.status(200).json({
    ...discovery,
    success: true,
    data: discovery,
    meta: {
      timestamp: new Date().toISOString(),
    },
  });
});
