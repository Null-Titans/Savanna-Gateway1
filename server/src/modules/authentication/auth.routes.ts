import { Router } from 'express';
import { z } from 'zod';
import { AuthController } from './auth.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authenticate } from '../../middleware/authenticate.js';
import { tenantContextMiddleware } from '../../middleware/tenantContext.js';

export const authRouter = Router();

const registerSchema = {
  body: z.object({
    email: z.string().email('Valid email address is required'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long')
      .max(100),
    firstName: z.string().min(1, 'First name is required').max(60),
    lastName: z.string().min(1, 'Last name is required').max(60),
    role: z
      .enum([
        'ORGANIZATION_ADMIN',
        'ORGANIZATION_MEMBER',
        'EMPLOYER',
        'PARTNER',
      ])
      .optional(),
    organizationId: z.string().optional(),
    organizationSlug: z.string().optional(),
  }),
};

const loginSchema = {
  body: z.object({
    email: z.string().email('Valid email address is required'),
    password: z.string().min(1, 'Password is required'),
    organizationId: z.string().optional(),
  }),
};

const refreshSchema = {
  body: z.object({
    refreshToken: z.string().min(10, 'Refresh token is required').optional(),
  }),
};

authRouter.post(
  '/register',
  tenantContextMiddleware,
  validateRequest(registerSchema),
  AuthController.register
);

authRouter.post(
  '/login',
  tenantContextMiddleware,
  validateRequest(loginSchema),
  AuthController.login
);

authRouter.post(
  '/refresh',
  validateRequest(refreshSchema),
  AuthController.refresh
);

authRouter.post(
  '/logout',
  AuthController.logout
);

authRouter.get(
  '/me',
  authenticate,
  tenantContextMiddleware,
  AuthController.getProfile
);
