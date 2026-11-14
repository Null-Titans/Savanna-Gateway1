import {
  AccommodationCategory,
  ApiCapabilities,
  JobApplicationDraft,
  JobPosting,
  OnboardingDraft,
  SubmissionReceipt,
} from '../../types/gateway';

const INITIAL_DEMO_JOBS: JobPosting[] = [
  {
    id: 'demo-job-1',
    title: 'Junior Customer Support Specialist',
    organization: 'Addis Digital Services (Demo Employer)',
    location: 'Addis Ababa / Hybrid',
    isRemote: true,
    employmentType: 'Full-time',
    descriptionSummary:
      'Answer learner and customer questions by text chat and email. Full paid training provided in plain language.',
    requiredSkills: ['Clear written communication', 'Basic computer typing', 'Patience and listening'],
    accommodationCategories: [
      'remote_flexible',
      'flexible_hours',
      'screen_reader_tools',
      'communication_support',
    ],
    accommodationsOffered: [
      'Remote work from home available 4 days a week',
      'Screen-reader-tested chat and ticketing tools (NVDA & JAWS verified)',
      'Flexible shift start times within a 2-hour window',
      'Written and captioned onboarding instructions',
    ],
    accommodationDetails: {
      workEnvironmentAccessibility: 'Step-free ground floor office with tactile signage and quiet focus rooms.',
      remoteOrFlexibleArrangements: 'Remote work 4 days/week; flexible start between 08:00 and 10:00.',
      assistiveTechnologyAvailable: 'NVDA-compatible web desk, high-contrast display settings, speech-to-text headset.',
      communicationOptions: 'Text-only chat shifts available; no mandatory phone calls unless chosen.',
      interviewAccommodations: 'Questions shared in writing 24 hours before the interview; live captions included.',
      applicationProcessAccommodations: 'Voice input and extra time supported; no timed assessments.',
      additionalSupportOffered: 'Assigned onboarding buddy for the first 30 days.',
    },
    applicationDeadline: '2026-12-30',
    postedAtIso: '2026-11-01T09:00:00Z',
    isDemoData: true,
  },
  {
    id: 'demo-job-2',
    title: 'Data Entry & Document Accessibility Associate',
    organization: 'Horizon Community Learning (Demo Employer)',
    location: 'Remote (Ethiopia & East Africa)',
    isRemote: true,
    employmentType: 'Part-time',
    descriptionSummary:
      'Review training handouts, add alt text to learning images, and organize course schedules.',
    requiredSkills: ['Attention to detail', 'Amharic or English reading', 'Spreadsheet basics'],
    accommodationCategories: [
      'remote_flexible',
      'flexible_hours',
      'screen_reader_tools',
      'assistive_tech',
    ],
    accommodationsOffered: [
      '100% remote work with low-bandwidth mobile support',
      'Flexible 20 hours per week schedule',
      'Stipend for assistive software or ergonomic keyboard',
      'Screen-reader-friendly spreadsheet templates',
    ],
    accommodationDetails: {
      workEnvironmentAccessibility: 'Fully remote; low-data offline-capable document templates.',
      remoteOrFlexibleArrangements: 'Choose your own hours across Monday to Saturday.',
      assistiveTechnologyAvailable: 'Monthly assistive tech stipend and screen magnifier license.',
      communicationOptions: 'Async text updates via messaging or voice notes.',
      interviewAccommodations: 'Choose text-based Q&A or video call with captions.',
      applicationProcessAccommodations: 'No CV file upload required; short plain-language questions.',
      additionalSupportOffered: 'Paid 2-week guided ramp-up.',
    },
    applicationDeadline: '2026-12-18',
    postedAtIso: '2026-11-05T10:00:00Z',
    isDemoData: true,
  },
  {
    id: 'demo-job-3',
    title: 'Community Tech Hub Assistant',
    organization: 'Nile Youth Training Center (Demo Employer)',
    location: 'Bahir Dar, Ethiopia',
    isRemote: false,
    employmentType: 'Apprenticeship',
    descriptionSummary:
      'Welcome new learners at the community hub, help them sign in to tablets, and keep learning stations tidy.',
    requiredSkills: ['Friendly welcoming attitude', 'Amharic speaking', 'Willingness to learn'],
    accommodationCategories: ['accessible_workplace', 'communication_support', 'other_accommodations'],
    accommodationsOffered: [
      'Wheelchair-accessible entrance, desk height, and restroom',
      'Quiet break room available during busy hours',
      'Plain-language checklists and visual step guides',
      'Sign-language interpreter available for team meetings',
    ],
    accommodationDetails: {
      workEnvironmentAccessibility: 'Ramp access, wide aisles (120cm), accessible ground-floor restroom.',
      remoteOrFlexibleArrangements: 'On-site role with predictable morning or afternoon shifts.',
      assistiveTechnologyAvailable: 'Large-print labels and tablet magnification stands.',
      communicationOptions: 'Sign-language interpretation booked on request for trainings and meetings.',
      interviewAccommodations: 'In-person accessible room or phone/video option; support person welcome.',
      applicationProcessAccommodations: 'Partner referral accepted in place of formal work history.',
      additionalSupportOffered: 'Transport allowance included.',
    },
    postedAtIso: '2026-11-08T12:00:00Z',
    isDemoData: true,
  },
];

let demoJobsStore: JobPosting[] = [...INITIAL_DEMO_JOBS];
let simulateFlakyNetwork = false;

export function setSimulateFlakyNetwork(enabled: boolean): void {
  simulateFlakyNetwork = enabled;
}

export function getSimulateFlakyNetwork(): boolean {
  return simulateFlakyNetwork;
}

function assertNetworkHealthy(): void {
  if (simulateFlakyNetwork) {
    throw new Error(
      'Simulated 3G network timeout: could not reach the server. Your typed answers are preserved safely on this screen.'
    );
  }
}

export const mockAdapter = {
  async getCapabilities(): Promise<ApiCapabilities> {
    return {
      mode: 'mock',
      serverDraftsEnabled: false,
      smsResumeEnabled: false,
      backendReachable: false,
      message: 'Demo mode active: using sample data. Server drafts and SMS delivery are disabled.',
    };
  },

  async listJobs(query?: string, categories?: AccommodationCategory[]): Promise<JobPosting[]> {
    assertNetworkHealthy();
    const q = (query || '').trim().toLowerCase();
    return demoJobsStore.filter((job) => {
      const matchesQuery =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.organization.toLowerCase().includes(q) ||
        job.location.toLowerCase().includes(q) ||
        job.descriptionSummary.toLowerCase().includes(q) ||
        job.requiredSkills.some((s) => s.toLowerCase().includes(q));

      const matchesCategories =
        !categories ||
        categories.length === 0 ||
        categories.every((cat) => job.accommodationCategories.includes(cat));

      return matchesQuery && matchesCategories;
    });
  },

  async createEmployerJob(jobInput: Omit<JobPosting, 'id' | 'postedAtIso' | 'isDemoData'>): Promise<JobPosting> {
    assertNetworkHealthy();
    const created: JobPosting = {
      ...jobInput,
      id: `demo-job-${Date.now()}`,
      postedAtIso: new Date().toISOString(),
      isDemoData: true,
    };
    demoJobsStore = [created, ...demoJobsStore];
    return created;
  },

  async submitOnboarding(draft: OnboardingDraft): Promise<SubmissionReceipt> {
    assertNetworkHealthy();
    return {
      id: `demo-reg-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      submittedAtIso: new Date().toISOString(),
      mode: 'mock',
      persistedToServer: false,
      notice: `Demo mode preview only (${draft.registrationMode}): validated locally; nothing was saved to a real server.`,
    };
  },

  async submitJobApplication(app: JobApplicationDraft): Promise<SubmissionReceipt> {
    assertNetworkHealthy();
    return {
      id: `demo-app-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      submittedAtIso: new Date().toISOString(),
      mode: 'mock',
      persistedToServer: false,
      notice: `Demo mode preview only for job ${app.jobId}: nothing was sent to a real employer.`,
    };
  },

  async requestSmsResume(): Promise<{ sent: boolean; message: string }> {
    return {
      sent: false,
      message: 'SMS provider is not configured in Demo mode. No SMS was sent.',
    };
  },
};
