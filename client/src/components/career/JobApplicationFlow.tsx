import React, { useMemo, useState } from 'react';
import { CheckCircle2, Lock } from 'lucide-react';
import { useI18n } from '../../i18n';
import { JobApplicationDraft, JobPosting, SubmissionReceipt } from '../../types/gateway';
import { gatewayApi } from '../../services/api/client';
import { emitGatewayEvent } from '../../utils/events';
import { FormStepDefinition, OneQuestionEngine } from '../forms/OneQuestionEngine';
import { VoiceTextField } from '../forms/VoiceTextField';
import { FormErrorItem } from '../forms/ErrorSummary';

interface JobApplicationFlowProps {
  job: JobPosting;
  initialName?: string;
  initialContact?: string;
  hostElement?: HTMLElement | null;
  onBackToJobs: () => void;
}

export const JobApplicationFlow: React.FC<JobApplicationFlowProps> = ({
  job,
  initialName = '',
  initialContact = '',
  hostElement,
  onBackToJobs,
}) => {
  const { t } = useI18n();
  const [appDraft, setAppDraft] = useState<JobApplicationDraft>({
    jobId: job.id,
    applicantName: initialName,
    contactValue: initialContact,
    relevantExperience: '',
    shareAccommodationRequest: false,
    accommodationRequestNote: '',
    explicitConsentToShare: false,
  });
  const [stepIndex, setStepIndex] = useState(0);
  const [isReview, setIsReview] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);

  const steps: FormStepDefinition[] = useMemo(
    () => [
      {
        id: 'app-name',
        title: t.career.applyFlow.stepNameTitle,
        whyWeAsk: t.career.applyFlow.stepNameWhy,
        validate: () => {
          if (!appDraft.applicantName.trim()) {
            return [{ fieldId: 'gw-app-name', message: t.onboarding.errors.emptyName }];
          }
          return [];
        },
        renderContent: () => (
          <VoiceTextField
            id="gw-app-name"
            label={t.onboarding.stepNameLabel}
            value={appDraft.applicantName}
            onChange={(val) => setAppDraft((p) => ({ ...p, applicantName: val }))}
            required
          />
        ),
      },
      {
        id: 'app-contact',
        title: t.career.applyFlow.stepContactTitle,
        whyWeAsk: t.career.applyFlow.stepContactWhy,
        validate: () => {
          if (!appDraft.contactValue.trim()) {
            return [{ fieldId: 'gw-app-contact', message: t.onboarding.errors.emptyContactValue }];
          }
          return [];
        },
        renderContent: () => (
          <VoiceTextField
            id="gw-app-contact"
            label={t.onboarding.stepContactValueLabel}
            value={appDraft.contactValue}
            onChange={(val) => setAppDraft((p) => ({ ...p, contactValue: val }))}
            required
            placeholder="+251 9... or name@example.com"
          />
        ),
      },
      {
        id: 'app-experience',
        title: t.career.applyFlow.stepExpTitle,
        helpText: t.career.applyFlow.stepExpHelp,
        whyWeAsk: t.career.applyFlow.stepExpWhy,
        optional: true,
        renderContent: () => (
          <VoiceTextField
            id="gw-app-experience"
            label="Your skills or experience"
            value={appDraft.relevantExperience}
            onChange={(val) => setAppDraft((p) => ({ ...p, relevantExperience: val }))}
            multiline
            placeholder="Example: I have helped customers in Amharic and English by chat."
          />
        ),
      },
      {
        id: 'app-consent',
        title: t.career.applyFlow.stepConsentTitle,
        helpText: t.career.applyFlow.stepConsentHelp,
        whyWeAsk: t.career.applyFlow.stepConsentWhy,
        optional: true,
        validate: () => {
          const errs: FormErrorItem[] = [];
          if (appDraft.shareAccommodationRequest && !appDraft.explicitConsentToShare) {
            errs.push({
              fieldId: 'gw-app-explicit-consent',
              message:
                'You asked to send an adjustment note, so permission is not checked yet. Check the permission box or turn off sharing.',
            });
          }
          return errs;
        },
        renderContent: () => (
          <div className="space-y-4">
            <div className="flex items-start gap-2.5 rounded-lg border border-teal-800/30 bg-teal-50 p-3.5 text-sm text-teal-950">
              <Lock className="w-4 h-4 shrink-0 mt-0.5 text-teal-800" aria-hidden="true" />
              <span>{t.career.filterPrivacyNote}</span>
            </div>

            <label className="flex items-start gap-3 min-h-[52px] p-4 rounded-xl border-2 border-slate-300 bg-white cursor-pointer">
              <input
                type="checkbox"
                checked={appDraft.shareAccommodationRequest}
                onChange={(e) =>
                  setAppDraft((p) => ({
                    ...p,
                    shareAccommodationRequest: e.target.checked,
                    explicitConsentToShare: e.target.checked ? p.explicitConsentToShare : false,
                  }))
                }
                className="mt-1 h-5 w-5 shrink-0"
              />
              <span className="text-base font-medium text-slate-900">
                {t.career.applyFlow.shareToggleLabel}
              </span>
            </label>

            {appDraft.shareAccommodationRequest && (
              <div className="space-y-4 pt-2">
                <VoiceTextField
                  id="gw-app-adjustment-note"
                  label={t.career.applyFlow.shareNoteLabel}
                  value={appDraft.accommodationRequestNote}
                  onChange={(val) => setAppDraft((p) => ({ ...p, accommodationRequestNote: val }))}
                  multiline
                />

                <label
                  htmlFor="gw-app-explicit-consent"
                  className="flex items-start gap-3 min-h-[52px] p-4 rounded-xl border-2 border-slate-500 bg-slate-50 cursor-pointer"
                >
                  <input
                    id="gw-app-explicit-consent"
                    type="checkbox"
                    checked={appDraft.explicitConsentToShare}
                    onChange={(e) =>
                      setAppDraft((p) => ({ ...p, explicitConsentToShare: e.target.checked }))
                    }
                    className="mt-1 h-5 w-5 shrink-0"
                  />
                  <span className="text-sm font-semibold text-slate-900">
                    {t.career.applyFlow.explicitConsentLabel}
                  </span>
                </label>
              </div>
            )}
          </div>
        ),
      },
    ],
    [appDraft, t]
  );

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const payload: JobApplicationDraft = appDraft.shareAccommodationRequest
        ? appDraft
        : { ...appDraft, accommodationRequestNote: '', explicitConsentToShare: false };
      const res = await gatewayApi.submitJobApplication(payload);
      setReceipt(res);
      emitGatewayEvent(
        'gateway:job-applied',
        {
          jobId: job.id,
          applicationId: res.id,
          mode: res.mode,
          sharedAccommodationConsent: Boolean(
            payload.shareAccommodationRequest && payload.explicitConsentToShare
          ),
        },
        hostElement
      );
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'Could not send your application right now. Your answers are preserved on this screen.';
      setSubmitError(msg);
      emitGatewayEvent(
        'gateway:error',
        { code: 'JOB_APPLICATION_FAILED', message: msg, recoverable: true },
        hostElement
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (receipt) {
    return (
      <section aria-labelledby="gw-job-app-done" className="max-w-3xl mx-auto">
        <div className="rounded-2xl border-2 border-emerald-700 bg-white p-6 sm:p-8 space-y-5">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-7 h-7 text-emerald-700 shrink-0" aria-hidden="true" />
            <div>
              <h2 id="gw-job-app-done" className="text-2xl font-bold text-slate-900">
                {t.career.applyFlow.submittedTitle}
              </h2>
              <p className="text-sm text-slate-700 mt-1">
                {job.title} · {job.organization} · Ref {receipt.id}
              </p>
            </div>
          </div>
          <p className="text-base text-slate-800 bg-slate-50 border border-slate-300 rounded-xl p-4">
            {receipt.persistedToServer
              ? t.career.applyFlow.submittedBodyReal
              : t.career.applyFlow.submittedBodyDemo}
          </p>
          <button
            type="button"
            onClick={onBackToJobs}
            className="min-h-[48px] px-5 py-2.5 rounded-xl text-base font-semibold"
            style={{
              backgroundColor: 'var(--gw-primary)',
              color: 'var(--gw-primary-text)',
            }}
          >
            {t.career.applyFlow.backToJobs}
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <button
        type="button"
        onClick={onBackToJobs}
        className="min-h-[44px] px-3 py-2 text-sm font-semibold text-slate-800 underline hover:text-slate-950"
      >
        ← {t.career.applyFlow.backToJobs}
      </button>

      <OneQuestionEngine
        flowTitle={`${t.career.applyFlow.titlePrefix} ${job.title}`}
        steps={steps}
        currentStepIndex={stepIndex}
        onStepChange={(idx) => {
          setIsReview(false);
          setStepIndex(idx);
          emitGatewayEvent(
            'gateway:step-changed',
            {
              flow: 'job_application',
              stepId: steps[idx]?.id || 'step',
              stepIndex: idx,
              totalSteps: steps.length + 1,
            },
            hostElement
          );
        }}
        onCompleteReview={() => setIsReview(true)}
        isReviewStep={isReview}
        onSubmitFinal={handleSubmit}
        isSubmitting={isSubmitting}
        submitLabel="Submit job application"
        submitError={submitError}
        onRetrySubmit={handleSubmit}
        renderReviewContent={() => (
          <dl className="divide-y divide-slate-200 border border-slate-300 rounded-xl bg-slate-50/50">
            <div className="p-4 flex items-start justify-between gap-4">
              <div>
                <dt className="text-xs font-semibold text-slate-600">{t.onboarding.stepNameLabel}</dt>
                <dd className="text-base font-medium text-slate-900">{appDraft.applicantName}</dd>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsReview(false);
                  setStepIndex(0);
                }}
                className="min-h-[44px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-medium"
              >
                {t.common.edit}
              </button>
            </div>
            <div className="p-4 flex items-start justify-between gap-4">
              <div>
                <dt className="text-xs font-semibold text-slate-600">{t.onboarding.stepContactValueLabel}</dt>
                <dd className="text-base font-medium text-slate-900">{appDraft.contactValue}</dd>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsReview(false);
                  setStepIndex(1);
                }}
                className="min-h-[44px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-medium"
              >
                {t.common.edit}
              </button>
            </div>
            <div className="p-4 flex items-start justify-between gap-4">
              <div>
                <dt className="text-xs font-semibold text-slate-600">Experience</dt>
                <dd className="text-base text-slate-900">
                  {appDraft.relevantExperience || 'Skipped'}
                </dd>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsReview(false);
                  setStepIndex(2);
                }}
                className="min-h-[44px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-medium"
              >
                {t.common.edit}
              </button>
            </div>
            <div className="p-4 flex items-start justify-between gap-4">
              <div>
                <dt className="text-xs font-semibold text-slate-600">Share adjustment request with employer?</dt>
                <dd className="text-base text-slate-900">
                  {appDraft.shareAccommodationRequest && appDraft.explicitConsentToShare
                    ? `Yes (consented): ${appDraft.accommodationRequestNote || 'Requested interview adjustment'}`
                    : 'No — kept private'}
                </dd>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsReview(false);
                  setStepIndex(3);
                }}
                className="min-h-[44px] px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-sm font-medium"
              >
                {t.common.edit}
              </button>
            </div>
          </dl>
        )}
      />
    </div>
  );
};
