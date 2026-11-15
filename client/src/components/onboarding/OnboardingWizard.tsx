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
import { formatEthiopianDate, normalizeEthiopianPhone } from '../../utils/coreHelpers.mjs';
import { LiveRegion } from '../accessibility/LiveRegion';
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
  initialMode?: 'self' | 'partner_assisted' | 'edit';
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
  const isEditMode = initialMode === 'edit';
  const [draft, setDraft] = useState<OnboardingDraft>({
    ...DEFAULT_DRAFT,
    registrationMode: initialMode === 'partner_assisted' ? 'partner_assisted' : 'self',
  });
  const [learnerId, setLearnerId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [isReview, setIsReview] = useState(false);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [networkNotice, setNetworkNotice] = useState<string>('');
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
    if (isEditMode) {
      void gatewayApi.getLearner().then((saved) => {
        if (saved) {
          setLearnerId(saved.id);
          setDraft((prev) => ({
            ...prev,
            isSharedDevice: false,
            registrationMode: saved.registrationMode,
            fullName: saved.fullName,
            contactMethod: saved.contactMethod,
            contactValue: saved.contactValue,
            identityRoute: saved.identityRoute,
            partnerReferralOrg: saved.partnerReferralOrg,
            supportPreferences: saved.supportPreferences || [],
            supportNotes: saved.supportNotes || '',
            partnerConsent: saved.partnerConsent || prev.partnerConsent,
          }));
        }
      });
    }
  }, [isEditMode]);

  useEffect(() => {
    if (initialMode !== 'edit') {
      setDraft((prev) => ({ ...prev, registrationMode: initialMode }));
    }
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
              <legend className="text-base font-semibold text-[#0F1E36] dark:text-white">
                {t.saveResume.sharedPhoneQuestion}
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  aria-pressed={draft.isSharedDevice === false}
                  onClick={() => updateDraft({ isSharedDevice: false })}
                  className={`min-h-[56px] p-4 rounded-xl border-2 text-start font-medium transition-colors cursor-pointer ${
                    draft.isSharedDevice === false
                      ? 'border-[#0F1E36] dark:border-amber-400 bg-[#0F1E36]/[0.05] dark:bg-amber-500/15 text-[#0F1E36] dark:text-amber-100 font-semibold ring-1 ring-[#0F1E36] dark:ring-amber-400'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
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
                  className={`min-h-[56px] p-4 rounded-xl border-2 text-start font-medium transition-colors cursor-pointer ${
                    draft.isSharedDevice === true
                      ? 'border-[#0F1E36] dark:border-amber-400 bg-[#0F1E36]/[0.05] dark:bg-amber-500/15 text-[#0F1E36] dark:text-amber-100 font-semibold ring-1 ring-[#0F1E36] dark:ring-amber-400'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {t.saveResume.sharedPhoneYes}
                </button>
              </div>
            </fieldset>

            <fieldset className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <legend className="text-base font-semibold text-[#0F1E36] dark:text-white">
                Who is filling out this form?
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  aria-pressed={draft.registrationMode === 'self'}
                  onClick={() => updateDraft({ registrationMode: 'self' })}
                  className={`flex items-center gap-3 min-h-[56px] p-4 rounded-xl border-2 text-start transition-colors cursor-pointer ${
                    draft.registrationMode === 'self'
                      ? 'border-[#0F1E36] dark:border-amber-400 bg-[#0F1E36]/[0.05] dark:bg-amber-500/15 text-[#0F1E36] dark:text-amber-100 font-semibold ring-1 ring-[#0F1E36] dark:ring-amber-400'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <UserCheck className="w-5 h-5 shrink-0" aria-hidden="true" />
                  <span>I am registering myself</span>
                </button>
                <button
                  type="button"
                  aria-pressed={draft.registrationMode === 'partner_assisted'}
                  onClick={() => updateDraft({ registrationMode: 'partner_assisted' })}
                  className={`flex items-center gap-3 min-h-[56px] p-4 rounded-xl border-2 text-start transition-colors cursor-pointer ${
                    draft.registrationMode === 'partner_assisted'
                      ? 'border-[#0F1E36] dark:border-amber-400 bg-[#0F1E36]/[0.05] dark:bg-amber-500/15 text-[#0F1E36] dark:text-amber-100 font-semibold ring-1 ring-[#0F1E36] dark:ring-amber-400'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
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
          if (draft.contactMethod === 'phone' && draft.contactValue.trim()) {
            const normalized = normalizeEthiopianPhone(draft.contactValue);
            if (!normalized) {
              return [
                { fieldId: 'gw-onboarding-contact', message: t.onboarding.errors.invalidEthiopianPhone },
              ];
            }
            if (normalized !== draft.contactValue) {
              updateDraft({ contactValue: normalized });
            }
          }
          return [];
        },
        renderContent: () => (
          <div className="space-y-5">
            <fieldset className="space-y-2.5">
              <legend className="text-base font-semibold text-[#0F1E36] dark:text-white">
                {t.onboarding.stepContactMethodLabel}
              </legend>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {(['phone', 'email', 'partner_contact', 'none'] as const).map((method) => (
                  <label
                    key={method}
                    className={`flex items-center gap-3 min-h-[48px] px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
                      draft.contactMethod === method
                        ? 'border-[#0F1E36] dark:border-amber-400 bg-[#0F1E36]/[0.05] dark:bg-amber-500/15 font-semibold text-[#0F1E36] dark:text-amber-100'
                        : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <input
                      type="radio"
                      name="gw-contact-method"
                      checked={draft.contactMethod === method}
                      onChange={() => updateDraft({ contactMethod: method })}
                      className="h-5 w-5 accent-[#0F1E36] dark:accent-amber-500"
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
                          ? 'border-[#0F1E36] dark:border-amber-400 bg-[#0F1E36]/[0.05] dark:bg-amber-500/15 text-[#0F1E36] dark:text-amber-100'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name="gw-identity-route"
                        value={routeKey}
                        checked={selected}
                        onChange={() => updateDraft({ identityRoute: routeKey })}
                        className="mt-1 h-5 w-5 shrink-0 accent-[#0F1E36] dark:accent-amber-500"
                      />
                      <div>
                        <div className="text-base font-semibold text-[#0F1E36] dark:text-white">
                          {info.label}
                        </div>
                        <div className="text-sm text-slate-700 dark:text-slate-300 mt-0.5">
                          {info.desc}
                        </div>
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
              <div className="flex items-start gap-2.5 rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 p-3.5 text-sm text-[#0F1E36] dark:text-amber-100">
                <Lock className="w-4 h-4 shrink-0 mt-0.5 text-amber-800 dark:text-amber-400" aria-hidden="true" />
                <span>{t.onboarding.stepSupportPrivacyNotice}</span>
              </div>

              <fieldset className="space-y-2.5">
                <legend className="gw-sr-only">{t.onboarding.stepSupportTitle}</legend>
                {prefs.map((pref) => {
                  const checked = draft.supportPreferences.includes(pref);
                  return (
                    <label
                      key={pref}
                      className={`flex items-center gap-3 min-h-[48px] px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
                        checked
                          ? 'border-[#0F1E36] dark:border-amber-400 bg-[#0F1E36]/[0.05] dark:bg-amber-500/15 font-semibold text-[#0F1E36] dark:text-amber-100'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleSupportPref(pref)}
                        className="h-5 w-5 shrink-0 rounded accent-[#0F1E36] dark:accent-amber-500"
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
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800/80 p-4 text-sm text-slate-800 dark:text-slate-200 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-[#0F1E36] dark:text-white">
                <ShieldCheck className="w-4 h-4 text-[#1E3A5F] dark:text-amber-400" aria-hidden="true" />
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
              className="flex items-start gap-3 min-h-[56px] p-4 rounded-xl border-2 border-[#0F1E36]/30 dark:border-slate-600 bg-white dark:bg-slate-800/70 hover:border-[#0F1E36] dark:hover:border-amber-400 transition-colors cursor-pointer"
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
                className="mt-1 h-5 w-5 shrink-0 accent-[#0F1E36] dark:accent-amber-500"
              />
              <span className="text-base font-medium text-[#0F1E36] dark:text-slate-100">
                {t.onboarding.partnerConsentCheckbox}
              </span>
            </label>
            {draft.partnerConsent?.learnerConsented && draft.partnerConsent.recordedAtIso && (
              <p className="text-xs text-emerald-900 dark:text-emerald-100 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-700 rounded-md px-3 py-2">
                Consent timestamp recorded: {new Date(draft.partnerConsent.recordedAtIso).toLocaleString()} (
                {formatEthiopianDate(draft.partnerConsent.recordedAtIso)})
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
      emitGatewayEvent(
        'db-signup:step',
        {
          step: nextIdx + 1,
          of: steps.length + 1,
        },
        hostElement
      );
    }
  };

  const handleSubmitFinal = useCallback(async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const normalizedDraft =
        draft.contactMethod === 'phone' && draft.contactValue.trim()
          ? { ...draft, contactValue: normalizeEthiopianPhone(draft.contactValue) || draft.contactValue }
          : draft;

      let res: SubmissionReceipt;
      if (isEditMode && learnerId) {
        const updated = await gatewayApi.updateLearner(learnerId, normalizedDraft);
        res = {
          id: updated.id,
          submittedAtIso: updated.updatedAtIso,
          mode: gatewayApi.getMode(),
          persistedToServer: gatewayApi.getMode() === 'real',
          notice: t.onboarding.editModeSavedNote,
        };
      } else {
        res = await gatewayApi.submitOnboarding(normalizedDraft);
      }

      setReceipt(res);
      setStorageStatus(res.persistedToServer ? 'server_saved' : storageStatus);

      const emittedIdRoute =
        normalizedDraft.identityRoute === 'no_documents' || normalizedDraft.identityRoute === 'partner_referral'
          ? 'partner-referral'
          : normalizedDraft.identityRoute;

      // Privacy rule: NEVER include private support preferences or identity numbers in custom event
      emitGatewayEvent(
        'gateway:onboarding-submitted',
        {
          submissionId: res.id,
          mode: res.mode,
          registrationMode: normalizedDraft.registrationMode,
          identityRoute: normalizedDraft.identityRoute,
          supportRequestedFlag: normalizedDraft.supportPreferences.length > 0,
        },
        hostElement
      );

      emitGatewayEvent(
        'db-signup:done',
        {
          submissionId: res.id,
          mode: isEditMode ? 'edit' : res.mode,
          profile: {
            id: res.id,
            fullName: normalizedDraft.fullName,
            contactMethod: normalizedDraft.contactMethod,
            idRoute: emittedIdRoute,
            registrationMode: normalizedDraft.registrationMode,
          },
        },
        hostElement
      );

      if (normalizedDraft.supportPreferences.length > 0) {
        emitGatewayEvent(
          'gateway:support-requested',
          {
            hasSupportRequest: true,
          },
          hostElement
        );
        emitGatewayEvent(
          'db-signup:support',
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
  }, [draft, hostElement, isEditMode, learnerId, storageStatus, t.onboarding.editModeSavedNote]);

  // ADDED: Resilience — listen to offline/online events, announce in live region, auto-retry failed submit
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOffline = () => {
      setNetworkNotice(t.common.offlineNotice);
    };
    const onOnline = () => {
      setNetworkNotice(t.common.onlineRetryNotice);
      if (submitError && !isSubmitting) {
        void handleSubmitFinal();
      }
    };
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, [handleSubmitFinal, isSubmitting, submitError, t.common.offlineNotice, t.common.onlineRetryNotice]);

  if (receipt) {
    return (
      <section aria-labelledby="gw-confirm-heading" className="max-w-3xl mx-auto space-y-6">
        <div className="rounded-2xl border-2 border-emerald-700 dark:border-emerald-600 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-start gap-3.5">
            <span className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
            </span>
            <div className="space-y-1">
              <h2 id="gw-confirm-heading" className="text-2xl font-bold text-[#0F1E36] dark:text-white">
                {t.onboarding.confirmationTitle}
              </h2>
              <p className="text-sm font-mono text-slate-600 dark:text-slate-300 tabular-nums">
                Reference: {receipt.id} · {formatEthiopianDate(receipt.submittedAtIso)}
              </p>
            </div>
          </div>

          <p className="text-base text-[#0F1E36] dark:text-slate-100 bg-[#F3F4F6] dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
            {isEditMode
              ? t.onboarding.editModeSavedNote
              : receipt.persistedToServer
              ? t.onboarding.confirmationRealNote
              : t.onboarding.confirmationDemoNote}
          </p>

          {draft.registrationMode === 'partner_assisted' && (
            <p className="text-base font-semibold text-[#0F1E36] dark:text-amber-100 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-xl p-4">
              {t.onboarding.partnerConfirmationNote}
            </p>
          )}

          {(draft.identityRoute === 'no_documents' || draft.identityRoute === 'partner_referral') && (
            <p className="text-sm text-[#0F1E36] dark:text-slate-200 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 rounded-xl p-4">
              {t.onboarding.referralNextStepNote}
            </p>
          )}

          <div className="flex flex-wrap gap-3 pt-2">
            <button
              type="button"
              onClick={() =>
                onNavigateToCareers({
                  name: draft.fullName,
                  contact: draft.contactValue,
                })
              }
              className="min-h-[48px] px-6 py-3 rounded-md text-base font-bold bg-amber-500 hover:bg-amber-400 text-[#0F1E36] transition-colors shadow-sm cursor-pointer"
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
              className="min-h-[48px] px-5 py-3 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0F1E36] dark:text-slate-100 text-base font-semibold hover:bg-[#F3F4F6] dark:hover:bg-slate-700 transition-colors cursor-pointer"
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
      <LiveRegion message={networkNotice} politeness="polite" />
      <OneQuestionEngine
        flowTitle={isEditMode ? t.onboarding.editModeTitle : t.onboarding.pageTitle}
        steps={steps}
        currentStepIndex={stepIndex}
        onStepChange={handleStepChange}
        onCompleteReview={() => {
          setIsReview(true);
          emitGatewayEvent('db-signup:step', { step: steps.length + 1, of: steps.length + 1 }, hostElement);
        }}
        isReviewStep={isReview}
        onSubmitFinal={handleSubmitFinal}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onRetrySubmit={handleSubmitFinal}
        renderReviewContent={() => (
          <div className="space-y-4">
            <dl className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-xl bg-[#F3F4F6]/60 dark:bg-slate-800/60">
              <div className="p-4 flex items-start justify-between gap-4">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    {t.onboarding.stepNameLabel}
                  </dt>
                  <dd className="text-base font-semibold text-[#0F1E36] dark:text-white mt-0.5">
                    {draft.fullName || 'Not provided'}
                  </dd>
                </div>
                <button
                  type="button"
                  onClick={() => handleStepChange(1)}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-semibold text-[#0F1E36] dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-[#1E3A5F] dark:text-amber-400" aria-hidden="true" />
                  <span>{t.common.edit}</span>
                </button>
              </div>

              <div className="p-4 flex items-start justify-between gap-4">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    {t.onboarding.stepContactMethodLabel}
                  </dt>
                  <dd className="text-base font-semibold text-[#0F1E36] dark:text-white mt-0.5">
                    {t.onboarding.contactMethods[draft.contactMethod]}
                    {draft.contactMethod !== 'none' && draft.contactValue ? ` · ${draft.contactValue}` : ''}
                  </dd>
                </div>
                <button
                  type="button"
                  onClick={() => handleStepChange(2)}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-semibold text-[#0F1E36] dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-[#1E3A5F] dark:text-amber-400" aria-hidden="true" />
                  <span>{t.common.edit}</span>
                </button>
              </div>

              <div className="p-4 flex items-start justify-between gap-4">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    {t.onboarding.stepIdentityTitle}
                  </dt>
                  <dd className="text-base font-semibold text-[#0F1E36] dark:text-white mt-0.5">
                    {draft.identityRoute
                      ? t.onboarding.identityRoutes[draft.identityRoute].label
                      : 'Not chosen'}
                    {draft.partnerReferralOrg ? ` · ${draft.partnerReferralOrg}` : ''}
                  </dd>
                </div>
                <button
                  type="button"
                  onClick={() => handleStepChange(3)}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-semibold text-[#0F1E36] dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-[#1E3A5F] dark:text-amber-400" aria-hidden="true" />
                  <span>{t.common.edit}</span>
                </button>
              </div>

              <div className="p-4 flex items-start justify-between gap-4">
                <div>
                  <dt className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    {t.onboarding.stepSupportTitle} (Private)
                  </dt>
                  <dd className="text-base font-semibold text-[#0F1E36] dark:text-white mt-0.5">
                    {draft.supportPreferences.length > 0
                      ? draft.supportPreferences.map((p) => t.onboarding.supportOptions[p]).join(', ')
                      : 'Skipped / none selected'}
                  </dd>
                </div>
                <button
                  type="button"
                  onClick={() => handleStepChange(4)}
                  className="inline-flex items-center gap-1.5 min-h-[44px] px-3 py-1.5 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-semibold text-[#0F1E36] dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <Edit3 className="w-4 h-4 text-[#1E3A5F] dark:text-amber-400" aria-hidden="true" />
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
