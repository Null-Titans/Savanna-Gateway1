import { TranslationDictionary } from '../types';

/**
 * Amharic (am) Plain-Language Locale
 * IMPORTANT (Addendum E5): Every Amharic string below is marked `needsNativeReview: true`
 * until reviewed and confirmed by a native Amharic speaker and lived-experience tester.
 */
export const am: TranslationDictionary = {
  meta: {
    locale: 'am',
    needsNativeReview: true, // Every Amharic string requires native-speaker review before production claim
    reviewNote: 'Plain-language draft (~grade 5 reading level). Needs native Amharic speaker review.',
  },
  common: {
    skipToContent: 'ወደ ዋናው ይዘት ይለፉ', // needs native review
    demoBannerTitle: 'የማሳያ ሁነታ (Demo)', // needs native review
    demoBannerBody: 'ይህ የሙከራ መረጃ ብቻ ነው። ምንም መረጃ ወደ እውነተኛ ሰርቨር አይላክም ወይም በSMS አይላክም።', // needs native review
    realApiLabel: 'የተገናኘ API', // needs native review
    mockApiLabel: 'የማሳያ ሁነታ', // needs native review
    languageLabel: 'ቋንቋ', // needs native review
    back: 'ተመለስ', // needs native review
    continue: 'ቀጥል', // needs native review
    skip: 'ይህን ጥያቄ እለፍ', // needs native review
    reviewAnswers: 'መልሶቼን ገምግም', // needs native review
    submit: 'ምዝገባውን ላክ', // needs native review
    edit: 'አስተካክል', // needs native review
    save: 'እዚህ አስቀምጥ', // needs native review
    retry: 'እንደገና ሞክር', // needs native review
    loadingStatus: 'በመጫን ላይ ነው፣ እባክዎ ይጠብቁ…', // needs native review
    optionalBadge: 'አማራጭ (መዝለል ይቻላል)', // needs native review
    whyWeAskLabel: 'ይህን ለምን እንጠይቃለን?', // needs native review
    readAloud: 'ጥያቄውን በድምፅ አንብብ', // needs native review
    stopReading: 'ማንበብ አቁም', // needs native review
    readAloudUnavailable: 'ለዚህ ቋንቋ የተረጋገጠ ድምፅ አልተገኘም። ጽሁፉን በስክሪኑ ላይ ማንበብ ይችላሉ።', // needs native review
    loadingAudio: 'ተፈጥሯዊ ድምፅ በማዘጋጀት ላይ…', // needs native review
    stepOf: 'ደረጃ {current} ከ {total}', // needs native review
    noTimeoutNotice: 'የጊዜ ገደብ የለም። መልሶችዎ እስኪጨርሱ ድረስ አይጠፉም።', // needs native review
    errorSummaryTitle: 'ከመቀጠልዎ በፊት ይህን ያስተካክሉ', // needs native review
  },
  nav: {
    gateway: 'መነሻ', // needs native review
    onboarding: 'ምዝገባ', // needs native review
    careers: 'ተደራሽ ስራዎች', // needs native review
    employers: 'ለአሰሪዎች', // needs native review
    judgeChecklist: 'የዳኞች ማረጋገጫ', // needs native review
    startAction: 'ምዝገባ ጀምር', // needs native review
    themeSettings: 'ገጽታ እና API', // needs native review
    voiceAssistant: 'የድምፅ ረዳት', // needs native review
  },
  home: {
    headline: 'ቀላል ምዝገባ እና ተደራሽ የስራ እድሎች፣ አንድ ጥያቄ በአንድ ጊዜ።', // needs native review
    subtitle: 'ያለ ቀበሌ መታወቂያ ወይም ፓስፖርት መመዝገብ ይችላሉ። በድምፅ ወይም በጽሁፍ መመለስ እና የስራ ድጋፍ የሚሰጡ ስራዎችን መፈለግ ይችላሉ።', // needs native review
    onboardingCardTitle: 'ተማሪ ሆነው ይመዝገቡ', // needs native review
    onboardingCardBody: 'በአንድ ገጽ አንድ ቀላል ጥያቄ። በድምፅ ወይም በጽሁፍ ይመልሱ፣ የማይፈልጉትን ጥያቄ ይለፉ።', // needs native review
    onboardingCardCta: 'ምዝገባ ጀምር', // needs native review
    careerCardTitle: 'ተደራሽ ስራዎችን ይመልከቱ', // needs native review
    careerCardBody: 'የጤና ወይም የህክምና ማስረጃ ሳይጠየቁ በስራ ቦታ ድጋፍ መሰረት ስራዎችን ይፈልጉ።', // needs native review
    careerCardCta: 'ስራዎችን ፈልግ', // needs native review
    partnerModeCta: 'በአጋር ድርጅት እገዛ መመዝገብ', // needs native review
    employerModeCta: 'ለአሰሪዎች፡ የስራ ድጋፍ መመዝገቢያ', // needs native review
    promiseTitle: 'የግላዊነት እና የተደራሽነት ቃል ኪዳናችን', // needs native review
    promiseItems: [
      'የቀበሌ መታወቂያ፣ ፓስፖርት ወይም የህክምና ማስረጃ አይጠየቅም።', // needs native review
      'የግል ድጋፍ ጥያቄዎ ያለ እርስዎ ፈቃድ ለአሰሪዎች አይታይም።', // needs native review
      'የጋራ ስልክ የሚጠቀሙ ከሆነ መረጃዎ በስልኩ ላይ አይቀመጥም።', // needs native review
    ],
  },
  voice: {
    startMic: 'ማይክሮፎን ጀምር', // needs native review
    stopMic: 'ማይክሮፎን አቁም', // needs native review
    listeningState: 'በማዳመጥ ላይ… አሁን በግልፅ ይናገሩ', // needs native review
    transcribingState: 'ድምፅዎን ወደ ጽሁፍ በመቀየር ላይ…', // needs native review
    transcriptLabel: 'የተሰማውን ጽሁፍ ይመልከቱ (ማስተካከል ይችላሉ)', // needs native review
    useThis: 'ይህን ጽሁፍ ተጠቀም', // needs native review
    tryAgain: 'እንደገና ሞክር', // needs native review
    discard: 'አጥፋ', // needs native review
    unsupportedMessage: 'የድምፅ መቀበያ በዚህ አሳሽ ላይ አይሰራም። እባክዎ ከታች በጽሁፍ ይሙሉ።', // needs native review
    permissionDeniedMessage: 'የማይክሮፎን ፈቃድ አልተሰጠም። በአሳሽ ቅንብር መፍቀድ ወይም ከታች በጽሁፍ መሙላት ይችላሉ።', // needs native review
    noAudioStoredNote: 'ድምፅዎ ወደ ጽሁፍ ብቻ ይቀየራል። ድምፅ አይቀመጥም።', // needs native review
    sensitiveDisabledTitle: 'ለመታወቂያ ቁጥር ድምፅ መቀበያ ተዘግቷል', // needs native review
    sensitiveDisabledBody: 'ደህንነትዎን ለመጠበቅ እባክዎ ቁጥሩን በእጅ ይጻፉ።', // needs native review
    readToAssistantOption: 'ለታመነው የአጋር ረዳት በድምፅ አንብቤ ልንገር', // needs native review
    readToAssistantReminder: 'ማሳሰቢያ፡ ቁጥሩን ጮክ ብለው ሲያነቡ አጠገብዎ ያሉ ሰዎች ሊሰሙ ይችላሉ።', // needs native review
    detectedLanguageLabel: 'የተለየው ቋንቋ', // needs native review
  },
  voiceAssistant: {
    title: 'ባለብዙ ቋንቋ የድምፅ ረዳት', // needs native review
    subtitle: 'በአማርኛ፣ በኦሮምኛ ወይም በእንግሊዝኛ ይናገሩ ወይም ይጻፉ።', // needs native review
    openButton: 'የድምፅ ረዳት', // needs native review
    closeButton: 'ረዳቱን ዝጋ', // needs native review
    autoDetectLabel: 'የተነገረውን ቋንቋ በራስ-ሰር ለይ (EN / AM / OM)', // needs native review
    speakOrTypePrompt: 'ስለ ምዝገባ፣ መታወቂያ አማራጮች ወይም ተደራሽ ስራዎች ይጠይቁ', // needs native review
    inputPlaceholder: 'ይጻፉ ወይም በማይክሮፎን ይናገሩ…', // needs native review
    sendButton: 'ላክ', // needs native review
    speakButton: 'በድምፅ ተናገር', // needs native review
    stopSpeakingButton: 'ድምፅ አቁም', // needs native review
    thinkingStatus: 'በማሰብ ላይ…', // needs native review
    speakingStatus: 'በመናገር ላይ…', // needs native review
    clearChat: 'አጽዳ', // needs native review
    emptyState: 'በአማርኛ፣ በኦሮምኛ ወይም በእንግሊዝኛ ይናገሩ ወይም ይጻፉ። በተመሳሳይ ቋንቋ እመልስልዎታለሁ።', // needs native review
    switchedLanguageNotice: 'ቋንቋው ወደ {language} ተቀይሯል', // needs native review
    providerBadgeNeural: 'ተፈጥሯዊ የብዙ ቋንቋ ድምፅ (EN / AM / OM)', // needs native review
    providerBadgeBrowser: 'የአሳሽ ድምፅ (እንግሊዝኛ ብቻ)', // needs native review
    providerUnavailable: 'ለዚህ ቋንቋ ትክክለኛ ድምፅ አልተገኘም። እባክዎ ከላይ ያለውን ጽሁፍ ያንብቡ።', // needs native review
  },
  saveResume: {
    panelTitle: 'አስቀምጥ እና በኋላ ቀጥል', // needs native review
    sharedPhoneQuestion: 'ይህ የጋራ ስልክ ወይም የህዝብ ኮምፒውተር ነው?', // needs native review
    sharedPhoneYes: 'አዎ፣ የጋራ ስልክ ነው', // needs native review
    sharedPhoneNo: 'አይ፣ የራሴ ስልክ ነው', // needs native review
    sharedPhoneWarning: 'ይህ የጋራ ስልክ ስለሆነ ምንም መረጃ በስልኩ ላይ አይቀመጥም። ገጹን ሲዘጉ ይጠፋል።', // needs native review
    saveOnPhoneButton: 'ሚስጥራዊ ያልሆኑ መልሶችን በዚህ ስልክ አስቀምጥ', // needs native review
    saveOnPhoneExplain: 'ስምዎን እና የመገናኛ ምርጫዎን በዚህ ስልክ ብቻ ያስቀምጣል። መታወቂያ ቁጥር እና የግል ድጋፍ ጥያቄ አይቀመጥም።', // needs native review
    deleteSavedButton: 'የተቀመጡ መልሶቼን አጥፋ', // needs native review
    deletedConfirm: 'በዚህ ስልክ ላይ የተቀመጡ መልሶች በሙሉ ጠፍተዋል።', // needs native review
    resumeFoundTitle: 'በዚህ ስልክ ላይ የተቀመጠ ረቂቅ ተገኝቷል', // needs native review
    resumeFoundBody: 'የተቀመጠበት ቀን {date}። መታወቂያ ቁጥሮች እና የግል ድጋፍ ጥያቄዎች አልተቀመጡም።', // needs native review
    resumeButton: 'የተቀመጠውን ቀጥል', // needs native review
    statusMemoryOnly: 'በጊዜያዊ ማህደር ብቻ ተይዟል (ገጹ ከተዘጋ ይጠፋል)', // needs native review
    statusDeviceSaved: 'ሚስጥራዊ ያልሆኑ መልሶች በዚህ ስልክ ላይ ብቻ ተቀምጠዋል', // needs native review
    statusServerSaved: 'በሰርቨር ላይ በደህንነት ተቀምጧል', // needs native review
    statusErrorKeptInMemory: 'ሰርቨሩን ማግኘት አልተቻለም። የጻፉት መልስ ግን በዚህ ገጽ ላይ አልጠፋም።', // needs native review
    smsTitle: 'የመቀጠያ ሊንክ በSMS ያግኙ', // needs native review
    smsNotConfigured: 'የSMS አገልግሎት ገና አልተገናኘም። በማሳያ ሁነታ (Demo) ምንም SMS አይላክም።', // needs native review
    smsPhoneLabel: 'ለመቀጠያ ሊንክ የስልክ ቁጥር', // needs native review
    smsSendButton: 'የመቀጠያ ሊንክ ላክ', // needs native review
    smsSentSuccess: 'ሰርቨሩ የSMS ጥያቄዎን ተቀብሏል።', // needs native review
  },
  onboarding: {
    pageTitle: 'የተማሪ ምዝገባ', // needs native review
    stepDeviceTitle: 'ከመጀመራችን በፊት፡ ይህ የጋራ ስልክ ነው?', // needs native review
    stepDeviceHelp: 'ሌሎች ሰዎች ይህን ስልክ የሚጠቀሙ ከሆነ ግላዊነትዎን ለመጠበቅ ይረዳናል።', // needs native review
    stepDeviceWhy: 'የግል መረጃዎ በጋራ ስልክ ላይ እንዳይቀር ለመጠበቅ ነው።', // needs native review
    stepNameTitle: 'ሙሉ ስምዎ ማን ነው?', // needs native review
    stepNameHelp: 'አሰልጣኞች እንዲጠሩዎት የሚፈልጉትን ስም ይጻፉ ወይም ይናገሩ።', // needs native review
    stepNameLabel: 'ሙሉ ስም', // needs native review
    stepNameWhy: 'ስምዎን ለመጥራት እና የመማሪያ መገለጫዎን ለማዘጋጀት እንጠቀምበታለን።', // needs native review
    stepContactTitle: 'እንዴት ልናገኝዎት እንችላለን?', // needs native review
    stepContactHelp: 'የሚመችዎትን መንገድ ይምረጡ ወይም ይህን ጥያቄ ይለፉ።', // needs native review
    stepContactMethodLabel: 'የመገናኛ መንገድ', // needs native review
    stepContactValueLabel: 'የስልክ ቁጥር ወይም ኢሜይል', // needs native review
    stepContactWhy: 'የትምህርት ፕሮግራሙን ጊዜ እና መረጃ ለማሳወቅ ነው።', // needs native review
    contactMethods: {
      phone: 'ስልክ ወይም SMS', // needs native review
      email: 'ኢሜይል', // needs native review
      partner_contact: 'በአጋር ድርጅት በኩል', // needs native review
      none: 'አሁን መገናኛ መስጠት አልፈልግም', // needs native review
    },
    stepIdentityTitle: 'የመታወቂያ አማራጭ ይምረጡ', // needs native review
    stepIdentityHelp: 'የቀበሌ መታወቂያ ወይም ፓስፖርት ግዴታ አይደለም። ለእርስዎ የሚስማማውን ይምረጡ።', // needs native review
    stepIdentityWhy: 'ማንም ሰው በመታወቂያ እጥረት እንዳይገለል አማራጭ መንገዶችን እንቀበላለን።', // needs native review
    identityRoutes: {
      national_id: {
        label: 'ብሔራዊ መታወቂያ (ፋይዳ / ቀበሌ)', // needs native review
        desc: 'ብሔራዊ መታወቂያ ካለዎት ይህን ይምረጡ።', // needs native review
      },
      refugee_id: {
        label: 'የስደተኛ መታወቂያ', // needs native review
        desc: 'የስደተኛ ምዝገባ ካርድ ወይም የUN/RRS ሰነድ ካለዎት ይህን ይምረጡ።', // needs native review
      },
      other_document: {
        label: 'ሌላ የመታወቂያ ሰነድ', // needs native review
        desc: 'የተማሪ መታወቂያ ወይም የማህበረሰብ ደብዳቤ።', // needs native review
      },
      no_documents: {
        label: 'እነዚህ ሰነዶች የሉኝም', // needs native review
        desc: 'ያለ ምንም መታወቂያ ይቀጥሉ። አስተባባሪ በኋላ ሊረዳዎት ይችላል።', // needs native review
      },
      partner_referral: {
        label: 'በአጋር ድርጅት በኩል አመልክቱልኝ', // needs native review
        desc: 'አንድ NGO ወይም የማህበረሰብ ማዕከል ምዝገባዎን ያረጋግጣል።', // needs native review
      },
    },
    idNumberLabel: 'የመታወቂያ ቁጥር (አማራጭ)', // needs native review
    partnerReferralOrgLabel: 'የአጋር ድርጅቱ ስም (አማራጭ)', // needs native review
    stepSupportTitle: 'የትምህርት ወይም የተደራሽነት ድጋፍ ይፈልጋሉ?', // needs native review
    stepSupportHelp: 'የሚያስፈልግዎትን ድጋፍ ይምረጡ። የህክምና ማስረጃ ወይም ምርመራ አይጠየቅም።', // needs native review
    stepSupportPrivacyNotice: 'ሚስጥራዊ፡ ይህን የሚያየው የተደራሽነት ረዳት ብቻ ነው። አሰሪዎች በፍጹም አያዩትም።', // needs native review
    stepSupportWhy: 'ተስማሚ የመማሪያ ቁሳቁስ ወይም ተጨማሪ ጊዜ አስቀድመን ለማዘጋጀት ነው።', // needs native review
    supportOptions: {
      help_completing: 'ምዝገባውን ለመሙላት እገዛ', // needs native review
      communication_assistance: 'የመግባቢያ እገዛ (የምልክት ቋንቋ፣ ቀላል ጽሁፍ)', // needs native review
      alternative_materials: 'አማራጭ የመማሪያ ቁሳቁስ (ድምፅ፣ ትልቅ ጽሁፍ፣ ስክሪን አንባቢ)', // needs native review
      flexible_scheduling: 'ተጨማሪ ጊዜ ወይም ምቹ የጊዜ ሰሌዳ', // needs native review
      other_support: 'ሌላ ድጋፍ', // needs native review
      discuss_privately: 'ከአስተባባሪ ጋር በግል መነጋገር እመርጣለሁ', // needs native review
    },
    supportNotesLabel: 'ተጨማሪ የሚረዳዎት ነገር ካለ ይጻፉ (አማራጭ፣ የህክምና ዝርዝር አያስፈልግም)', // needs native review
    stepPartnerConsentTitle: 'በአጋር ድርጅት የታገዘ የፈቃድ መዝገብ', // needs native review
    stepPartnerConsentHelp: 'ረዳት ስለሚመዘግብዎት፣ ከመላኩ በፊት ተማሪው ማንበብ እና መፍቀድ አለበት።', // needs native review
    stepPartnerConsentWhy: 'ያለ ተማሪው ፈቃድ ማንም መረጃ እንዳይልክ ለመከላከል ነው።', // needs native review
    partnerOrgInputLabel: 'የአጋር ድርጅቱ ስም', // needs native review
    partnerRepInputLabel: 'የረዳቱ ሙሉ ስም', // needs native review
    partnerSharedScopeText: 'ረዳቱ ስምዎን፣ መገናኛዎን እና የመታወቂያ አይነትዎን ማየት ይችላል። የግል ድጋፍ ማስታወሻን አያይም።', // needs native review
    partnerConsentCheckbox: 'ተማሪው ምን እንደሚጋራ ተረድቶ ምዝገባው እንዲላክ ግልፅ ፈቃድ መስጠቱን አረጋግጣለሁ።', // needs native review
    reviewTitle: 'መልሶችዎን ይገምግሙ እና ያስተካክሉ', // needs native review
    reviewHelp: 'ከመላክዎ በፊት ከታች ያሉትን መልሶች ይፈትሹ። ለመቀየር አስተካክል ይጫኑ።', // needs native review
    confirmationTitle: 'ምዝገባው ተዘጋጅቷል', // needs native review
    confirmationDemoNote: 'የማሳያ ሁነታ፡ መልሶችዎ እዚህ ተረጋግጠዋል፤ ወደ እውነተኛ ሰርቨር አልተላኩም።', // needs native review
    confirmationRealNote: 'ምዝገባዎ ወደ ሰርቨር ተልኳል።', // needs native review
    startCareerFromConfirm: 'ቀጥሎ ተደራሽ ስራዎችን ይመልከቱ', // needs native review
    errors: {
      emptyName: 'የስም ሳጥኑ ባዶ ነው። እባክዎ ለመቀጠል ስምዎን ይጻፉ ወይም ይናገሩ።', // needs native review
      emptyIdentityRoute: 'የመታወቂያ አማራጭ አልተመረጠም። እባክዎ ከላይ አንዱን ይምረጡ።', // needs native review
      emptyPartnerConsent: 'የፈቃድ ሳጥኑ አልተመረጠም። እባክዎ ከመላክዎ በፊት የተማሪውን ፈቃድ ያረጋግጡ።', // needs native review
      emptyPartnerOrg: 'የአጋር ድርጅቱ ስም ባዶ ነው። እባክዎ የድርጅቱን ስም ይጻፉ።', // needs native review
      emptyContactValue: 'የመገናኛ ዝርዝሩ ባዶ ነው። እባክዎ ስልክ ወይም ኢሜይል ያስገቡ ወይም "አሁን መስጠት አልፈልግም" ይምረጡ።', // needs native review
    },
  },
  career: {
    pageTitle: 'ተደራሽ የስራ መግቢያ', // needs native review
    pageSubtitle: 'የስራ ቦታ ድጋፍ የሚሰጡ ስራዎችን ይፈልጉ። የፍለጋ ምርጫዎችዎ በስልክዎ ላይ በሚስጥር ይቆያሉ።', // needs native review
    searchLabel: 'በስራ ስም፣ በችሎታ ወይም በከተማ ይፈልጉ', // needs native review
    searchPlaceholder: 'ምሳሌ፡ ደንበኛ አገልግሎት፣ አዲስ አበባ፣ ርቀት…', // needs native review
    filterTitle: 'በአሰሪው በሚሰጥ ድጋፍ አጣራ (ሚስጥራዊ)', // needs native review
    filterPrivacyNote: 'የማጣሪያ ምርጫዎችዎ ለአሰሪዎች በፍጹም አይታዩም።', // needs native review
    clearFilters: 'ማጣሪያዎችን አጽዳ', // needs native review
    noJobsMatch: 'ከዚህ ምርጫ ጋር የሚስማማ ስራ የለም። አንድ ማጣሪያ ያንሱ።', // needs native review
    accommodationsHeading: 'የሚሰጡ የተደራሽነት ድጋፎች', // needs native review
    skillsHeading: 'የሚፈለጉ ችሎታዎች', // needs native review
    deadlineLabel: 'የማመልከቻ ቀን ገደብ', // needs native review
    applyButton: 'ለዚህ ስራ አመልክት', // needs native review
    viewDetails: 'ሙሉ የተደራሽነት ዝርዝር ይመልከቱ', // needs native review
    hideDetails: 'ዝርዝሩን ደብቅ', // needs native review
    jsonLdLabel: 'Schema.org JobPosting JSON-LD ተያይዟል', // needs native review
    categories: {
      remote_flexible: 'የርቀት ወይም ተለዋዋጭ ስራ', // needs native review
      flexible_hours: 'ተለዋዋጭ የስራ ሰዓት', // needs native review
      screen_reader_tools: 'ከስክሪን አንባቢ ጋር የሚሰሩ መሳሪያዎች', // needs native review
      accessible_workplace: 'ተደራሽ የስራ ቦታ', // needs native review
      assistive_tech: 'የአጋዥ ቴክኖሎጂ ድጋፍ', // needs native review
      communication_support: 'የመግባቢያ ድጋፍ', // needs native review
      other_accommodations: 'ሌሎች የተገለጹ ድጋፎች', // needs native review
    },
    applyFlow: {
      titlePrefix: 'ማመልከቻ ለ፡', // needs native review
      stepNameTitle: 'ለዚህ ማመልከቻ ስምዎን ያረጋግጡ', // needs native review
      stepNameWhy: 'አሰሪው ማን እንዳመለከተ እንዲያውቅ ነው።', // needs native review
      stepContactTitle: 'አሰሪው በየትኛው መንገድ ያግኝዎት?', // needs native review
      stepContactWhy: 'ለዚህ ስራ የቃለ መጠይቅ መረጃ ለመላክ ብቻ ይጠቅማል።', // needs native review
      stepExpTitle: 'ለዚህ ስራ የሚያበቃዎትን ልምድ ይንገሩን', // needs native review
      stepExpHelp: 'ስለ ችሎታዎ በድምፅ መናገር ወይም በአጭሩ መጻፍ ይችላሉ።', // needs native review
      stepExpWhy: 'ቀጣሪው ቡድን ጥንካሬዎን እንዲረዳ ይረዳዋል።', // needs native review
      stepConsentTitle: 'አማራጭ፡ ለቃለ መጠይቅ ወይም ለስራ ድጋፍ መጠየቅ ይፈልጋሉ?', // needs native review
      stepConsentHelp: 'በነባሪነት የግል ድጋፍ ምርጫዎ ለአሰሪው አይጋራም።', // needs native review
      stepConsentWhy: 'ለአሰሪው ምን እንደሚታይ እርስዎ ይቆጣጠራሉ።', // needs native review
      shareToggleLabel: 'አዎ፣ ለዚህ ስራ ወይም ቃለ መጠይቅ ማስተካከያ መጠየቅ እፈልጋለሁ', // needs native review
      shareNoteLabel: 'ምን አይነት ማስተካከያ ይረዳዎታል? (ምሳሌ፡ በቪዲዮ ቃለ መጠይቅ ጽሁፍ)', // needs native review
      explicitConsentLabel: 'ይህን የማስተካከያ ጥያቄ ለአሰሪው እንዲላክ ግልፅ ፈቃድ እሰጣለሁ።', // needs native review
      submittedTitle: 'ማመልከቻው ተመዝግቧል', // needs native review
      submittedBodyDemo: 'የማሳያ ሁነታ፡ ማመልከቻዎ ለማሳያ ብቻ ተመዝግቧል። ወደ እውነተኛ አሰሪ አልተላከም።', // needs native review
      submittedBodyReal: 'ማመልከቻዎ ለአሰሪው ተልኳል።', // needs native review
      backToJobs: 'ወደ ተደራሽ ስራዎች ተመለስ', // needs native review
    },
  },
  employer: {
    pageTitle: 'የአሰሪ የስራ ድጋፍ መመዝገቢያ', // needs native review
    pageSubtitle: 'የስራ ቦታዎ የሚሰጠውን ተደራሽነት ይግለጹ። አመልካቾችን የህክምና ማስረጃ ወይም ምርመራ በፍጹም አይጠይቁ።', // needs native review
    safeguardBannerTitle: 'የግላዊነት እና የፍትሃዊነት ደንብ', // needs native review
    safeguardBannerBody: 'ማንኛውም ሳጥን የህክምና ማስረጃ፣ ምርመራ ወይም የአካል ጉዳት አይነት ከጠየቀ ማተም ይታገዳል።', // needs native review
    blockedPublishTitle: 'ከማተምዎ በፊት የህክምና ወይም የምርመራ ጥያቄን ያስወግዱ', // needs native review
    jobTitleLabel: 'የስራ መደብ ስም', // needs native review
    orgNameLabel: 'የድርጅት ስም', // needs native review
    locationLabel: 'ከተማ / ቦታ', // needs native review
    remoteCheckbox: 'ከርቀት መስራት ይቻላል', // needs native review
    employmentTypeLabel: 'የስራ አይነት', // needs native review
    summaryLabel: 'ቀላል የስራ ማብራሪያ', // needs native review
    skillsLabel: 'የሚፈለጉ ችሎታዎች (በኮማ ይለዩ)', // needs native review
    workEnvLabel: 'የስራ ቦታው ተደራሽነት', // needs native review
    remoteFlexLabel: 'የርቀት ወይም ተለዋዋጭ የስራ ሁኔታ', // needs native review
    assistiveTechLabel: 'ያለ አጋዥ ቴክኖሎጂ', // needs native review
    commOptionsLabel: 'የመግባቢያ አማራጮች', // needs native review
    interviewAccLabel: 'የቃለ መጠይቅ ድጋፎች', // needs native review
    appProcessAccLabel: 'የማመልከቻ ሂደት ድጋፎች', // needs native review
    additionalSupportLabel: 'ተጨማሪ የሚሰጥ ድጋፍ (አማራጭ)', // needs native review
    publishButton: 'ተደራሽ የስራ ማስታወቂያ አትም', // needs native review
    publishedSuccess: 'የስራ ማስታወቂያው ከSchema.org JSON-LD ጋር በተደራሽ ስራዎች ገጽ ታትሟል።', // needs native review
    viewPublishedInGateway: 'ማስታወቂያውን በስራ መግቢያው ይመልከቱ', // needs native review
  },
};
