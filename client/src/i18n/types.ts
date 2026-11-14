import { SupportedLanguage } from '../types/gateway';

export interface LanguageMetadata {
  code: SupportedLanguage;
  nativeName: string;
  englishName: string;
  dir: 'ltr';
  status: 'active';
  speechLangTag: string;
}

export const LANGUAGE_REGISTRY: LanguageMetadata[] = [
  { code: 'en', nativeName: 'English', englishName: 'English', dir: 'ltr', status: 'active', speechLangTag: 'en-US' },
  { code: 'am', nativeName: 'አማርኛ', englishName: 'Amharic', dir: 'ltr', status: 'active', speechLangTag: 'am-ET' },
  { code: 'om', nativeName: 'Afaan Oromoo', englishName: 'Afaan Oromo', dir: 'ltr', status: 'active', speechLangTag: 'om-ET' },
];

export interface TranslationDictionary {
  meta: {
    locale: SupportedLanguage;
    needsNativeReview?: boolean;
    reviewNote?: string;
  };
  common: {
    skipToContent: string;
    demoBannerTitle: string;
    demoBannerBody: string;
    realApiLabel: string;
    mockApiLabel: string;
    languageLabel: string;
    back: string;
    continue: string;
    skip: string;
    reviewAnswers: string;
    submit: string;
    edit: string;
    save: string;
    retry: string;
    loadingStatus: string;
    optionalBadge: string;
    whyWeAskLabel: string;
    readAloud: string;
    stopReading: string;
    readAloudUnavailable: string;
    loadingAudio: string;
    stepOf: string;
    noTimeoutNotice: string;
    errorSummaryTitle: string;
    darkModeLabel: string;
    lightModeLabel: string;
  };
  nav: {
    gateway: string;
    onboarding: string;
    careers: string;
    employers: string;
    judgeChecklist: string;
    startAction: string;
    themeSettings: string;
    voiceAssistant: string;
  };
  home: {
    headline: string;
    subtitle: string;
    onboardingCardTitle: string;
    onboardingCardBody: string;
    onboardingCardCta: string;
    careerCardTitle: string;
    careerCardBody: string;
    careerCardCta: string;
    partnerModeCta: string;
    employerModeCta: string;
    promiseTitle: string;
    promiseItems: string[];
  };
  voice: {
    startMic: string;
    stopMic: string;
    listeningState: string;
    transcribingState: string;
    transcriptLabel: string;
    useThis: string;
    tryAgain: string;
    discard: string;
    unsupportedMessage: string;
    permissionDeniedMessage: string;
    noAudioStoredNote: string;
    sensitiveDisabledTitle: string;
    sensitiveDisabledBody: string;
    readToAssistantOption: string;
    readToAssistantReminder: string;
    detectedLanguageLabel: string;
    permissionPromptNote: string;
    retryMic: string;
    emptySpeechError: string;
    fallbackEnglishButton: string;
  };
  voiceAssistant: {
    title: string;
    subtitle: string;
    openButton: string;
    closeButton: string;
    autoDetectLabel: string;
    speakOrTypePrompt: string;
    inputPlaceholder: string;
    sendButton: string;
    speakButton: string;
    stopSpeakingButton: string;
    thinkingStatus: string;
    speakingStatus: string;
    clearChat: string;
    emptyState: string;
    switchedLanguageNotice: string;
    providerBadgeNeural: string;
    providerBadgeBrowser: string;
    providerUnavailable: string;
  };
  saveResume: {
    panelTitle: string;
    sharedPhoneQuestion: string;
    sharedPhoneYes: string;
    sharedPhoneNo: string;
    sharedPhoneWarning: string;
    saveOnPhoneButton: string;
    saveOnPhoneExplain: string;
    deleteSavedButton: string;
    deletedConfirm: string;
    resumeFoundTitle: string;
    resumeFoundBody: string;
    resumeButton: string;
    statusMemoryOnly: string;
    statusDeviceSaved: string;
    statusServerSaved: string;
    statusErrorKeptInMemory: string;
    smsTitle: string;
    smsNotConfigured: string;
    smsPhoneLabel: string;
    smsSendButton: string;
    smsSentSuccess: string;
  };
  onboarding: {
    pageTitle: string;
    stepDeviceTitle: string;
    stepDeviceHelp: string;
    stepDeviceWhy: string;
    stepNameTitle: string;
    stepNameHelp: string;
    stepNameLabel: string;
    stepNameWhy: string;
    stepContactTitle: string;
    stepContactHelp: string;
    stepContactMethodLabel: string;
    stepContactValueLabel: string;
    stepContactWhy: string;
    contactMethods: {
      phone: string;
      email: string;
      partner_contact: string;
      none: string;
    };
    stepIdentityTitle: string;
    stepIdentityHelp: string;
    stepIdentityWhy: string;
    identityRoutes: {
      national_id: { label: string; desc: string };
      refugee_id: { label: string; desc: string };
      other_document: { label: string; desc: string };
      no_documents: { label: string; desc: string };
      partner_referral: { label: string; desc: string };
    };
    idNumberLabel: string;
    partnerReferralOrgLabel: string;
    stepSupportTitle: string;
    stepSupportHelp: string;
    stepSupportPrivacyNotice: string;
    stepSupportWhy: string;
    supportOptions: {
      help_completing: string;
      communication_assistance: string;
      alternative_materials: string;
      flexible_scheduling: string;
      other_support: string;
      discuss_privately: string;
    };
    supportNotesLabel: string;
    stepPartnerConsentTitle: string;
    stepPartnerConsentHelp: string;
    stepPartnerConsentWhy: string;
    partnerOrgInputLabel: string;
    partnerRepInputLabel: string;
    partnerSharedScopeText: string;
    partnerConsentCheckbox: string;
    reviewTitle: string;
    reviewHelp: string;
    confirmationTitle: string;
    confirmationDemoNote: string;
    confirmationRealNote: string;
    startCareerFromConfirm: string;
    errors: {
      emptyName: string;
      emptyIdentityRoute: string;
      emptyPartnerConsent: string;
      emptyPartnerOrg: string;
      emptyContactValue: string;
    };
  };
  career: {
    pageTitle: string;
    pageSubtitle: string;
    searchLabel: string;
    searchPlaceholder: string;
    filterTitle: string;
    filterPrivacyNote: string;
    clearFilters: string;
    noJobsMatch: string;
    accommodationsHeading: string;
    skillsHeading: string;
    deadlineLabel: string;
    applyButton: string;
    viewDetails: string;
    hideDetails: string;
    jsonLdLabel: string;
    categories: {
      remote_flexible: string;
      flexible_hours: string;
      screen_reader_tools: string;
      accessible_workplace: string;
      assistive_tech: string;
      communication_support: string;
      other_accommodations: string;
    };
    applyFlow: {
      titlePrefix: string;
      stepNameTitle: string;
      stepNameWhy: string;
      stepContactTitle: string;
      stepContactWhy: string;
      stepExpTitle: string;
      stepExpHelp: string;
      stepExpWhy: string;
      stepConsentTitle: string;
      stepConsentHelp: string;
      stepConsentWhy: string;
      shareToggleLabel: string;
      shareNoteLabel: string;
      explicitConsentLabel: string;
      submittedTitle: string;
      submittedBodyDemo: string;
      submittedBodyReal: string;
      backToJobs: string;
    };
  };
  employer: {
    pageTitle: string;
    pageSubtitle: string;
    safeguardBannerTitle: string;
    safeguardBannerBody: string;
    blockedPublishTitle: string;
    jobTitleLabel: string;
    orgNameLabel: string;
    locationLabel: string;
    remoteCheckbox: string;
    employmentTypeLabel: string;
    summaryLabel: string;
    skillsLabel: string;
    workEnvLabel: string;
    remoteFlexLabel: string;
    assistiveTechLabel: string;
    commOptionsLabel: string;
    interviewAccLabel: string;
    appProcessAccLabel: string;
    additionalSupportLabel: string;
    publishButton: string;
    publishedSuccess: string;
    viewPublishedInGateway: string;
  };
}
