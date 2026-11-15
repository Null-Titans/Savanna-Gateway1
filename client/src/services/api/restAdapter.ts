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

async function requestJson<T>(
  baseUrl: string,
  path: string,
  init?: RequestInit
): Promise<T> {
  if (!baseUrl) {
    throw new Error('No server address is set. Switch to Demo mode or add the server address in settings.');
  }
  const url = `${baseUrl}${path}`;
  let response: Response;
  try {
    response = await fetch(url, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init?.headers || {}),
      },
    });
  } catch {
    throw new Error('Could not reach the server right now. Check your internet connection; your answers are still safe on this screen.');
  }

  if (!response.ok) {
    let detail = 'The server could not save this right now. Your answers are still safe on this screen.';
    try {
      const errBody = await response.json();
      if (errBody && typeof errBody.message === 'string' && errBody.message.length < 220) {
        detail = errBody.message;
      }
    } catch {
      // Ignore JSON parse failure on error body
    }
    throw new Error(detail);
  }

  if (response.status === 204) {
    return undefined as T;
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

    // ADDED: Track 1 Learner CRUD REST endpoints
    async createLearner(draft: OnboardingDraft): Promise<LearnerProfile> {
      return requestJson<LearnerProfile>(baseUrl, '/api/v1/learners', {
        method: 'POST',
        body: JSON.stringify(draft),
      });
    },

    async getLearner(id: string): Promise<LearnerProfile | null> {
      return requestJson<LearnerProfile>(baseUrl, `/api/v1/learners/${encodeURIComponent(id)}/export`);
    },

    async updateLearner(id: string, patch: Partial<OnboardingDraft>): Promise<LearnerProfile> {
      return requestJson<LearnerProfile>(baseUrl, `/api/v1/learners/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
    },

    async updateLearnerSupport(
      id: string,
      support: { supportPreferences: SupportPreference[]; supportNotes: string }
    ): Promise<LearnerProfile> {
      return requestJson<LearnerProfile>(baseUrl, `/api/v1/learners/${encodeURIComponent(id)}/support`, {
        method: 'PUT',
        body: JSON.stringify(support),
      });
    },

    async exportLearner(id: string): Promise<LearnerProfile | null> {
      return requestJson<LearnerProfile>(baseUrl, `/api/v1/learners/${encodeURIComponent(id)}/export`);
    },

    async deleteLearner(id: string): Promise<{ deleted: boolean }> {
      await requestJson<unknown>(baseUrl, `/api/v1/learners/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      return { deleted: true };
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
