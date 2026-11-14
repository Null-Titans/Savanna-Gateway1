import { getEnvConfig } from '../../config/env';
import {
  AccommodationCategory,
  ApiCapabilities,
  JobApplicationDraft,
  JobPosting,
  OnboardingDraft,
  SubmissionReceipt,
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
