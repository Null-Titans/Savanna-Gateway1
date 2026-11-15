/**
 * Pure core helpers (zero external dependencies) so both the React app
 * and plain Node.js (`node --test`) can verify phone normalisation,
 * Ethiopian calendar formatting, step navigation, and autosave restore.
 */

// ADDED: Normalize Ethiopian phone inputs (09..., 07..., 251..., +251...) to +251XXXXXXXXX
export function normalizeEthiopianPhone(raw) {
  if (typeof raw !== 'string') return null;
  const cleaned = raw.replace(/[\s\-().]/g, '').trim();
  if (!cleaned) return null;

  let digits = cleaned;
  if (digits.startsWith('+')) {
    digits = digits.slice(1);
  }
  if (digits.startsWith('00251')) {
    digits = digits.slice(2);
  }
  if (digits.startsWith('251')) {
    const subscriber = digits.slice(3);
    if (/^[79]\d{8}$/.test(subscriber)) {
      return `+251${subscriber}`;
    }
    return null;
  }
  if (digits.startsWith('0')) {
    const subscriber = digits.slice(1);
    if (/^[79]\d{8}$/.test(subscriber)) {
      return `+251${subscriber}`;
    }
    return null;
  }
  if (/^[79]\d{8}$/.test(digits)) {
    return `+251${digits}`;
  }
  return null;
}

// ADDED: Ethiopian calendar date display via Intl.DateTimeFormat('am-ET-u-ca-ethiopic')
/**
 * @param {Date | string | number} [input]
 * @returns {string}
 */
export function formatEthiopianDate(input = new Date()) {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return '';
  try {
    return new Intl.DateTimeFormat('am-ET-u-ca-ethiopic', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return date.toISOString().split('T')[0];
  }
}

// ADDED: Pure step-engine transition calculator
export function computeStepTransition({
  currentStepIndex,
  totalFormSteps,
  isReviewStep,
  action,
  targetStepIndex,
}) {
  const safeTotal = Math.max(1, Number(totalFormSteps) || 1);
  const totalWithReview = safeTotal + 1;

  if (action === 'goto' && typeof targetStepIndex === 'number') {
    const clamped = Math.max(0, Math.min(safeTotal - 1, targetStepIndex));
    return {
      stepIndex: clamped,
      isReviewStep: false,
      step: clamped + 1,
      of: totalWithReview,
    };
  }

  if (action === 'next' || action === 'skip') {
    if (isReviewStep) {
      return {
        stepIndex: safeTotal - 1,
        isReviewStep: true,
        step: totalWithReview,
        of: totalWithReview,
      };
    }
    if (currentStepIndex < safeTotal - 1) {
      const next = currentStepIndex + 1;
      return {
        stepIndex: next,
        isReviewStep: false,
        step: next + 1,
        of: totalWithReview,
      };
    }
    return {
      stepIndex: safeTotal - 1,
      isReviewStep: true,
      step: totalWithReview,
      of: totalWithReview,
    };
  }

  if (action === 'back') {
    if (isReviewStep) {
      return {
        stepIndex: safeTotal - 1,
        isReviewStep: false,
        step: safeTotal,
        of: totalWithReview,
      };
    }
    const prev = Math.max(0, currentStepIndex - 1);
    return {
      stepIndex: prev,
      isReviewStep: false,
      step: prev + 1,
      of: totalWithReview,
    };
  }

  const clamped = Math.max(0, Math.min(safeTotal - 1, currentStepIndex));
  return {
    stepIndex: clamped,
    isReviewStep: Boolean(isReviewStep),
    step: isReviewStep ? totalWithReview : clamped + 1,
    of: totalWithReview,
  };
}

// ADDED: Pure autosave sanitization & restore helpers (privacy-first: strips ID numbers & private support)
export function sanitizeDraftPayload(draft) {
  return {
    registrationMode: draft?.registrationMode === 'partner_assisted' ? 'partner_assisted' : 'self',
    fullName: String(draft?.fullName || ''),
    contactMethod: ['phone', 'email', 'partner_contact', 'none'].includes(draft?.contactMethod)
      ? draft.contactMethod
      : 'phone',
    contactValue: String(draft?.contactValue || ''),
    identityRoute: String(draft?.identityRoute || ''),
    partnerReferralOrg: String(draft?.partnerReferralOrg || ''),
    updatedAtIso: new Date().toISOString(),
    excludedSensitiveNotice:
      'Identity numbers and private support preferences are excluded from device storage for privacy.',
  };
}

export function restoreDraftPayload(raw) {
  if (!raw) return null;
  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!parsed || typeof parsed !== 'object') return null;
  return {
    registrationMode: parsed.registrationMode === 'partner_assisted' ? 'partner_assisted' : 'self',
    fullName: typeof parsed.fullName === 'string' ? parsed.fullName : '',
    contactMethod: ['phone', 'email', 'partner_contact', 'none'].includes(parsed.contactMethod)
      ? parsed.contactMethod
      : 'phone',
    contactValue: typeof parsed.contactValue === 'string' ? parsed.contactValue : '',
    identityRoute: typeof parsed.identityRoute === 'string' ? parsed.identityRoute : '',
    partnerReferralOrg: typeof parsed.partnerReferralOrg === 'string' ? parsed.partnerReferralOrg : '',
    updatedAtIso: typeof parsed.updatedAtIso === 'string' ? parsed.updatedAtIso : '',
  };
}
