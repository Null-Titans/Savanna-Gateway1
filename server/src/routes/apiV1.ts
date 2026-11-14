import { Router } from 'express';
import { healthRouter } from './health.js';

export const apiV1Router = Router();

// Mount Health Check under /api/v1/health
apiV1Router.use('/health', healthRouter);

// API v1 Metadata and Discovery Root
apiV1Router.get('/', (_req, res) => {
  res.json({
    name: 'Accessible Onboarding & Career Gateway API',
    version: 'v1',
    status: 'operational',
    docs: '/api/v1/openapi.yaml',
    endpoints: {
      health: '/api/v1/health',
      capabilities: '/api/v1/capabilities',
      widget: '/api/v1/widget/:widgetKey/config',
      onboarding: '/api/v1/onboarding/sessions',
      jobs: '/api/v1/jobs',
      auth: '/api/v1/org/auth/login',
    },
  });
});
