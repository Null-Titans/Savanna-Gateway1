import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, HelpCircle, SkipForward } from 'lucide-react';
import { useI18n } from '../../i18n';
import { useStepFocus } from '../../hooks/useStepFocus';
import { ReadAloudButton } from '../accessibility/ReadAloudButton';
import { ErrorSummary, FormErrorItem } from './ErrorSummary';

export interface FormStepDefinition {
  id: string;
  title: string;
  helpText?: string;
  whyWeAsk: string;
  optional?: boolean;
  readAloudExtra?: string;
  validate?: () => FormErrorItem[];
  renderContent: () => React.ReactNode;
}

interface OneQuestionEngineProps {
  flowTitle: string;
  steps: FormStepDefinition[];
  currentStepIndex: number;
  onStepChange: (nextIndex: number) => void;
  onCompleteReview: () => void;
  isReviewStep: boolean;
  renderReviewContent: () => React.ReactNode;
  onSubmitFinal: () => void;
  isSubmitting?: boolean;
  submitLabel?: string;
  submitError?: string | null;
  onRetrySubmit?: () => void;
}

export const OneQuestionEngine: React.FC<OneQuestionEngineProps> = ({
  flowTitle,
  steps,
  currentStepIndex,
  onStepChange,
  onCompleteReview,
  isReviewStep,
  renderReviewContent,
  onSubmitFinal,
  isSubmitting = false,
  submitLabel,
  submitError,
  onRetrySubmit,
}) => {
  const { t, format } = useI18n();
  const [errors, setErrors] = React.useState<FormErrorItem[]>([]);

  const totalSteps = steps.length + 1; // +1 for Review step
  const displayStepNumber = isReviewStep ? totalSteps : currentStepIndex + 1;
  const activeStep = isReviewStep ? null : steps[currentStepIndex];

  const headingRef = useStepFocus(isReviewStep ? 'review' : activeStep?.id);

  const handleNext = () => {
    if (!activeStep) return;
    if (activeStep.validate) {
      const foundErrors = activeStep.validate();
      if (foundErrors.length > 0) {
        setErrors(foundErrors);
        return;
      }
    }
    setErrors([]);
    if (currentStepIndex < steps.length - 1) {
      onStepChange(currentStepIndex + 1);
    } else {
      onCompleteReview();
    }
  };

  const handleSkip = () => {
    if (!activeStep?.optional) return;
    setErrors([]);
    if (currentStepIndex < steps.length - 1) {
      onStepChange(currentStepIndex + 1);
    } else {
      onCompleteReview();
    }
  };

  const handleBack = () => {
    setErrors([]);
    if (isReviewStep) {
      onStepChange(steps.length - 1);
    } else if (currentStepIndex > 0) {
      onStepChange(currentStepIndex - 1);
    }
  };

  const progressPercent = Math.round((displayStepNumber / totalSteps) * 100);
  const fullReadText = isReviewStep
    ? `${t.onboarding.reviewTitle}. ${t.onboarding.reviewHelp}`
    : `${activeStep?.title || ''}. ${activeStep?.helpText || ''} ${activeStep?.readAloudExtra || ''}`;

  return (
    <div className="space-y-6">
      {/* Progress & Reassurance Header */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-medium text-slate-700">
          <span>{flowTitle}</span>
          <span className="tabular-nums font-semibold text-slate-900">
            {format(t.common.stepOf, { current: displayStepNumber, total: totalSteps })}
          </span>
        </div>
        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden" aria-hidden="true">
          <div
            className="h-full transition-all duration-200"
            style={{
              width: `${progressPercent}%`,
              backgroundColor: 'var(--gw-secondary)',
            }}
          />
        </div>
        <progress
          className="gw-sr-only"
          value={displayStepNumber}
          max={totalSteps}
          aria-label={format(t.common.stepOf, { current: displayStepNumber, total: totalSteps })}
        />
        <p className="text-xs text-slate-600">{t.common.noTimeoutNotice}</p>
      </div>

      {/* Single-Question Card */}
      <div className="rounded-2xl border border-slate-300 bg-white p-5 sm:p-8 shadow-xs space-y-6">
        <div className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2
              ref={headingRef}
              tabIndex={-1}
              className="text-xl sm:text-2xl font-bold text-slate-900 focus:outline-none"
            >
              {isReviewStep ? t.onboarding.reviewTitle : activeStep?.title}
            </h2>
            {!isReviewStep && activeStep?.optional && (
              <span className="text-xs font-medium text-slate-700 bg-slate-100 border border-slate-300 rounded-md px-2.5 py-1">
                {t.common.optionalBadge}
              </span>
            )}
          </div>

          <p className="text-base text-slate-700 gw-prose-measure">
            {isReviewStep ? t.onboarding.reviewHelp : activeStep?.helpText}
          </p>

          <ReadAloudButton textToRead={fullReadText} />
        </div>

        <ErrorSummary errors={errors} />

        {/* Question Body or Review Body */}
        <div>{isReviewStep ? renderReviewContent() : activeStep?.renderContent()}</div>

        {/* Data Minimisation: Why do we ask this? (Addendum D2) */}
        {!isReviewStep && activeStep && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 flex items-start gap-2.5">
            <HelpCircle className="w-4 h-4 shrink-0 mt-0.5 text-slate-600" aria-hidden="true" />
            <div>
              <span className="font-semibold text-slate-900">{t.common.whyWeAskLabel} </span>
              <span>{activeStep.whyWeAsk}</span>
            </div>
          </div>
        )}

        {/* Network / Submission Error with Retry & No Lost Answers (Addendum C3) */}
        {submitError && (
          <div role="alert" className="rounded-xl border-2 border-red-700 bg-red-50 p-4 space-y-3 text-red-950">
            <p className="text-sm font-semibold">{submitError}</p>
            {onRetrySubmit && (
              <button
                type="button"
                onClick={onRetrySubmit}
                className="min-h-[44px] px-4 py-2 rounded-lg bg-red-800 text-white text-sm font-semibold hover:bg-red-900"
              >
                {t.common.retry}
              </button>
            )}
          </div>
        )}

        {/* Navigation Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-3">
            {(currentStepIndex > 0 || isReviewStep) && (
              <button
                type="button"
                onClick={handleBack}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg border border-slate-400 bg-white text-slate-900 text-sm font-semibold hover:bg-slate-50"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                <span>{t.common.back}</span>
              </button>
            )}

            {!isReviewStep && activeStep?.optional && (
              <button
                type="button"
                onClick={handleSkip}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2.5 rounded-lg border border-slate-300 bg-slate-50 text-slate-800 text-sm font-medium hover:bg-slate-100"
              >
                <SkipForward className="w-4 h-4" aria-hidden="true" />
                <span>{t.common.skip}</span>
              </button>
            )}
          </div>

          {!isReviewStep ? (
            <button
              type="button"
              onClick={handleNext}
              className="inline-flex items-center gap-2 min-h-[48px] px-6 py-2.5 rounded-lg text-base font-semibold transition-colors"
              style={{
                backgroundColor: 'var(--gw-primary)',
                color: 'var(--gw-primary-text)',
              }}
            >
              <span>
                {currentStepIndex === steps.length - 1 ? t.common.reviewAnswers : t.common.continue}
              </span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          ) : (
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onSubmitFinal}
              className="inline-flex items-center gap-2 min-h-[48px] px-6 py-2.5 rounded-lg text-base font-semibold transition-colors disabled:opacity-60"
              style={{
                backgroundColor: 'var(--gw-secondary)',
                color: 'var(--gw-secondary-text)',
              }}
            >
              <CheckCircle2 className="w-5 h-5" aria-hidden="true" />
              <span>{isSubmitting ? t.common.loadingStatus : submitLabel || t.common.submit}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
