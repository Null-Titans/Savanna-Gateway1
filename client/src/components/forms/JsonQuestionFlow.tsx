import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Edit3 } from 'lucide-react';
import { useI18n } from '../../i18n';
import { emitGatewayEvent } from '../../utils/events';
import { normalizeEthiopianPhone } from '../../utils/coreHelpers.mjs';
import { LiveRegion } from '../accessibility/LiveRegion';
import { FormStepDefinition, OneQuestionEngine } from './OneQuestionEngine';
import { VoiceTextField } from './VoiceTextField';
import { FormErrorItem } from './ErrorSummary';

export type QuestionFieldType =
  | 'text'
  | 'phone'
  | 'radio'
  | 'checkbox'
  | 'textarea'
  | 'consent'
  | 'review';

export interface QuestionOption {
  value: string;
  label: string;
  description?: string;
}

export interface QuestionSchemaItem {
  id: string;
  type: QuestionFieldType;
  label: string;
  helpText?: string;
  whyWeAsk?: string;
  required?: boolean;
  optional?: boolean;
  sensitive?: boolean;
  options?: QuestionOption[];
}

export interface QuestionFileSchema {
  id: string;
  title: string;
  description?: string;
  submitLabel?: string;
  doneMessage?: string;
  questions: QuestionSchemaItem[];
}

interface JsonQuestionFlowProps {
  questionsUrl: string;
  hostElement?: HTMLElement | null;
}

export const JsonQuestionFlow: React.FC<JsonQuestionFlowProps> = ({
  questionsUrl,
  hostElement,
}) => {
  const { t } = useI18n();
  const [schema, setSchema] = useState<QuestionFileSchema | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<Record<string, string | string[] | boolean>>({});
  const [stepIndex, setStepIndex] = useState(0);
  const [isReview, setIsReview] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [networkNotice, setNetworkNotice] = useState('');

  const loadSchema = useCallback(async () => {
    setLoadError(null);
    try {
      const response = await fetch(questionsUrl);
      if (!response.ok) {
        throw new Error(`Could not load questions (${response.status}).`);
      }
      const parsed = (await response.json()) as QuestionFileSchema;
      if (!parsed || !Array.isArray(parsed.questions)) {
        throw new Error('Question file format is invalid.');
      }
      setSchema(parsed);
      setStepIndex(0);
      setIsReview(false);
      setIsSubmitted(false);
      try {
        const saved = sessionStorage.getItem(`gw_json_flow_${parsed.id}`);
        if (saved) {
          setAnswers(JSON.parse(saved) as Record<string, string | string[] | boolean>);
        }
      } catch {
        // Ignore session storage failures
      }
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Unable to load question file.');
    }
  }, [questionsUrl]);

  useEffect(() => {
    void loadSchema();
  }, [loadSchema]);

  const updateAnswer = useCallback(
    (id: string, value: string | string[] | boolean) => {
      setAnswers((prev) => {
        const next = { ...prev, [id]: value };
        if (schema) {
          try {
            sessionStorage.setItem(`gw_json_flow_${schema.id}`, JSON.stringify(next));
          } catch {
            // Ignore session storage errors
          }
        }
        return next;
      });
    },
    [schema]
  );

  const formQuestions = useMemo(() => {
    if (!schema) return [];
    // Treat trailing 'review' item via OneQuestionEngine's native review step so we avoid duplicate review screens
    return schema.questions.filter(
      (q, idx) => !(q.type === 'review' && idx === schema.questions.length - 1)
    );
  }, [schema]);

  const steps: FormStepDefinition[] = useMemo(() => {
    return formQuestions.map((q) => {
      const fieldId = `gw-q-${q.id}`;
      const value = answers[q.id];

      return {
        id: q.id,
        title: q.label,
        helpText: q.helpText,
        whyWeAsk: q.whyWeAsk || t.onboarding.stepDeviceWhy,
        optional: q.optional ?? !q.required,
        validate: (): FormErrorItem[] => {
          if (q.type === 'review') return [];
          if (q.type === 'consent') {
            if (q.required && value !== true) {
              return [{ fieldId, message: t.onboarding.errors.emptyPartnerConsent }];
            }
            return [];
          }
          if (q.type === 'checkbox') {
            const arr = Array.isArray(value) ? value : [];
            if (q.required && arr.length === 0) {
              return [{ fieldId, message: t.onboarding.errors.emptyIdentityRoute }];
            }
            return [];
          }
          if (q.type === 'phone') {
            const str = typeof value === 'string' ? value.trim() : '';
            if (q.required && !str) {
              return [{ fieldId, message: t.onboarding.errors.emptyContactValue }];
            }
            if (str) {
              const normalized = normalizeEthiopianPhone(str);
              if (!normalized) {
                return [{ fieldId, message: t.onboarding.errors.invalidEthiopianPhone }];
              }
              updateAnswer(q.id, normalized);
            }
            return [];
          }
          const strVal = typeof value === 'string' ? value.trim() : '';
          if (q.required && !strVal) {
            return [{ fieldId, message: `${q.label} is required.` }];
          }
          return [];
        },
        renderContent: () => {
          if (q.type === 'text' || q.type === 'textarea') {
            return (
              <VoiceTextField
                id={fieldId}
                label={q.label}
                value={typeof value === 'string' ? value : ''}
                onChange={(next) => updateAnswer(q.id, next)}
                multiline={q.type === 'textarea'}
                sensitiveIdentifier={Boolean(q.sensitive)}
                required={Boolean(q.required)}
              />
            );
          }

          if (q.type === 'phone') {
            return (
              <div className="space-y-2">
                <label
                  htmlFor={fieldId}
                  className="block text-sm font-semibold text-[#0F1E36] dark:text-slate-100"
                >
                  {q.label}
                </label>
                <input
                  id={fieldId}
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  value={typeof value === 'string' ? value : ''}
                  onChange={(e) => updateAnswer(q.id, e.target.value)}
                  onBlur={() => {
                    const str = typeof value === 'string' ? value : '';
                    const normalized = normalizeEthiopianPhone(str);
                    if (normalized) updateAnswer(q.id, normalized);
                  }}
                  placeholder="+251911234567"
                  className="w-full min-h-[48px] rounded-lg border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-base text-[#0F1E36] dark:text-white"
                />
              </div>
            );
          }

          if (q.type === 'radio') {
            const selected = typeof value === 'string' ? value : '';
            return (
              <fieldset className="space-y-3">
                <legend className="gw-sr-only">{q.label}</legend>
                {(q.options || []).map((opt) => {
                  const checked = selected === opt.value;
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 min-h-[52px] p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        checked
                          ? 'border-[#0F1E36] dark:border-amber-400 bg-[#0F1E36]/[0.05] dark:bg-amber-500/15'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="radio"
                        name={fieldId}
                        value={opt.value}
                        checked={checked}
                        onChange={() => updateAnswer(q.id, opt.value)}
                        className="mt-1 h-5 w-5 accent-[#0F1E36] dark:accent-amber-400 shrink-0"
                      />
                      <span className="space-y-0.5">
                        <span className="block font-semibold text-[#0F1E36] dark:text-white">
                          {opt.label}
                        </span>
                        {opt.description && (
                          <span className="block text-sm text-slate-600 dark:text-slate-300">
                            {opt.description}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            );
          }

          if (q.type === 'checkbox') {
            const selectedList = Array.isArray(value) ? value : [];
            return (
              <fieldset className="space-y-3">
                <legend className="gw-sr-only">{q.label}</legend>
                {(q.options || []).map((opt) => {
                  const checked = selectedList.includes(opt.value);
                  return (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-3 min-h-[52px] p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        checked
                          ? 'border-[#0F1E36] dark:border-amber-400 bg-[#0F1E36]/[0.05] dark:bg-amber-500/15'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...selectedList, opt.value]
                            : selectedList.filter((item) => item !== opt.value);
                          updateAnswer(q.id, next);
                        }}
                        className="mt-1 h-5 w-5 rounded accent-[#0F1E36] dark:accent-amber-400 shrink-0"
                      />
                      <span className="space-y-0.5">
                        <span className="block font-semibold text-[#0F1E36] dark:text-white">
                          {opt.label}
                        </span>
                        {opt.description && (
                          <span className="block text-sm text-slate-600 dark:text-slate-300">
                            {opt.description}
                          </span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </fieldset>
            );
          }

          if (q.type === 'consent') {
            const checked = value === true;
            return (
              <label className="flex items-start gap-3 min-h-[56px] p-4 rounded-xl border-2 border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 cursor-pointer">
                <input
                  id={fieldId}
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => updateAnswer(q.id, e.target.checked)}
                  className="mt-1 h-5 w-5 rounded accent-[#0F1E36] dark:accent-amber-400 shrink-0"
                />
                <span className="text-sm font-medium text-[#0F1E36] dark:text-slate-100">
                  {q.helpText || q.label}
                </span>
              </label>
            );
          }

          return (
            <div className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
              {formQuestions
                .filter((item) => item.type !== 'review')
                .map((item) => (
                  <div key={item.id} className="flex justify-between gap-4 border-b border-slate-200 dark:border-slate-700 py-2">
                    <span className="font-semibold">{item.label}</span>
                    <span>
                      {Array.isArray(answers[item.id])
                        ? (answers[item.id] as string[]).join(', ') || '—'
                        : String(answers[item.id] ?? '—')}
                    </span>
                  </div>
                ))}
            </div>
          );
        },
      };
    });
  }, [answers, formQuestions, t, updateAnswer]);

  const emitStep = useCallback(
    (nextStep: number, reviewMode: boolean) => {
      if (!schema) return;
      const total = steps.length + 1;
      const stepNum = reviewMode ? total : nextStep + 1;
      emitGatewayEvent(
        'gateway:step-changed',
        {
          flow: 'json_form',
          stepIndex: reviewMode ? steps.length : nextStep,
          stepId: reviewMode ? 'review' : steps[nextStep]?.id || schema.id,
          totalSteps: total,
        },
        hostElement
      );
      emitGatewayEvent(
        'db-signup:step',
        { step: stepNum, of: total },
        hostElement
      );
    },
    [hostElement, schema, steps]
  );

  const handleStepChange = (nextIndex: number) => {
    setIsReview(false);
    setStepIndex(nextIndex);
    emitStep(nextIndex, false);
  };

  const handleCompleteReview = () => {
    setIsReview(true);
    emitStep(steps.length, true);
  };

  const handleSubmitFinal = useCallback(() => {
    if (!schema) return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      setSubmitError(t.common.offlineNotice);
      setNetworkNotice(t.common.offlineNotice);
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);

    const supportValue = answers.supportPreferences || answers.accommodations;
    if (Array.isArray(supportValue) && supportValue.length > 0) {
      emitGatewayEvent(
        'db-signup:support',
        {
          hasSupportRequest: true,
        },
        hostElement
      );
    }

    const rawIdRoute =
      typeof answers.identityRoute === 'string' ? answers.identityRoute : '';
    const mappedIdRoute =
      rawIdRoute === 'no_documents' || rawIdRoute === 'partner_referral'
        ? 'partner-referral'
        : rawIdRoute || 'unspecified';

    emitGatewayEvent(
      'db-signup:done',
      {
        submissionId: `${schema.id}-${Date.now()}`,
        mode: 'mock',
        profile: {
          fullName:
            typeof answers.fullName === 'string'
              ? answers.fullName
              : typeof answers.applicantName === 'string'
              ? answers.applicantName
              : '',
          contactMethod: typeof answers.phone === 'string' && answers.phone ? 'phone' : 'none',
          idRoute: mappedIdRoute,
          registrationMode: 'self',
        },
      },
      hostElement
    );

    setIsSubmitting(false);
    setIsSubmitted(true);
  }, [answers, hostElement, schema, t.common.offlineNotice]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onOffline = () => setNetworkNotice(t.common.offlineNotice);
    const onOnline = () => {
      setNetworkNotice(t.common.onlineRetryNotice);
      if (submitError) {
        handleSubmitFinal();
      }
    };
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, [handleSubmitFinal, submitError, t.common.offlineNotice, t.common.onlineRetryNotice]);

  if (loadError) {
    return (
      <div
        role="alert"
        className="rounded-2xl border-2 border-red-700 bg-red-50 dark:bg-red-950/50 p-6 space-y-3 text-red-950 dark:text-red-100"
      >
        <p className="font-semibold">{loadError}</p>
        <button
          type="button"
          onClick={() => void loadSchema()}
          className="min-h-[44px] px-4 py-2 rounded-md bg-red-800 text-white text-sm font-semibold cursor-pointer"
        >
          {t.common.retry}
        </button>
      </div>
    );
  }

  if (!schema) {
    return (
      <div role="status" className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6">
        {t.common.loadingStatus}
      </div>
    );
  }

  if (isSubmitted) {
    return (
      <section className="rounded-2xl border-2 border-emerald-700 dark:border-emerald-500 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-3 text-emerald-800 dark:text-emerald-300">
          <CheckCircle2 className="w-7 h-7 shrink-0" aria-hidden="true" />
          <h2 className="text-2xl font-bold">{schema.title}</h2>
        </div>
        <p className="text-base text-slate-800 dark:text-slate-200">
          {schema.doneMessage || t.onboarding.confirmationDemoNote}
        </p>
        <button
          type="button"
          onClick={() => {
            setIsSubmitted(false);
            setIsReview(false);
            setStepIndex(0);
          }}
          className="min-h-[44px] px-5 py-2.5 rounded-md bg-[#0F1E36] text-white text-sm font-semibold cursor-pointer"
        >
          {t.common.edit}
        </button>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      <LiveRegion message={networkNotice} />
      <OneQuestionEngine
        flowTitle={schema.title}
        steps={steps}
        currentStepIndex={stepIndex}
        onStepChange={handleStepChange}
        onCompleteReview={handleCompleteReview}
        isReviewStep={isReview}
        submitLabel={schema.submitLabel || t.common.submit}
        isSubmitting={isSubmitting}
        submitError={submitError}
        onRetrySubmit={handleSubmitFinal}
        onSubmitFinal={handleSubmitFinal}
        renderReviewContent={() => (
          <div className="space-y-3">
            {formQuestions.map((q, idx) => {
              const rawVal = answers[q.id];
              const displayVal = Array.isArray(rawVal)
                ? rawVal.join(', ')
                : typeof rawVal === 'boolean'
                ? rawVal
                  ? 'Confirmed'
                  : 'Not confirmed'
                : rawVal || '—';
              return (
                <div
                  key={q.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800/70 p-4"
                >
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-400">
                      {q.label}
                    </div>
                    <div className="text-base font-medium text-[#0F1E36] dark:text-white mt-0.5">
                      {displayVal}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsReview(false);
                      setStepIndex(idx);
                    }}
                    className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm font-semibold text-[#0F1E36] dark:text-slate-100 cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" aria-hidden="true" />
                    <span>{t.common.edit}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      />
    </div>
  );
};
