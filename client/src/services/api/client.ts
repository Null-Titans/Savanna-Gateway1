import { getEnvConfig } from '../../config/env';
import {
  AccommodationCategory,
  ApiCapabilities,
  JobApplicationDraft,
  JobPosting,
  LearnerProfile,
  OnboardingDraft,
  SubmissionReceipt,
  SupportPreference,
} from '../../types/gateway';
import { mockAdapter } from './mockAdapter';
import { createRestAdapter } from './restAdapter';

export type ApiMode = 'mock' | 'real';

class GatewayApiClient {
  private mode: ApiMode;
  private baseUrl: string;

  constructor() {
    const env = getEnvConfig();
    this.baseUrl = env.apiBaseUrl;
    this.mode = env.defaultApiMode;
  }

  getMode(): ApiMode {
    return this.mode;
  }

  setMode(nextMode: ApiMode): void {
    this.mode = nextMode;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url.trim().replace(/\/+$/, '');
  }

  private getAdapter() {
    if (this.mode === 'real') {
      return createRestAdapter(this.baseUrl);
    }
    return mockAdapter;
  }

  getCapabilities(): Promise<ApiCapabilities> {
    return this.getAdapter().getCapabilities();
  }

  listJobs(query?: string, categories?: AccommodationCategory[]): Promise<JobPosting[]> {
    return this.getAdapter().listJobs(query, categories);
  }

  createEmployerJob(
    jobInput: Omit<JobPosting, 'id' | 'postedAtIso' | 'isDemoData'>
  ): Promise<JobPosting> {
    return this.getAdapter().createEmployerJob(jobInput);
  }

  submitOnboarding(draft: OnboardingDraft): Promise<SubmissionReceipt> {
    return this.getAdapter().submitOnboarding(draft);
  }

  // ADDED: Track 1 Learner CRUD facade
  createLearner(draft: OnboardingDraft): Promise<LearnerProfile> {
    return this.getAdapter().createLearner(draft);
  }

  getLearner(id?: string): Promise<LearnerProfile | null> {
    if (this.mode === 'mock') {
      return mockAdapter.getLearner(id);
    }
    if (!id) return Promise.resolve(null);
    return createRestAdapter(this.baseUrl).getLearner(id);
  }

  updateLearner(id: string, patch: Partial<OnboardingDraft>): Promise<LearnerProfile> {
    return this.getAdapter().updateLearner(id, patch);
  }

  updateLearnerSupport(
    id: string,
    support: { supportPreferences: SupportPreference[]; supportNotes: string }
  ): Promise<LearnerProfile> {
    return this.getAdapter().updateLearnerSupport(id, support);
  }

  exportLearner(id?: string): Promise<LearnerProfile | null> {
    if (this.mode === 'mock') {
      return mockAdapter.exportLearner(id);
    }
    if (!id) return Promise.resolve(null);
    return createRestAdapter(this.baseUrl).exportLearner(id);
  }

  deleteLearner(id?: string): Promise<{ deleted: boolean }> {
    if (this.mode === 'mock') {
      return mockAdapter.deleteLearner(id);
    }
    if (!id) return Promise.resolve({ deleted: false });
    return createRestAdapter(this.baseUrl).deleteLearner(id);
  }

  submitJobApplication(app: JobApplicationDraft): Promise<SubmissionReceipt> {
    return this.getAdapter().submitJobApplication(app);
  }

  requestSmsResume(phone: string, draftToken: string): Promise<{ sent: boolean; message: string }> {
    if (this.mode === 'mock') {
      return mockAdapter.requestSmsResume();
    }
    return createRestAdapter(this.baseUrl).requestSmsResume(phone, draftToken);
  }
}

export const gatewayApi = new GatewayApiClient();
