import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Edit3, Lock, ShieldCheck, UserCheck, Users } from 'lucide-react';
import { useI18n } from '../../i18n';
import {
  ApiCapabilities,
  IdentityRoute,
  OnboardingDraft,
  SaveStorageStatus,
  SubmissionReceipt,
  SupportPreference,
} from '../../types/gateway';
import { gatewayApi } from '../../services/api/client';
import { emitGatewayEvent } from '../../utils/events';
import {
  deleteDraftFromIndexedDB,
  loadDraftFromIndexedDB,
  SanitizedLocalDraft,
  saveDraftToIndexedDB,
} from '../../utils/indexedDbDrafts';
import { FormStepDefinition, OneQuestionEngine } from '../forms/OneQuestionEngine';
import { VoiceTextField } from '../forms/VoiceTextField';
import { SaveResumePanel } from '../forms/SaveResumePanel';
import { FormErrorItem } from '../forms/ErrorSummary';

interface OnboardingWizardProps {
  tenantKey: string;
  initialMode?: 'self' | 'partner_assisted';
  hostElement?: HTMLElement | null;
  onNavigateToCareers: (prefill?: { name: string; contact: string }) => void;
}

const DEFAULT_DRAFT: OnboardingDraft = {
  isSharedDevice: null,
  registrationMode: 'self',
  fullName: '',
  contactMethod: 'phone',
  contactValue: '',
  identityRoute: '',
  identityReferenceNumber: '',
  partnerReferralOrg: '',
  supportPreferences: [],
  supportNotes: '',
  partnerConsent: {
    learnerConsented: false,
    consentLanguage: 'en',
    partnerOrganizationName: '',
    representativeName: '',
    sharedFieldsSummary: ['Full name', 'Contact method', 'Selected identity route'],
    recordedAtIso: '',
  },
  updatedAtIso: new Date().toISOString(),
};

export const OnboardingWizard: React.FC<OnboardingWizardProps> = ({
  tenantKey,
  initialMode = 'self',
  hostElement,
  onNavigateToCareers,
}) => {
  const { language, t } = useI18n();
  const [draft, setDraft] = useState<OnboardingDraft>({
    ...DEFAULT_DRAFT,
    registrationMode: initialMode,
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [isReview, setIsReview] = useState(false);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [storageStatus, setStorageStatus] = useState<SaveStorageStatus>('memory_only');
  const [existingDeviceDraft, setExistingDeviceDraft] = useState<SanitizedLocalDraft | null>(null);
  const [capabilities, setCapabilities] = useState<ApiCapabilities>({
    mode: gatewayApi.getMode(),
    serverDraftsEnabled: false,
    smsResumeEnabled: false,
    backendReachable: false,
    message: '',
  });

  useEffect(() => {
    emitGatewayEvent(
      'gateway:onboarding-started',
      {
        tenantKey,
        language,
        timestamp: new Date().toISOString(),
      },
      hostElement
    );
  }, [hostElement, language, tenantKey]);

  useEffect(() => {
    void gatewayApi.getCapabilities().then(setCapabilities);
    void loadDraftFromIndexedDB().then((found) => {
      if (found) setExistingDeviceDraft(found);
    });
  }, []);

  useEffect(() => {
    setDraft((prev) => ({ ...prev, registrationMode: initialMode }));
  }, [initialMode]);

  const updateDraft = useCallback((patch: Partial<OnboardingDraft>) => {
    setDraft((prev) => ({
      ...prev,
      ...patch,
      updatedAtIso: new Date().toISOString(),
    }));
  }, []);

  const toggleSupportPref = (pref: SupportPreference) => {
    setDraft((prev) => {
      const exists = prev.supportPreferences.includes(pref);
      const next = exists
        ? prev.supportPreferences.filter((p) => p !== pref)
        : [...prev.supportPreferences, pref];
      return { ...prev, supportPreferences: next, updatedAtIso: new Date().toISOString() };
    });
  };

  const handleSaveOnDevice = async () => {
    if (draft.isSharedDevice === true) return;
    const saved = await saveDraftToIndexedDB(draft);
    setExistingDeviceDraft(saved);
    setStorageStatus('device_indexeddb');
    emitGatewayEvent(
      'gateway:draft-saved',
      {
        storage: 'device_indexeddb',
        sensitiveExcluded: true,
        timestamp: saved.updatedAtIso,
      },
      hostElement
    );
  };

  const handleDeleteDeviceDraft = async () => {
    await deleteDraftFromIndexedDB();
    setExistingDeviceDraft(null);
    setStorageStatus('memory_only');
  };

  const handleResumeDeviceDraft = () => {
    if (!existingDeviceDraft) return;
    setDraft((prev) => ({
      ...prev,
      registrationMode: existingDeviceDraft.registrationMode,
      fullName: existingDeviceDraft.fullName,
      contactMethod: existingDeviceDraft.contactMethod,
      contactValue: existingDeviceDraft.contactValue,
      identityRoute: existingDeviceDraft.identityRoute,
      partnerReferralOrg: existingDeviceDraft.partnerReferralOrg,
      updatedAtIso: new Date().toISOString(),
    }));
    setStorageStatus('device_indexeddb');
  };

  const handleRequestSmsResume = async (phone: string) => {
    return gatewayApi.requestSmsResume(phone, 'local-draft-token');
  };

  const steps: FormStepDefinition[] = useMemo(() => {
    const baseSteps: FormStepDefinition[] = [
      {
        id: 'device-privacy',
        title: t.onboarding.stepDeviceTitle,
        helpText: t.onboarding.stepDeviceHelp,
        whyWeAsk: t.onboarding.stepDeviceWhy,
        renderContent: () => (
          <div className="space-y-6">
            <fieldset className="space-y-3">
              <legend className="text-base font-semibold text-slate-900">
                {t.saveResume.sharedPhoneQuestion}
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  aria-pressed={draft.isSharedDevice === false}
                  onClick={() => updateDraft({ isSharedDevice: false })}
                  className={`min-h-[56px] p-4 rounded-xl border-2 text-start font-medium transition-colors ${
                    draft.isSharedDevice === false
                      ? 'border-slate-900 bg-slate-100 text-slate-950 font-semibold'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {t.saveResume.sharedPhoneNo}
                </button>
                <button
                  type="button"
                  aria-pressed={draft.isSharedDevice === true}
                  onClick={() => {
                    updateDraft({ isSharedDevice: true });
                    void handleDeleteDeviceDraft();
                  }}
                  className={`min-h-[56px] p-4 rounded-xl border-2 text-start font-medium transition-colors ${
                    draft.isSharedDevice === true
                      ? 'border-slate-900 bg-slate-100 text-slate-950 font-semibold'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {t.saveResume.sharedPhoneYes}
                </button>
              </div>
            </fieldset>

            <fieldset className="space-y-3 pt-2 border-t border-slate-200">
              <legend className="text-base font-semibold text-slate-900">
                Who is filling out this form?
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  aria-pressed={draft.registrationMode === 'self'}
                  onClick={() => updateDraft({ registrationMode: 'self' })}
                  className={`flex items-center gap-3 min-h-[56px] p-4 rounded-xl border-2 text-start transition-colors ${
                    draft.registrationMode === 'self'
                      ? 'border-slate-900 bg-slate-100 text-slate-950 font-semibold'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <UserCheck className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span>I am registering myself</span>
                </button>
                <button
                  type="button"
                  aria-pressed={draft.registrationMode === 'partner_assisted'}
                  onClick={() => updateDraft({ registrationMode: 'partner_assisted' })}
                  className={`flex items-center gap-3 min-h-[56px] p-4 rounded-xl border-2 text-start transition-colors ${
                    draft.registrationMode === 'partner_assisted'
                      ? 'border-slate-900 bg-slate-100 text-slate-950 font-semibold'
                      : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  <Users className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span>{t.home.partnerModeCta}</span>
                </button>
              </div>
            </fieldset>
          </div>
        ),
      },
      {
        id: 'full-name',
        title: t.onboarding.stepNameTitle,
        helpText: t.onboarding.stepNameHelp,
        whyWeAsk: t.onboarding.stepNameWhy,
        validate: () => {
          if (!draft.fullName.trim()) {
            return [{ fieldId: 'gw-onboarding-name', message: t.onboarding.errors.emptyName }];
          }
          return [];
        },
        renderContent: () => (
          <VoiceTextField
            id="gw-onboarding-name"
            label={t.onboarding.stepNameLabel}
            value={draft.fullName}
            onChange={(val) => updateDraft({ fullName: val })}
            required
            autoComplete="name"
            placeholder="Abebe Bikila / አበበ ቢቂላ"
          />
        ),
      },
      {
        id: 'contact',
        title: t.onboarding.stepContactTitle,
        helpText: t.onboarding.stepContactHelp,
        whyWeAsk: t.onboarding.stepContactWhy,
        optional: true,
        validate: () => {
          if (draft.contactMethod !== 'none' && !draft.contactValue.trim()) {
            return [
              { fieldId: 'gw-onboarding-contact', message: t.onboarding.errors.emptyContactValue },
            ];
          }
          return [];
        },
        renderContent: () => (
          <div className="space-y-5">
            <fieldset className="space-y-2.5">
              <legend className="text-base font-semibold text-slate-900">
                {t.onboarding.stepContactMethodLabel}
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(['phone', 'email', 'partner_contact', 'none'] as const).map((method) => (
                  <label
                    key={method}
                    className={`flex items-center gap-3 min-h-[48px] px-4 py-3 rounded-xl border-2 cursor-pointer ${
                      draft.contactMethod === method
                        ? 'border-slate-900 bg-slate-100 font-semibold text-slate-950'
                        : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="gw-contact-method"
                      checked={draft.contactMethod === method}
                      onChange={() => updateDraft({ contactMethod: method })}
                      className="h-5 w-5"
                    />
                    <span>{t.onboarding.contactMethods[method]}</span>
                  </label>
                ))}
              </div>
            </fieldset>

            {draft.contactMethod !== 'none' && (
              <VoiceTextField
                id="gw-onboarding-contact"
                label={t.onboarding.stepContactValueLabel}
                value={draft.contactValue}
                onChange={(val) => updateDraft({ contactValue: val })}
                inputMode={draft.contactMethod === 'phone' ? 'tel' : draft.contactMethod === 'email' ? 'email' : 'text'}
                placeholder={
                  draft.contactMethod === 'email'
                    ? 'name@example.com'
                    : draft.contactMethod === 'phone'
                    ? '+251 9...'
                    : 'Partner contact name or desk'
                }
              />
            )}
          </div>
        ),
      },
      {
        id: 'identity-route',
        title: t.onboarding.stepIdentityTitle,
        helpText: t.onboarding.stepIdentityHelp,
        whyWeAsk: t.onboarding.stepIdentityWhy,
        validate: () => {
          const errs: FormErrorItem[] = [];
          if (!draft.identityRoute) {
            errs.push({
              fieldId: 'gw-identity-group',
              message: t.onboarding.errors.emptyIdentityRoute,
            });
          }
          return errs;
        },
        renderContent: () => {
          const routes: IdentityRoute[] = [
            'national_id',
            'refugee_id',
            'other_document',
            'no_documents',
            'partner_referral',
          ];
          return (
            <div className="space-y-5">
              <fieldset id="gw-identity-group" className="space-y-3">
                <legend className="gw-sr-only">{t.onboarding.stepIdentityTitle}</legend>
                {routes.map((routeKey) => {
                  const info = t.onboarding.identityRoutes[routeKey];
                  const selected = draft.identityRoute === routeKey;
                  return (
                    <label
                      key={routeKey}
                      className={`flex items-start gap-3.5 min-h-[56px] p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        selected
                          ? 'border-slate-900 bg-slate-100 text-slate-950'
                          : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="gw-identity-route"
                        value={routeKey}
                        checked={selected}
                        onChange={() => updateDraft({ identityRoute: routeKey })}
                        className="mt-1 h-5 w-5 shrink-0"
                      />
                      <div>
                        <div className="text-base font-semibold text-slate-900">{info.label}</div>
                        <div className="text-sm text-slate-700 mt-0.5">{info.desc}</div>
                      </div>
                    </label>
                  );
                })}
              </fieldset>

              {(draft.identityRoute === 'national_id' ||
                draft.identityRoute === 'refugee_id' ||
                draft.identityRoute === 'other_document') && (
                <VoiceTextField
                  id="gw-identity-number"
                  label={t.onboarding.idNumberLabel}
                  value={draft.identityReferenceNumber}
                  onChange={(val) => updateDraft({ identityReferenceNumber: val })}
                  sensitiveIdentifier={true}
                  partnerAssisted={draft.registrationMode === 'partner_assisted'}
                  placeholder="Optional reference number"
                />
              )}

              {draft.identityRoute === 'partner_referral' && (
                <VoiceTextField
                  id="gw-partner-referral-org"
                  label={t.onboarding.partnerReferralOrgLabel}
                  value={draft.partnerReferralOrg}
                  onChange={(val) => updateDraft({ partnerReferralOrg: val })}
                  placeholder="Example: Addis Community Learning Hub"
                />
              )}
            </div>
          );
        },
      },
      {
        id: 'private-support',
        title: t.onboarding.stepSupportTitle,
        helpText: t.onboarding.stepSupportHelp,
        whyWeAsk: t.onboarding.stepSupportWhy,
        optional: true,
        renderContent: () => {
          const prefs: SupportPreference[] = [
            'help_completing',
            'communication_assistance',
            'alternative_materials',
            'flexible_scheduling',
            'other_support',
            'discuss_privately',
          ];
          return (
            <div className="space-y-5">
              <div className="flex items-start gap-2.5 rounded-lg border border-teal-800/30 bg-teal-50 p-3.5 text-sm text-teal-950">
                <Lock className="w-4 h-4 shrink-0 mt-0.5 text-teal-800" aria-hidden="true" />
                <span>{t.onboarding.stepSupportPrivacyNotice}</span>
              </div>

              <fieldset className="space-y-2.5">
                <legend className="gw-sr-only">{t.onboarding.stepSupportTitle}</legend>
                {prefs.map((pref) => {
                  const checked = draft.supportPreferences.includes(pref);
                  return (
                    <label
                      key={pref}
                      className={`flex items-center gap-3 min-h-[48px] px-4 py-3 rounded-xl border-2 cursor-pointer ${
                        checked
                          ? 'border-slate-900 bg-slate-100 font-semibold text-slate-950'
                          : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSupportPref(pref)}
                        className="h-5 w-5 shrink-0 rounded"
                      />
                      <span>{t.onboarding.supportOptions[pref]}</span>
                    </label>
                  );
                })}
              </fieldset>

              <VoiceTextField
                id="gw-support-notes"
                label={t.onboarding.supportNotesLabel}
                value={draft.supportNotes}
                onChange={(val) => updateDraft({ supportNotes: val })}
                multiline
                placeholder="Example: Larger text on handouts helps me read."
              />
            </div>
          );
        },
      },
    ];

    if (draft.registrationMode === 'partner_assisted') {
      baseSteps.push({
        id: 'partner-consent',
        title: t.onboarding.stepPartnerConsentTitle,
        helpText: t.onboarding.stepPartnerConsentHelp,
        whyWeAsk: t.onboarding.stepPartnerConsentWhy,
        readAloudExtra: t.onboarding.partnerSharedScopeText,
        validate: () => {
          const errs: FormErrorItem[] = [];
          if (!draft.partnerConsent?.partnerOrganizationName.trim()) {
            errs.push({
              fieldId: 'gw-partner-org-name',
              message: t.onboarding.errors.emptyPartnerOrg,
            });
          }
          if (!draft.partnerConsent?.learnerConsented) {
            errs.push({
              fieldId: 'gw-partner-consent-checkbox',
              message: t.onboarding.errors.emptyPartnerConsent,
            });
          }
          return errs;
        },
        renderContent: () => (
          <div className="space-y-5">
            <div className="rounded-lg border border-slate-300 bg-slate-50 p-4 text-sm text-slate-800 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <ShieldCheck className="w-4 h-4 text-slate-700" aria-hidden="true" />
                <span>Data sharing summary for consent</span>
              </div>
              <p>{t.onboarding.partnerSharedScopeText}</p>
            </div>

            <VoiceTextField
              id="gw-partner-org-name"
              label={t.onboarding.partnerOrgInputLabel}
              value={draft.partnerConsent?.partnerOrganizationName || ''}
              onChange={(val) =>
                updateDraft({
                  partnerConsent: {
                    ...(draft.partnerConsent || DEFAULT_DRAFT.partnerConsent!),
                    partnerOrganizationName: val,
                  },
                })
              }
              required
            />

            <VoiceTextField
              id="gw-partner-rep-name"
              label={t.onboarding.partnerRepInputLabel}
              value={draft.partnerConsent?.representativeName || ''}
              onChange={(val) =>
                updateDraft({
                  partnerConsent: {
                    ...(draft.partnerConsent || DEFAULT_DRAFT.partnerConsent!),
                    representativeName: val,
                  },
                })
              }
              required
            />

            <label
              htmlFor="gw-partner-consent-checkbox"
              className="flex items-start gap-3 min-h-[56px] p-4 rounded-xl border-2 border-slate-400 bg-white cursor-pointer"
            >
              <input
                id="gw-partner-consent-checkbox"
                type="checkbox"
                checked={Boolean(draft.partnerConsent?.learnerConsented)}
                onChange={(e) =>
                  updateDraft({
                    partnerConsent: {
                      ...(draft.partnerConsent || DEFAULT_DRAFT.partnerConsent!),
                      learnerConsented: e.target.checked,
                      consentLanguage: language,
                      recordedAtIso: e.target.checked ? new Date().toISOString() : '',
                    },
                  })
                }
                className="mt-1 h-5 w-5 shrink-0"
              />
              <span className="text-base font-medium text-slate-900">
                {t.onboarding.partnerConsentCheckbox}
              </span>
            </label>
            {draft.partnerConsent?.learnerConsented && draft.partnerConsent.recordedAtIso && (
              <p className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-300 rounded-md px-3 py-2">
                Consent timestamp recorded: {new Date(draft.partnerConsent.recordedAtIso).toLocaleString()}
              </p>
            )}
          </div>
        ),
      });
    }

    return baseSteps;
  }, [draft, language, t, updateDraft]);

  const handleStepChange = (nextIdx: number) => {
    setIsReview(false);
    setStepIndex(nextIdx);
    const targetStep = steps[nextIdx];
    if (targetStep) {
      emitGatewayEvent(
        'gateway:step-changed',
        {
          flow: 'onboarding',
          stepId: targetStep.id,
          stepIndex: nextIdx,
          totalSteps: steps.length + 1,
        },
        hostElement
      );
    }
  };

  const handleSubmitFinal = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const res = await gatewayApi.submitOnboarding(draft);
      setReceipt(res);
      setStorageStatus(res.persistedToServer ? 'server_saved' : storageStatus);

      // Privacy rule: NEVER include private support preferences or identity numbers in custom event
      emitGatewayEvent(
        'gateway:onboarding-submitted',
        {
          submissionId: res.id,
          mode: res.mode,
          registrationMode: draft.registrationMode,
          identityRoute: draft.identityRoute,
          supportRequestedFlag: draft.supportPreferences.length > 0,
        },
        hostElement
      );

      if (draft.supportPreferences.length > 0) {
        emitGatewayEvent(
          'gateway:support-requested',
          {
            hasSupportRequest: true,
          },
          hostElement
        );
      }
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not send registration right now. Your answers are still safe on this screen.';
      setSubmitError(msg);
      setStorageStatus('not_saved_error');
      emitGatewayEvent(
        'gateway:error',
        { code: 'ONBOARDING_SUBMIT_FAILED', message: msg, recoverable: true },
        hostElement
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (receipt) {
    return (
      <section aria-labelledby="gw-confirm-heading" className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-2xl border-2 border-emerald-700 bg-white p-6 sm:p-8 space-y-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <h2 id="gw-confirm-heading" className="text-2xl font-bold text-slate-900">
                {t.onboarding.confirmationTitle}
              </h2>
              <p className="text-sm font-mono text-slate-600">Reference: {receipt.id}</p>
            </div>
          </div>

          <p className="text-base text-slate-800 bg-slate-50 border border-slate-300 rounded-xl p-4">
            {receipt.persistedToServer
              ? t.onboarding.confirmationRealNote
              : t.onboarding.confirmationDemoNote}
          </p>

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() =>
                onNavigateToCareers({
                  name: draft.fullName,
                  contact: draft.contactValue,
                })
              }
              className="min-h-[48px] px-6 py-3 rounded-xl text-base font-semibold"
              style={{
                backgroundColor: 'var(--gw-primary)',
                color: 'var(--gw-primary-text)',
              }}
            >
              {t.onboarding.startCareerFromConfirm}
            </button>
            <button
              type="button"
              onClick={() => {
                setReceipt(null);
                setIsReview(false);
                setStepIndex(0);
              }}
              className="min-h-[48px] px-5 py-3 rounded-xl border border-slate-400 bg-white text-slate-900 text-base font-medium hover:bg-slate-50"
            >
              Start another registration
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <OneQuestionEngine
        flowTitle={t.onboarding.pageTitle}
        steps={steps}
        currentStepIndex={stepIndex}
        onStepChange={handleStepChange}
        onCompleteReview={() => setIsReview(true)}
        isReviewStep={isReview}
        onSubmitFinal={handleSubmitFinal}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onRetrySubmit={handleSubmitFinal}
        renderReviewContent={() => (
          <div className="space-y-4">
            <dl className="divide-y divide-slate-200 border border-slate-300 rounded-xl bg-slate-50/50">
              <div className="p-4 flex items-start justify-between gap-4">
                <div>
                  <dt className="text-xs font-semibold text-slate-600">{t.onboarding.stepNameLabel}</dt>
                  <dd className="text-base font-medium text-slate-900 mt-0.5">
                    {draft.fullName || 'Not provided'}
                  </dd>
                </div>
                <button
                  type="button"
                  onClick={() => handleStepChange(1)}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-900 hover:bg-slate-100"
                >
                  <Edit3 className="w-4 h-4" aria-hidden="true" />
                  <span>{t.common.edit}</span>
                </button>
              </div>

              <div className="p-4 flex items-start justify-between gap-4">
                <div>
                  <dt className="text-xs font-semibold text-slate-600">{t.onboarding.stepContactMethodLabel}</dt>
                  <dd className="text-base font-medium text-slate-900 mt-0.5">
                    {t.onboarding.contactMethods[draft.contactMethod]}
                    {draft.contactMethod !== 'none' && draft.contactValue ? ` · ${draft.contactValue}` : ''}
                  </dd>
                </div>
                <button
                  type="button"
                  onClick={() => handleStepChange(2)}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-900 hover:bg-slate-100"
                >
                  <Edit3 className="w-4 h-4" aria-hidden="true" />
                  <span>{t.common.edit}</span>
                </button>
              </div>

              <div className="p-4 flex items-start justify-between gap-4">
                <div>
                  <dt className="text-xs font-semibold text-slate-600">{t.onboarding.stepIdentityTitle}</dt>
                  <dd className="text-base font-medium text-slate-900 mt-0.5">
                    {draft.identityRoute
                      ? t.onboarding.identityRoutes[draft.identityRoute].label
                      : 'Not chosen'}
                    {draft.partnerReferralOrg ? ` · ${draft.partnerReferralOrg}` : ''}
                  </dd>
                </div>
                <button
                  type="button"
                  onClick={() => handleStepChange(3)}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-900 hover:bg-slate-100"
                >
                  <Edit3 className="w-4 h-4" aria-hidden="true" />
                  <span>{t.common.edit}</span>
                </button>
              </div>

              <div className="p-4 flex items-start justify-between gap-4">
                <div>
                  <dt className="text-xs font-semibold text-slate-600">
                    {t.onboarding.stepSupportTitle} (Private)
                  </dt>
                  <dd className="text-base font-medium text-slate-900 mt-0.5">
                    {draft.supportPreferences.length > 0
                      ? draft.supportPreferences.map((p) => t.onboarding.supportOptions[p]).join(', ')
                      : 'Skipped / none selected'}
                  </dd>
                </div>
                <button
                  type="button"
                  onClick={() => handleStepChange(4)}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-900 hover:bg-slate-100"
                >
                  <Edit3 className="w-4 h-4" aria-hidden="true" />
                  <span>{t.common.edit}</span>
                </button>
              </div>
            </dl>
          </div>
        )}
      />

      {/* Save & Resume Privacy Panel */}
      <SaveResumePanel
        isSharedDevice={draft.isSharedDevice}
        storageStatus={storageStatus}
        capabilities={capabilities}
        existingDeviceDraft={existingDeviceDraft}
        onSaveOnDevice={handleSaveOnDevice}
        onDeleteDeviceDraft={handleDeleteDeviceDraft}
        onResumeDeviceDraft={handleResumeDeviceDraft}
        onRequestSmsResume={handleRequestSmsResume}
      />
    </div>
  );
};
