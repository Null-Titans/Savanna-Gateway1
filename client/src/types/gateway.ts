export type SupportedLanguage = 'en' | 'am' | 'om';
export type ActiveLanguage = SupportedLanguage;
export type SpeechLanguageOption = 'auto' | SupportedLanguage;

export type GatewayModule = 'home' | 'onboarding' | 'career' | 'employer' | 'judge';

export type IdentityRoute =
  | 'national_id'
  | 'refugee_id'
  | 'other_document'
  | 'no_documents'
  | 'partner_referral';

export type SupportPreference =
  | 'help_completing'
  | 'communication_assistance'
  | 'alternative_materials'
  | 'flexible_scheduling'
  | 'other_support'
  | 'discuss_privately';

export type AccommodationCategory =
  | 'remote_flexible'
  | 'flexible_hours'
  | 'screen_reader_tools'
  | 'accessible_workplace'
  | 'assistive_tech'
  | 'communication_support'
  | 'other_accommodations';

export type SaveStorageStatus =
  | 'memory_only'
  | 'device_indexeddb'
  | 'server_saved'
  | 'not_saved_error';

export interface ConsentRecord {
  learnerConsented: boolean;
  consentLanguage: SupportedLanguage;
  partnerOrganizationName: string;
  representativeName: string;
  sharedFieldsSummary: string[];
  recordedAtIso: string;
}

export interface OnboardingDraft {
  isSharedDevice: boolean | null;
  registrationMode: 'self' | 'partner_assisted';
  fullName: string;
  contactMethod: 'phone' | 'email' | 'partner_contact' | 'none';
  contactValue: string;
  identityRoute: IdentityRoute | '';
  identityReferenceNumber: string; // Never persisted in localStorage or unconsented IndexedDB
  partnerReferralOrg: string;
  supportPreferences: SupportPreference[];
  supportNotes: string;
  partnerConsent?: ConsentRecord;
  updatedAtIso: string;
}

export interface EmployerAccommodationDetails {
  workEnvironmentAccessibility: string;
  remoteOrFlexibleArrangements: string;
  assistiveTechnologyAvailable: string;
  communicationOptions: string;
  interviewAccommodations: string;
  applicationProcessAccommodations: string;
  additionalSupportOffered: string;
}

export interface JobPosting {
  id: string;
  title: string;
  organization: string;
  location: string;
  isRemote: boolean;
  employmentType: 'Full-time' | 'Part-time' | 'Apprenticeship' | 'Contract' | 'Fellowship';
  descriptionSummary: string;
  requiredSkills: string[];
  accommodationCategories: AccommodationCategory[];
  accommodationsOffered: string[];
  accommodationDetails: EmployerAccommodationDetails;
  applicationDeadline?: string;
  postedAtIso: string;
  isDemoData: boolean;
}

export interface JobApplicationDraft {
  jobId: string;
  applicantName: string;
  contactValue: string;
  relevantExperience: string;
  shareAccommodationRequest: boolean;
  accommodationRequestNote: string;
  explicitConsentToShare: boolean;
}

export interface ApiCapabilities {
  mode: 'mock' | 'real';
  serverDraftsEnabled: boolean;
  smsResumeEnabled: boolean;
  backendReachable: boolean;
  message: string;
}

export interface SubmissionReceipt {
  id: string;
  submittedAtIso: string;
  mode: 'mock' | 'real';
  persistedToServer: boolean;
  notice: string;
}

export interface ThemeConfig {
  id: string;
  organizationName: string;
  logoText: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  defaultLanguage: ActiveLanguage;
  introText?: string;
}

export interface ValidatedTheme extends ThemeConfig {
  effectivePrimary: string;
  effectivePrimaryText: string;
  effectiveSecondary: string;
  effectiveSecondaryText: string;
  primaryAdjusted: boolean;
  secondaryAdjusted: boolean;
  primaryContrastRatio: number;
  secondaryContrastRatio: number;
  warnings: string[];
}

export type GatewayEventName =
  | 'gateway:onboarding-started'
  | 'gateway:step-changed'
  | 'gateway:draft-saved'
  | 'gateway:onboarding-submitted'
  | 'gateway:support-requested'
  | 'gateway:job-applied'
  | 'gateway:error';

export interface GatewayEventPayloadMap {
  'gateway:onboarding-started': {
    tenantKey: string;
    language: SupportedLanguage;
    timestamp: string;
  };
  'gateway:step-changed': {
    flow: 'onboarding' | 'job_application';
    stepId: string;
    stepIndex: number;
    totalSteps: number;
  };
  'gateway:draft-saved': {
    storage: SaveStorageStatus;
    sensitiveExcluded: boolean;
    timestamp: string;
  };
  'gateway:onboarding-submitted': {
    submissionId: string;
    mode: 'mock' | 'real';
    registrationMode: 'self' | 'partner_assisted';
    identityRoute: IdentityRoute | '';
    // Private support preferences and identity numbers are NEVER included by default
    supportRequestedFlag: boolean;
  };
  'gateway:support-requested': {
    hasSupportRequest: boolean;
    // Only included when learner explicitly consents to share with host
    consentedCategories?: SupportPreference[];
  };
  'gateway:job-applied': {
    jobId: string;
    applicationId: string;
    mode: 'mock' | 'real';
    sharedAccommodationConsent: boolean;
  };
  'gateway:error': {
    code: string;
    message: string;
    recoverable: boolean;
  };
}
