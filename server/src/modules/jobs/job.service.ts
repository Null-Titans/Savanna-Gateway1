import mongoose from 'mongoose';
import { JobListing, type IEmployerAccommodationDetails } from './job.model.js';
import { Application } from './application.model.js';
import { NotFoundError, ValidationError, ForbiddenError } from '../../shared/errors/index.js';
import type { SubmissionReceipt } from '../onboarding/onboarding.service.js';
import { encrypt } from '../../shared/utils/crypto.js';

const PROHIBITED_MEDICAL_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\b(diagnosis|diagnoses|diagnosed)\b/i, label: 'diagnosis' },
  {
    pattern: /\b(medical\s+proof|medical\s+certificate|doctor'?s?\s+note|physician\s+letter)\b/i,
    label: 'medical proof',
  },
  {
    pattern: /\b(disability\s+certificate|disability\s+card|disability\s+type|disability\s+category)\b/i,
    label: 'disability type or certificate',
  },
  {
    pattern: /\b(prove\s+your\s+disability|proof\s+of\s+disability|icd-?10|medical\s+records?)\b/i,
    label: 'medical records or proof',
  },
  {
    pattern: /\b(state\s+your\s+condition|name\s+your\s+illness|disclose\s+your\s+disability)\b/i,
    label: 'forced disclosure',
  },
];

/**
 * Validates employer text fields against prohibited medical proof requirements.
 */
export function validateEmployerSafeguards(fields: Record<string, string | undefined>): void {
  for (const [field, value] of Object.entries(fields)) {
    if (!value) continue;
    for (const rule of PROHIBITED_MEDICAL_PATTERNS) {
      if (rule.pattern.test(value)) {
        throw new ValidationError(
          `Safeguard violation in '${field}': Asking for "${rule.label}" is prohibited under accessibility safeguards. Describe the workplace adjustment or accommodation your team provides instead.`
        );
      }
    }
  }
}

export interface ListJobsQuery {
  q?: string;
  accommodations?: string | string[];
  employmentType?: string;
  isRemote?: boolean | string;
  page?: number;
  limit?: number;
}

export interface CreateJobInput {
  title: string;
  organization: string;
  location: string;
  isRemote?: boolean;
  employmentType?: 'Full-time' | 'Part-time' | 'Apprenticeship' | 'Contract' | 'Fellowship';
  descriptionSummary: string;
  requiredSkills?: string[];
  accommodationCategories?: string[];
  accommodationsOffered?: string[];
  accommodationDetails?: Partial<IEmployerAccommodationDetails>;
  applicationDeadline?: string;
  employerId?: string;
  organizationId?: string;
}

export interface SubmitApplicationInput {
  jobId: string;
  applicantUserId?: string;
  applicantName: string;
  contactValue: string;
  relevantExperience?: string;
  shareAccommodationRequest?: boolean;
  accommodationRequestNote?: string;
  explicitConsentToShare?: boolean;
}

export class JobService {
  /**
   * Searches published jobs.
   * Note: Accommodation filter is applied in memory / query only, NEVER persisted to applicant profile.
   */
  public static async listJobs(query: ListJobsQuery): Promise<{
    jobs: Record<string, unknown>[];
    total: number;
    page: number;
    limit: number;
  }> {
    const filter: Record<string, unknown> = { status: 'published' };

    if (query.q && query.q.trim()) {
      const regex = new RegExp(query.q.trim(), 'i');
      filter['$or'] = [
        { title: regex },
        { organization: regex },
        { descriptionSummary: regex },
        { requiredSkills: regex },
      ];
    }

    if (query.accommodations) {
      const categories = Array.isArray(query.accommodations)
        ? query.accommodations
        : query.accommodations.split(',').map((c) => c.trim()).filter(Boolean);

      if (categories.length > 0) {
        filter['accommodationCategories'] = { $in: categories };
      }
    }

    if (query.isRemote !== undefined) {
      const isRemoteBool =
        typeof query.isRemote === 'boolean'
          ? query.isRemote
          : query.isRemote === 'true';
      filter['isRemote'] = isRemoteBool;
    }

    if (query.employmentType) {
      filter['employmentType'] = query.employmentType;
    }

    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const [total, docs] = await Promise.all([
      JobListing.countDocuments(filter).exec(),
      JobListing.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
    ]);

    const jobs = docs.map((doc) => doc.toSafePosting());

    return { jobs, total, page, limit };
  }

  /**
   * Retrieves a single job listing by ID
   */
  public static async getJobById(jobId: string): Promise<Record<string, unknown>> {
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new NotFoundError(`Job listing '${jobId}' not found`);
    }

    const job = await JobListing.findOne({ _id: jobId, status: 'published' }).exec();
    if (!job) {
      throw new NotFoundError(`Job listing '${jobId}' not found`);
    }

    return job.toSafePosting();
  }

  /**
   * Creates a new job posting with strict Addendum D4 safeguards enforcement.
   */
  public static async createJob(input: CreateJobInput): Promise<Record<string, unknown>> {
    // Enforce employer safeguards: Block medical proof, diagnosis, disability certificate requests
    validateEmployerSafeguards({
      descriptionSummary: input.descriptionSummary,
      workEnvironmentAccessibility: input.accommodationDetails?.workEnvironmentAccessibility,
      interviewAccommodations: input.accommodationDetails?.interviewAccommodations,
      applicationProcessAccommodations: input.accommodationDetails?.applicationProcessAccommodations,
      additionalSupportOffered: input.accommodationDetails?.additionalSupportOffered,
    });

    const job = new JobListing({
      employerId: input.employerId ? new mongoose.Types.ObjectId(input.employerId) : undefined,
      organizationId: input.organizationId ? new mongoose.Types.ObjectId(input.organizationId) : undefined,
      title: input.title.trim(),
      organization: input.organization.trim(),
      location: input.location.trim(),
      isRemote: Boolean(input.isRemote),
      employmentType: input.employmentType ?? 'Full-time',
      descriptionSummary: input.descriptionSummary.trim(),
      requiredSkills: input.requiredSkills ?? [],
      accommodationCategories: input.accommodationCategories ?? [],
      accommodationsOffered: input.accommodationsOffered ?? [],
      accommodationDetails: {
        workEnvironmentAccessibility: input.accommodationDetails?.workEnvironmentAccessibility ?? '',
        remoteOrFlexibleArrangements: input.accommodationDetails?.remoteOrFlexibleArrangements ?? '',
        assistiveTechnologyAvailable: input.accommodationDetails?.assistiveTechnologyAvailable ?? '',
        communicationOptions: input.accommodationDetails?.communicationOptions ?? '',
        interviewAccommodations: input.accommodationDetails?.interviewAccommodations ?? '',
        applicationProcessAccommodations: input.accommodationDetails?.applicationProcessAccommodations ?? '',
        additionalSupportOffered: input.accommodationDetails?.additionalSupportOffered ?? '',
      },
      applicationDeadline: input.applicationDeadline,
      postedAtIso: new Date().toISOString(),
      status: 'published',
      isDemoData: false,
    });

    await job.save();
    return job.toSafePosting();
  }

  /**
   * Submits a job application.
   * Upholds privacy: accommodation notes are segregated and protected.
   */
  public static async submitApplication(input: SubmitApplicationInput): Promise<SubmissionReceipt> {
    if (!mongoose.Types.ObjectId.isValid(input.jobId)) {
      throw new NotFoundError('Target job listing not found');
    }

    const job = await JobListing.findById(input.jobId).exec();
    if (!job) {
      throw new NotFoundError('Target job listing not found');
    }

    if (job.status !== 'published') {
      throw new ValidationError('Applications are not open for this job');
    }

    if (job.applicationDeadline) {
      const deadline = Date.parse(job.applicationDeadline);
      if (!Number.isFinite(deadline)) {
        throw new ValidationError('The job application deadline is invalid');
      }
      if (Date.now() > deadline) {
        throw new ValidationError('The application deadline has passed');
      }
    }

    const application = new Application({
      jobId: job._id,
      applicantUserId: input.applicantUserId && mongoose.Types.ObjectId.isValid(input.applicantUserId) ? new mongoose.Types.ObjectId(input.applicantUserId) : undefined,
      applicantName: input.applicantName.trim(),
      contactValue: input.contactValue.trim(),
      relevantExperience: input.relevantExperience?.trim() ?? '',
      shareAccommodationRequest: Boolean(input.shareAccommodationRequest),
      accommodationRequestNote: input.accommodationRequestNote?.trim() ? encrypt(input.accommodationRequestNote.trim()) : '',
      explicitConsentToShare: Boolean(input.explicitConsentToShare),
      status: 'submitted',
      statusHistory: [{ status: 'submitted', changedAt: new Date() }],
      submittedAtIso: new Date().toISOString(),
    });

    await application.save();

    return {
      id: application._id.toString(),
      submittedAtIso: application.submittedAtIso,
      mode: 'real',
      persistedToServer: true,
      notice: 'Your application has been received. The hiring team will review your profile.',
    };
  }

  /**
   * Retrieves an application by ID (learner view)
   */
  public static async getApplicationById(applicationId: string, userId: string): Promise<Record<string, unknown>> {
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      throw new NotFoundError('Application not found');
    }

    const app = await Application.findOne({ _id: applicationId, applicantUserId: userId }).exec();
    if (!app) {
      throw new NotFoundError('Application not found');
    }

    return app.toLearnerView();
  }

  /**
   * Retrieves applications for employer review (strictly privacy-segregated view)
   */
  public static async getEmployerApplications(jobId: string, user: { id: string; organizationId?: string; role: string }): Promise<Record<string, unknown>[]> {
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      throw new NotFoundError('Job listing not found');
    }

    const job = await JobListing.findById(jobId).exec();
    if (!job) throw new NotFoundError('Job listing not found');

    const isPlatformAdmin = user.role === 'PLATFORM_ADMIN';
    const sameOrganization = Boolean(job.organizationId && user.organizationId && job.organizationId.toString() === user.organizationId);
    const sameEmployer = Boolean(job.employerId && job.employerId.toString() === user.id);

    if (!isPlatformAdmin && !sameOrganization && !sameEmployer) {
      throw new ForbiddenError('You cannot access applications for this job');
    }

    const apps = await Application.find({ jobId: new mongoose.Types.ObjectId(jobId) })
      .sort({ createdAt: -1 })
      .exec();

    return apps.map((app) => app.toEmployerSafeView());
  }
}


