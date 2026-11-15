import type { Request, Response } from 'express';
import helmet from 'helmet';
import cors, { type CorsOptions } from 'cors';
import rateLimit, { type RateLimitRequestHandler } from 'express-rate-limit';
import { env } from './env.js';

/**
 * Helmet Security Middleware Configuration
 */
export const helmetMiddleware = helmet({
  contentSecurityPolicy: false, // Widget and API friendly
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: env.NODE_ENV === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false,
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

/**
 * CORS Configuration
 * Allows configuring single origins, multiple origins (comma-separated), or wildcards.
 */
function resolveCorsOrigins(): string[] | boolean {
  const configured = env.CORS_ORIGIN.trim();

  // Never allow wildcard origins in production.
  if (configured === '*') {
    return env.NODE_ENV === 'production' ? false : true;
  }

  return configured
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const corsOptions: CorsOptions = {
  origin: resolveCorsOrigins(),
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Request-Id',
    'X-Api-Key',
  'X-Organization-ID',
  'X-Tenant-ID',
    'Accept',
  ],
  exposedHeaders: ['X-Request-Id', 'Retry-After', 'Content-Length'],
  credentials: false,
  maxAge: 86400, // 24 hours preflight cache
};

export const corsMiddleware = cors(corsOptions);

/**
 * Standard Rate Limit Error Response Handler
 */
const rateLimitHandler = (_req: Request, res: Response): void => {
  const retryAfter = res.getHeader('Retry-After') ?? '60';
  res.status(429).json({
    success: false,
    error: {
      code: 'RATE_LIMITED',
      message: `Too many requests from this IP. Please retry in ${retryAfter} seconds.`,
      details: [],
    },
    message: `Too many requests from this IP. Please retry in ${retryAfter} seconds.`,
  });
};

/**
 * Global API Rate Limiter
 * 15 minutes window, 200 requests in dev/test, 100 in production.
 */
export const standardLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'production' ? 100 : 300,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: () => env.NODE_ENV === 'test',
});

/**
 * Stricter Rate Limiter for Authentication and Sensitive Endpoints
 * (e.g. login, token refresh)
 */
export const authLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'production' ? 10 : 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: () => env.NODE_ENV === 'test',
});

/**
 * SMS Resume and Submission Rate Limiter
 */
export const submissionLimiter: RateLimitRequestHandler = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: env.NODE_ENV === 'production' ? 30 : 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
  skip: () => env.NODE_ENV === 'test',
});

