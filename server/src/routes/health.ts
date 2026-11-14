import { Router, type Request, type Response } from 'express';
import { getDatabaseHealth } from '../config/database.js';
import { env } from '../config/env.js';

export const healthRouter = Router();

healthRouter.get('/', async (_req: Request, res: Response) => {
  const dbHealth = await getDatabaseHealth();
  const isHealthy = dbHealth.connected;

  const payload = {
    status: isHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: env.NODE_ENV,
    version: '1.0.0',
    database: dbHealth,
  };

  const httpStatus = isHealthy || env.NODE_ENV !== 'production' ? 200 : 503;
  res.status(httpStatus).json(payload);
});
