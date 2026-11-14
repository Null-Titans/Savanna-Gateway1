import type { Request, Response, NextFunction } from 'express';
import { OnboardingService } from './onboarding.service.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/index.js';

export class OnboardingController {
  /**
   * POST /api/v1/onboarding/sessions
   * Creates a server-side onboarding session with resume token.
   */
  public static async startSession(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { isSharedDevice = false, registrationMode = 'self', widgetKey } = req.body;
      const organizationId = req.tenant?.id;

      const result = await OnboardingService.startSession({
        isSharedDevice,
        registrationMode,
        widgetKey,
        organizationId,
      });

      sendSuccess(res, result, {}, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/onboarding/sessions/:sessionId/draft
   * Retrieves draft state by session ID and optional resume token.
   */
  public static async getDraft(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        throw new ValidationError('sessionId is required');
      }

      const draftToken =
        (req.query['draftToken'] as string) ||
        (req.headers['x-draft-token'] as string);

      const draft = await OnboardingService.getDraft(sessionId, draftToken);
      sendSuccess(res, draft);
    } catch (err) {
      next(err);
    }
  }

  /**
   * PUT /api/v1/onboarding/sessions/:sessionId/draft
   * Updates / autosaves current draft step.
   */
  public static async updateDraft(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        throw new ValidationError('sessionId is required');
      }

      const updatedDraft = await OnboardingService.updateDraft(sessionId, req.body);
      sendSuccess(res, updatedDraft);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/onboarding/sessions/:sessionId/submit
   * Submits a completed onboarding session.
   */
  public static async submitSession(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { sessionId } = req.params;
      if (!sessionId) {
        throw new ValidationError('sessionId is required');
      }

      const receipt = await OnboardingService.submitSession(
        sessionId,
        req.body?.partnerConsent
      );

      // Support dual response format for restAdapter
      const payload = {
        ...receipt,
        success: true,
        data: receipt,
        meta: {},
      };

      res.status(200).json(payload);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/onboarding/submissions
   * Legacy direct submission endpoint for frontend restAdapter.ts compatibility.
   */
  public static async submitDirect(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const receipt = await OnboardingService.submitDirect(req.body);

      // Dual compatibility payload
      const payload = {
        ...receipt,
        success: true,
        data: receipt,
        meta: {},
      };

      res.status(200).json(payload);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/onboarding/support-requests
   * Captures private support & accommodation requests walled off from employers.
   */
  public static async submitPrivateSupport(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const result = await OnboardingService.submitPrivateSupport({
        ...req.body,
        organizationId: req.tenant?.id,
      });

      sendSuccess(res, result, {}, 201);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/onboarding/resume-sms
   * Requests one-time resume code sent via SMS.
   */
  public static async requestSmsResume(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { phone, draftToken } = req.body;
      const result = await OnboardingService.requestSmsResume(phone, draftToken);

      const payload = {
        ...result,
        success: true,
        data: result,
        meta: {},
      };

      res.status(200).json(payload);
    } catch (err) {
      next(err);
    }
  }
}
