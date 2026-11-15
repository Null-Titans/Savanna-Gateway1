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
  // ADDED: Additional demo jobs (total 6) covering interpreter, screen-reader workplace, and remote
  {
    id: 'demo-job-4',
    title: 'Amharic & English Content Reviewer',
    organization: 'EthioEd Open Publishing (Demo Employer)',
    location: 'Remote (Addis Ababa / Nationwide)',
    isRemote: true,
    employmentType: 'Contract',
    descriptionSummary:
      'Proofread short learning lessons in Amharic and English and verify plain-language headings.',
    requiredSkills: ['Amharic reading', 'Plain-language editing', 'Reliable chat check-ins'],
    accommodationCategories: ['remote_flexible', 'flexible_hours', 'screen_reader_tools', 'communication_support'],
    accommodationsOffered: [
      '100% remote with flexible daily hours',
      'Screen-reader friendly workplace and document templates',
      'Sign-language or written-chat interpreter for interviews',
    ],
    accommodationDetails: {
      workEnvironmentAccessibility: 'Fully remote; screen-reader tested editorial platform.',
      remoteOrFlexibleArrangements: 'Flexible 15-25 hours/week; no live calls required.',
      assistiveTechnologyAvailable: 'Accessible markup tools and captioning support.',
      communicationOptions: 'Interpreter for interviews on request; text-first team updates.',
      interviewAccommodations: 'Interpreter for interviews or written Q&A option.',
      applicationProcessAccommodations: 'Voice input and extra time accepted.',
      additionalSupportOffered: 'Style guide provided in audio and large print.',
    },
    applicationDeadline: '2026-12-22',
    postedAtIso: '2026-11-09T09:30:00Z',
    isDemoData: true,
  },
  {
    id: 'demo-job-5',
    title: 'IT Helpdesk & Accessibility Tester',
    organization: 'Savanna Digital Academy (Demo Employer)',
    location: 'Addis Ababa / Hybrid',
    isRemote: true,
    employmentType: 'Full-time',
    descriptionSummary:
      'Test web pages with keyboard navigation and screen readers, and help learners reset accounts.',
    requiredSkills: ['Keyboard navigation', 'Problem solving', 'Team communication'],
    accommodationCategories: ['remote_flexible', 'screen_reader_tools', 'accessible_workplace', 'assistive_tech'],
    accommodationsOffered: [
      'Screen-reader friendly workplace with NVDA, JAWS, and VoiceOver test kits',
      'Remote work 3 days per week',
      'Step-free Addis Ababa hub with quiet sensory room',
    ],
    accommodationDetails: {
      workEnvironmentAccessibility: 'Step-free access, adjustable desks, screen-reader friendly workplace.',
      remoteOrFlexibleArrangements: 'Hybrid: 3 days remote, 2 days accessible hub.',
      assistiveTechnologyAvailable: 'Screen readers, refreshable braille display on request, ergonomic gear.',
      communicationOptions: 'Written tickets, captioned stand-ups, interpreter for interviews.',
      interviewAccommodations: 'Questions sent 24 hours ahead; practical non-timed demo.',
      applicationProcessAccommodations: 'No formal degree or CV upload required.',
      additionalSupportOffered: 'Paid accessibility testing training.',
    },
    applicationDeadline: '2026-12-28',
    postedAtIso: '2026-11-10T11:00:00Z',
    isDemoData: true,
  },
  {
    id: 'demo-job-6',
    title: 'Community Outreach Coordinator',
    organization: 'East Africa Inclusion Network (Demo Employer)',
    location: 'Hawassa / Remote',
    isRemote: true,
    employmentType: 'Part-time',
    descriptionSummary:
      'Coordinate local registration sessions with community partners and share plain-language guides.',
    requiredSkills: ['Afaan Oromo or Amharic', 'Community coordination', 'Listening skills'],
    accommodationCategories: ['remote_flexible', 'flexible_hours', 'communication_support', 'other_accommodations'],
    accommodationsOffered: [
      'Sign-language interpreter for interviews and community events',
      'Flexible hours around family or health schedules',
      'Remote planning days with mobile data stipend',
    ],
    accommodationDetails: {
      workEnvironmentAccessibility: 'Accessible community partner venues; remote admin work.',
      remoteOrFlexibleArrangements: 'Flexible part-time schedule.',
      assistiveTechnologyAvailable: 'Mobile data stipend and voice-to-text tools.',
      communicationOptions: 'Interpreter for interviews and partner meetings.',
      interviewAccommodations: 'Bring a support person; interpreter provided free.',
      applicationProcessAccommodations: 'Partner referral or voice answers accepted.',
      additionalSupportOffered: 'Peer mentorship included.',
    },
    postedAtIso: '2026-11-11T14:00:00Z',
    isDemoData: true,
  },
];

let demoJobsStore: JobPosting[] = [...INITIAL_DEMO_JOBS];
let simulateFlakyNetwork = false;
const MOCK_LEARNER_STORAGE_KEY = 'gw_mock_learner_profile_v1';

function readStoredMockLearner(): LearnerProfile | null {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const raw = window.localStorage.getItem(MOCK_LEARNER_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LearnerProfile;
  } catch {
    return null;
  }
}

function writeStoredMockLearner(profile: LearnerProfile | null): void {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    if (!profile) {
      window.localStorage.removeItem(MOCK_LEARNER_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(MOCK_LEARNER_STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore storage errors
  }
}

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
    const id = `demo-reg-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    if (draft.isSharedDevice !== true) {
      const idRoute =
        draft.identityRoute === 'no_documents' || draft.identityRoute === 'partner_referral'
          ? 'partner-referral'
          : draft.identityRoute;
      writeStoredMockLearner({
        id,
        registrationMode: draft.registrationMode,
        fullName: draft.fullName,
        contactMethod: draft.contactMethod,
        contactValue: draft.contactValue,
        identityRoute: draft.identityRoute,
        idRoute,
        partnerReferralOrg: draft.partnerReferralOrg,
        supportPreferences: draft.supportPreferences,
        supportNotes: draft.supportNotes,
        partnerConsent: draft.partnerConsent,
        updatedAtIso: new Date().toISOString(),
      });
    }
    return {
      id,
      submittedAtIso: new Date().toISOString(),
      mode: 'mock',
      persistedToServer: false,
      notice: `Demo mode preview only (${draft.registrationMode}): validated locally; nothing was saved to a real server.`,
    };
  },

  // ADDED: Track 1 Learner CRUD mock endpoints backed by localStorage (non-sensitive fields)
  async createLearner(draft: OnboardingDraft): Promise<LearnerProfile> {
    assertNetworkHealthy();
    const idRoute =
      draft.identityRoute === 'no_documents' || draft.identityRoute === 'partner_referral'
        ? 'partner-referral'
        : draft.identityRoute;
    const profile: LearnerProfile = {
      id: `learner-${Date.now().toString(36)}`,
      registrationMode: draft.registrationMode,
      fullName: draft.fullName,
      contactMethod: draft.contactMethod,
      contactValue: draft.contactValue,
      identityRoute: draft.identityRoute,
      idRoute,
      partnerReferralOrg: draft.partnerReferralOrg,
      supportPreferences: draft.supportPreferences,
      supportNotes: draft.supportNotes,
      partnerConsent: draft.partnerConsent,
      updatedAtIso: new Date().toISOString(),
    };
    if (draft.isSharedDevice !== true) {
      writeStoredMockLearner(profile);
    }
    return profile;
  },

  async getLearner(id?: string): Promise<LearnerProfile | null> {
    const existing = readStoredMockLearner();
    if (!existing) return null;
    if (id && existing.id !== id) return existing;
    return existing;
  },

  async updateLearner(id: string, patch: Partial<OnboardingDraft>): Promise<LearnerProfile> {
    assertNetworkHealthy();
    const current = readStoredMockLearner();
    const nextRoute = patch.identityRoute ?? current?.identityRoute ?? '';
    const idRoute =
      nextRoute === 'no_documents' || nextRoute === 'partner_referral' ? 'partner-referral' : nextRoute;
    const updated: LearnerProfile = {
      id: current?.id || id || `learner-${Date.now().toString(36)}`,
      registrationMode: patch.registrationMode ?? current?.registrationMode ?? 'self',
      fullName: patch.fullName ?? current?.fullName ?? '',
      contactMethod: patch.contactMethod ?? current?.contactMethod ?? 'phone',
      contactValue: patch.contactValue ?? current?.contactValue ?? '',
      identityRoute: nextRoute,
      idRoute,
      partnerReferralOrg: patch.partnerReferralOrg ?? current?.partnerReferralOrg ?? '',
      supportPreferences: patch.supportPreferences ?? current?.supportPreferences ?? [],
      supportNotes: patch.supportNotes ?? current?.supportNotes ?? '',
      partnerConsent: patch.partnerConsent ?? current?.partnerConsent,
      updatedAtIso: new Date().toISOString(),
    };
    if (patch.isSharedDevice !== true) {
      writeStoredMockLearner(updated);
    }
    return updated;
  },

  async updateLearnerSupport(
    id: string,
    support: { supportPreferences: SupportPreference[]; supportNotes: string }
  ): Promise<LearnerProfile> {
    return this.updateLearner(id, support);
  },

  async exportLearner(id?: string): Promise<LearnerProfile | null> {
    return this.getLearner(id);
  },

  async deleteLearner(_id?: string): Promise<{ deleted: boolean }> {
    writeStoredMockLearner(null);
    return { deleted: true };
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
