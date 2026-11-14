import type { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { UnauthorizedError } from '../../shared/errors/index.js';

export class AuthController {
  /**
   * POST /api/v1/auth/register or /api/v1/org/auth/register
   * Registers a new organization member or admin.
   */
  public static async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await AuthService.register(req.body);
      sendSuccess(
        res,
        result,
        { notice: 'Account created successfully.' },
        201
      );
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/login or /api/v1/org/auth/login
   * Validates credentials and returns JWT access token + refresh token.
   */
  public static async login(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await AuthService.login(req.body);
      sendSuccess(res, result, { notice: 'Authentication successful.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/refresh or /api/v1/org/auth/refresh
   * Rotates refresh token and issues fresh access token.
   */
  public static async refresh(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const refreshToken =
        req.body?.refreshToken || (req.headers['x-refresh-token'] as string);

      if (!refreshToken) {
        throw new UnauthorizedError('Refresh token is required');
      }

      const tokens = await AuthService.refreshTokens(refreshToken);
      sendSuccess(res, tokens, { notice: 'Token pair refreshed successfully.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/auth/logout or /api/v1/org/auth/logout
   * Revokes refresh token session.
   */
  public static async logout(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const refreshToken =
        req.body?.refreshToken || (req.headers['x-refresh-token'] as string);

      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }

      sendSuccess(res, { loggedOut: true }, { notice: 'Session terminated.' });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/auth/me
   * Returns current authenticated user and permissions.
   */
  public static async getProfile(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User session not authenticated');
      }

      const profile = {
        user: req.user,
        tenant: req.tenant ?? null,
      };

      sendSuccess(res, profile);
    } catch (err) {
      next(err);
    }
  }
}
