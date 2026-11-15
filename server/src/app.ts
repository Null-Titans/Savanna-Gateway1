import express, { type Express, type Request } from 'express';
import type { IncomingMessage, ServerResponse } from 'http';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.js';
import { logger } from './shared/logger.js';
import {
  helmetMiddleware,
  corsMiddleware,
  standardLimiter,
} from './config/security.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { notFoundHandler } from './middleware/notFound.js';
import { errorHandler } from './middleware/errorHandler.js';
import { healthRouter } from './routes/health.js';
import { apiV1Router } from './routes/apiV1.js';
import { speechRouter } from './modules/speech/speech.routes.js';

export function createApp(): Express {
  const app = express();

  // 1. Request ID Attribution (Must precede logger)
  app.use(requestIdMiddleware);

  // 2. Structured HTTP Request Logging
  app.use(
    pinoHttp({
      logger,
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.headers.x-api-key',
          'req.body.password',
          'req.body.token',
          'req.body.refreshToken',
          'req.body.accessToken',
          'req.body.accommodationRequestNote',
          'res.headers.set-cookie',
        ],
        censor: '[REDACTED]',
      },
      genReqId: (req: IncomingMessage) =>
        (req as unknown as Request).id ??
        (req.headers['x-request-id'] as string) ??
        'req_unknown',
      customLogLevel: (_req: IncomingMessage, res: ServerResponse, err?: Error) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
      autoLogging: {
        ignore: (req: IncomingMessage) => Boolean(req.url?.endsWith('/health')),
      },
    })
  );

  // 3. Security Headers and Cross-Origin Configuration
  app.use(helmetMiddleware);
  app.use(corsMiddleware);

  // 4. Rate Limiting for Global API Protection
  app.use(standardLimiter);

  // 5. Body Parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true, limit: '1mb' }));

  // 6. Direct Root Health Check Endpoint
  app.use('/health', healthRouter);

  // 7. Mount Speech API Boundary (/api/speech)
  app.use('/api/speech', speechRouter);

  // 8. Mount Versioned API Gateway Router (/api/v1)
  app.use(env.API_PREFIX, apiV1Router);

  // 8. 404 Route Catch-All
  app.use(notFoundHandler);

  // 9. Centralized Error Handler (Must be registered last)
  app.use(errorHandler);

  return app;
}

export const app = createApp();

