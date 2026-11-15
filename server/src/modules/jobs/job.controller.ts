import type { Request, Response, NextFunction } from 'express';
import { JobService } from './job.service.js';
import { sendSuccess } from '../../shared/utils/response.js';
import { ValidationError } from '../../shared/errors/index.js';

export class JobController {
  /**
   * GET /api/v1/jobs
   * Public accessible job search.
   */
  public static async listJobs(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { q, accommodations, employmentType, isRemote, page, limit, format } = req.query;

      const result = await JobService.listJobs({
        q: q as string | undefined,
        accommodations: accommodations as string | string[] | undefined,
        employmentType: employmentType as string | undefined,
        isRemote: isRemote as string | boolean | undefined,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      // If caller specifically requested raw array (e.g. simple REST client adapter)
      if (format === 'array') {
        res.status(200).json(result.jobs);
        return;
      }

      sendSuccess(res, result.jobs, {
        total: result.total,
        page: result.page,
        limit: result.limit,
      });
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/jobs/:jobId
   * Retrieves single job details.
   */
  public static async getJob(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { jobId } = req.params;
      if (!jobId) {
        throw new ValidationError('jobId parameter is required');
      }

      const job = await JobService.getJobById(jobId);
      sendSuccess(res, job);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/jobs
   * Creates a job listing with Addendum D4 safeguards.
   */
  public static async createJob(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const job = await JobService.createJob({
        ...req.body,
        employerId: req.user?.id,
        organizationId: req.tenant?.id,
      });

      // Dual compatibility for restAdapter
      const payload = {
        ...job,
        success: true,
        data: job,
        meta: {},
      };

      res.status(201).json(payload);
    } catch (err) {
      next(err);
    }
  }

  /**
   * POST /api/v1/jobs/:jobId/applications
   * Submits a job application with strict privacy boundaries.
   */
  public static async submitApplication(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { jobId } = req.params;
      if (!jobId) {
        throw new ValidationError('jobId is required');
      }

      const receipt = await JobService.submitApplication({
        ...req.body,
        jobId,
        applicantUserId: req.user?.id,
      });

      // Dual compatibility payload
      const payload = {
        ...receipt,
        success: true,
        data: receipt,
        meta: {},
      };

      res.status(201).json(payload);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/applications/:applicationId
   * Retrieves status for a submitted application.
   */
  public static async getApplication(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { applicationId } = req.params;
      if (!applicationId) {
        throw new ValidationError('applicationId is required');
      }

      const app = await JobService.getApplicationById(applicationId, req.user!.id);
      sendSuccess(res, app);
    } catch (err) {
      next(err);
    }
  }

  /**
   * GET /api/v1/employer/jobs/:jobId/applications or /api/v1/jobs/:jobId/applications
   * Employer review: strictly privacy-segregated.
   */
  public static async getEmployerApplications(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { jobId } = req.params;
      if (!jobId) {
        throw new ValidationError('jobId is required');
      }

      const apps = await JobService.getEmployerApplications(jobId, { id: req.user!.id, organizationId: req.user!.organizationId, role: req.user!.role });
      sendSuccess(res, apps, { total: apps.length });
    } catch (err) {
      next(err);
    }
  }
}

