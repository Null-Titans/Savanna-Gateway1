import {
  AccommodationCategory,
  ApiCapabilities,
  JobApplicationDraft,
  JobPosting,
  OnboardingDraft,
  SubmissionReceipt,
} from '../../types/gateway';

async function requestJson<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  if (!baseUrl) {
    throw new Error('VITE_API_BASE_URL is not configured. Switch to Demo mode or configure the backend URL.');
  }
  const url = `${baseUrl}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });

  if (!response.ok) {
    let detail = `Server returned status ${response.status}`;
    try {
      const errBody = await response.json();
      if (errBody && typeof errBody.message === 'string') {
        detail = errBody.message;
      }
    } catch {
      // Ignore JSON parse failure on error body
    }
    throw new Error(detail);
  }

  return (await response.json()) as T;
}

export function createRestAdapter(baseUrl: string) {
  return {
    async getCapabilities(): Promise<ApiCapabilities> {
      try {
        const data = await requestJson<{
          serverDraftsEnabled: boolean;
          smsResumeEnabled: boolean;
        }>(baseUrl, '/api/v1/capabilities');
        return {
          mode: 'real',
          serverDraftsEnabled: Boolean(data.serverDraftsEnabled),
          smsResumeEnabled: Boolean(data.smsResumeEnabled),
          backendReachable: true,
          message: 'Connected to backend API.',
        };
      } catch (err) {
        return {
          mode: 'real',
          serverDraftsEnabled: false,
          smsResumeEnabled: false,
          backendReachable: false,
          message: err instanceof Error ? err.message : 'Backend API is unreachable.',
        };
      }
    },

    async listJobs(query?: string, categories?: AccommodationCategory[]): Promise<JobPosting[]> {
      const params = new URLSearchParams();
      if (query) params.set('q', query);
      if (categories && categories.length > 0) {
        params.set('accommodations', categories.join(','));
      }
      const qs = params.toString();
      return requestJson<JobPosting[]>(baseUrl, `/api/v1/jobs${qs ? `?${qs}` : ''}`);
    },

    async createEmployerJob(
      jobInput: Omit<JobPosting, 'id' | 'postedAtIso' | 'isDemoData'>
    ): Promise<JobPosting> {
      return requestJson<JobPosting>(baseUrl, '/api/v1/jobs', {
        method: 'POST',
        body: JSON.stringify(jobInput),
      });
    },

    async submitOnboarding(draft: OnboardingDraft): Promise<SubmissionReceipt> {
      return requestJson<SubmissionReceipt>(baseUrl, '/api/v1/onboarding/submissions', {
        method: 'POST',
        body: JSON.stringify(draft),
      });
    },

    async submitJobApplication(app: JobApplicationDraft): Promise<SubmissionReceipt> {
      return requestJson<SubmissionReceipt>(baseUrl, `/api/v1/jobs/${encodeURIComponent(app.jobId)}/applications`, {
        method: 'POST',
        body: JSON.stringify(app),
      });
    },

    async requestSmsResume(phone: string, draftToken: string): Promise<{ sent: boolean; message: string }> {
      return requestJson<{ sent: boolean; message: string }>(baseUrl, '/api/v1/onboarding/resume-sms', {
        method: 'POST',
        body: JSON.stringify({ phone, draftToken }),
      });
    },
  };
}
