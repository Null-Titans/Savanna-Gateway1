import React, { useMemo, useState } from 'react';
import { AlertOctagon, ArrowRight, Building2, CheckCircle2, Cross, ShieldAlert } from 'lucide-react';
import { useI18n } from '../../i18n';
import { AccommodationCategory, JobPosting } from '../../types/gateway';
import { checkEmployerTextSafeguards } from '../../utils/safeguards';
import { gatewayApi } from '../../services/api/client';

interface EmployerAccommodationFormProps {
  onPublishedNavigateToCareers: () => void;
}

export const EmployerAccommodationForm: React.FC<EmployerAccommodationFormProps> = ({
  onPublishedNavigateToCareers,
}) => {
  const { t } = useI18n();
  const [title, setTitle] = useState('');
  const [organization, setOrganization] = useState('');
  const [location, setLocation] = useState('');
  const [isRemote, setIsRemote] = useState(true);
  const [employmentType, setEmploymentType] = useState<JobPosting['employmentType']>('Full-time');
  const [summary, setSummary] = useState('');
  const [skillsRaw, setSkillsRaw] = useState('');

  const [workEnv, setWorkEnv] = useState('');
  const [remoteFlex, setRemoteFlex] = useState('');
  const [assistiveTech, setAssistiveTech] = useState('');
  const [commOptions, setCommOptions] = useState('');
  const [interviewAcc, setInterviewAcc] = useState('');
  const [appProcessAcc, setAppProcessAcc] = useState('');
  const [additionalSupport, setAdditionalSupport] = useState('');

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedJob, setPublishedJob] = useState<JobPosting | null>(null);

  const violations = useMemo(
    () =>
      checkEmployerTextSafeguards({
        title,
        summary,
        workEnv,
        remoteFlex,
        assistiveTech,
        commOptions,
        interviewAcc,
        appProcessAcc,
        additionalSupport,
      }),
    [
      additionalSupport,
      appProcessAcc,
      assistiveTech,
      commOptions,
      interviewAcc,
      remoteFlex,
      summary,
      title,
      workEnv,
    ]
  );

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setPublishError(null);
    if (violations.length > 0) {
      return;
    }
    if (!title.trim() || !organization.trim() || !summary.trim()) {
      setPublishError('Please fill in Job title, Organization name, and Job summary.');
      return;
    }

    setIsPublishing(true);
    try {
      const categories: AccommodationCategory[] = [];
      if (isRemote || remoteFlex.trim()) categories.push('remote_flexible');
      if (workEnv.trim()) categories.push('accessible_workplace');
      if (assistiveTech.trim()) categories.push('assistive_tech');
      if (commOptions.trim()) categories.push('communication_support');
      if (categories.length === 0) categories.push('other_accommodations');

      const accommodationsOffered = [
        workEnv,
        remoteFlex,
        assistiveTech,
        commOptions,
        interviewAcc,
        appProcessAcc,
        additionalSupport,
      ]
        .map((s) => s.trim())
        .filter(Boolean);

      const created = await gatewayApi.createEmployerJob({
        title: title.trim(),
        organization: organization.trim(),
        location: location.trim() || (isRemote ? 'Remote' : 'Addis Ababa'),
        isRemote,
        employmentType,
        descriptionSummary: summary.trim(),
        requiredSkills: skillsRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
        accommodationCategories: categories,
        accommodationsOffered:
          accommodationsOffered.length > 0
            ? accommodationsOffered
            : ['Flexible interview adjustments available on request'],
        accommodationDetails: {
          workEnvironmentAccessibility: workEnv.trim() || 'Not specified',
          remoteOrFlexibleArrangements: remoteFlex.trim() || 'Not specified',
          assistiveTechnologyAvailable: assistiveTech.trim() || 'Not specified',
          communicationOptions: commOptions.trim() || 'Not specified',
          interviewAccommodations: interviewAcc.trim() || 'Not specified',
          applicationProcessAccommodations: appProcessAcc.trim() || 'Not specified',
          additionalSupportOffered: additionalSupport.trim() || 'None listed',
        },
      });
      setPublishedJob(created);
    } catch (err) {
      setPublishError(
        err instanceof Error ? err.message : 'Could not publish job listing. Please retry.'
      );
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div
        className="relative overflow-hidden rounded-2xl bg-[#0F1E36] dark:border dark:border-slate-800 text-white p-6 sm:p-8 shadow-md space-y-2.5"
        style={{ backgroundColor: 'var(--gw-primary)', color: 'var(--gw-primary-text)' }}
      >
        <Cross
          className="w-36 h-36 text-white/[0.04] absolute -right-4 -bottom-6 pointer-events-none"
          aria-hidden="true"
        />
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <Building2 className="w-4 h-4" aria-hidden="true" />
          <span>Employer Portal · Inclusion Safeguard</span>
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          {t.employer.pageTitle}
        </h2>
        <p className="text-base text-slate-200 gw-prose-measure leading-relaxed">
          {t.employer.pageSubtitle}
        </p>
      </div>

      {/* Addendum D4 Safeguard Notice */}
      <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/50 p-4 flex items-start gap-3 text-[#0F1E36] dark:text-amber-100 shadow-xs">
        <ShieldAlert
          className="w-5 h-5 text-amber-800 dark:text-amber-400 shrink-0 mt-0.5"
          aria-hidden="true"
        />
        <div className="text-sm space-y-1">
          <p className="font-bold text-[#0F1E36] dark:text-amber-200">
            {t.employer.safeguardBannerTitle}
          </p>
          <p className="text-slate-800 dark:text-amber-100/90">{t.employer.safeguardBannerBody}</p>
        </div>
      </div>

      {violations.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border-2 border-red-700 dark:border-red-500 bg-red-50 dark:bg-red-950/60 p-4 space-y-2 text-red-950 dark:text-red-100"
        >
          <div className="flex items-center gap-2 font-bold">
            <AlertOctagon
              className="w-5 h-5 text-red-800 dark:text-red-400 shrink-0"
              aria-hidden="true"
            />
            <span>{t.employer.blockedPublishTitle}</span>
          </div>
          <ul className="list-disc ps-5 text-sm space-y-1">
            {violations.map((v, idx) => (
              <li key={`${v.field}-${idx}`}>
                Matched <strong>"{v.matchedTerm}"</strong>: {v.guidance}
              </li>
            ))}
          </ul>
        </div>
      )}

      {publishedJob ? (
        <div className="rounded-2xl border-2 border-emerald-700 dark:border-emerald-600 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-start gap-3.5">
            <span className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400 flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
            </span>
            <div>
              <h3 className="text-xl font-bold text-[#0F1E36] dark:text-white tracking-tight">
                {publishedJob.title}
              </h3>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                {t.employer.publishedSuccess}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onPublishedNavigateToCareers}
              className="inline-flex items-center gap-2 min-h-[48px] px-6 py-2.5 rounded-md text-base font-bold bg-amber-500 hover:bg-amber-400 text-[#0F1E36] transition-colors shadow-sm cursor-pointer"
            >
              <span>{t.employer.viewPublishedInGateway}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setPublishedJob(null)}
              className="min-h-[48px] px-5 py-2.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0F1E36] dark:text-slate-100 text-base font-semibold hover:bg-[#F3F4F6] dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Post another role
            </button>
          </div>
        </div>
      ) : (
        <form
          onSubmit={handlePublish}
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-sm space-y-5"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="emp-title"
                className="block text-sm font-semibold text-[#0F1E36] dark:text-slate-100 mb-1.5"
              >
                {t.employer.jobTitleLabel}
              </label>
              <input
                id="emp-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Example: Accessible Content Editor"
                className="w-full min-h-[48px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F3F4F6]/60 dark:bg-slate-800 px-3.5 py-2.5 text-base text-[#0F1E36] dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-[#0F1E36] dark:focus:border-amber-400"
              />
            </div>

            <div>
              <label
                htmlFor="emp-org"
                className="block text-sm font-semibold text-[#0F1E36] dark:text-slate-100 mb-1.5"
              >
                {t.employer.orgNameLabel}
              </label>
              <input
                id="emp-org"
                type="text"
                required
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Example: Selam Tech Partners"
                className="w-full min-h-[48px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F3F4F6]/60 dark:bg-slate-800 px-3.5 py-2.5 text-base text-[#0F1E36] dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-[#0F1E36] dark:focus:border-amber-400"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label
                htmlFor="emp-location"
                className="block text-sm font-semibold text-[#0F1E36] dark:text-slate-100 mb-1.5"
              >
                {t.employer.locationLabel}
              </label>
              <input
                id="emp-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Addis Ababa or Remote"
                className="w-full min-h-[48px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F3F4F6]/60 dark:bg-slate-800 px-3.5 py-2.5 text-base text-[#0F1E36] dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-[#0F1E36] dark:focus:border-amber-400"
              />
            </div>

            <div>
              <label
                htmlFor="emp-type"
                className="block text-sm font-semibold text-[#0F1E36] dark:text-slate-100 mb-1.5"
              >
                {t.employer.employmentTypeLabel}
              </label>
              <select
                id="emp-type"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as JobPosting['employmentType'])}
                className="w-full min-h-[48px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F3F4F6]/60 dark:bg-slate-800 px-3.5 py-2.5 text-base text-[#0F1E36] dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-[#0F1E36] dark:focus:border-amber-400"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Apprenticeship">Apprenticeship</option>
                <option value="Contract">Contract</option>
                <option value="Fellowship">Fellowship</option>
              </select>
            </div>
          </div>

          <label className="inline-flex items-center gap-3 min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F3F4F6]/60 dark:bg-slate-800/70 cursor-pointer">
            <input
              type="checkbox"
              checked={isRemote}
              onChange={(e) => setIsRemote(e.target.checked)}
              className="h-5 w-5 rounded accent-[#0F1E36] dark:accent-amber-500"
            />
            <span className="text-sm font-semibold text-[#0F1E36] dark:text-slate-100">
              {t.employer.remoteCheckbox}
            </span>
          </label>

          <div>
            <label
              htmlFor="emp-summary"
              className="block text-sm font-semibold text-[#0F1E36] dark:text-slate-100 mb-1.5"
            >
              {t.employer.summaryLabel}
            </label>
            <textarea
              id="emp-summary"
              required
              rows={3}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F3F4F6]/60 dark:bg-slate-800 px-3.5 py-2.5 text-base text-[#0F1E36] dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-[#0F1E36] dark:focus:border-amber-400"
            />
          </div>

          <div>
            <label
              htmlFor="emp-skills"
              className="block text-sm font-semibold text-[#0F1E36] dark:text-slate-100 mb-1.5"
            >
              {t.employer.skillsLabel}
            </label>
            <input
              id="emp-skills"
              type="text"
              value={skillsRaw}
              onChange={(e) => setSkillsRaw(e.target.value)}
              placeholder="Communication, Basic Excel, Amharic"
              className="w-full min-h-[48px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F3F4F6]/60 dark:bg-slate-800 px-3.5 py-2.5 text-base text-[#0F1E36] dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-[#0F1E36] dark:focus:border-amber-400"
            />
          </div>

          <div className="border-t border-slate-200 dark:border-slate-800 pt-6 space-y-4">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-400">
                Accessibility Details
              </p>
              <h3 className="text-lg font-bold text-[#0F1E36] dark:text-white">
                Workplace &amp; Interview Accommodations
              </h3>
            </div>
            {[
              { id: 'emp-work-env', label: t.employer.workEnvLabel, value: workEnv, set: setWorkEnv, ph: 'Step-free entrance, quiet workspace' },
              { id: 'emp-remote-flex', label: t.employer.remoteFlexLabel, value: remoteFlex, set: setRemoteFlex, ph: 'Flexible start time, work from home 3 days/week' },
              { id: 'emp-assistive', label: t.employer.assistiveTechLabel, value: assistiveTech, set: setAssistiveTech, ph: 'NVDA-compatible tools, captions enabled' },
              { id: 'emp-comm', label: t.employer.commOptionsLabel, value: commOptions, set: setCommOptions, ph: 'Written instructions, chat support' },
              { id: 'emp-interview', label: t.employer.interviewAccLabel, value: interviewAcc, set: setInterviewAcc, ph: 'Questions sent 24 hours early, extra time' },
              { id: 'emp-app-proc', label: t.employer.appProcessAccLabel, value: appProcessAcc, set: setAppProcessAcc, ph: 'Voice or typed answers accepted, no timed test' },
              { id: 'emp-additional', label: t.employer.additionalSupportLabel, value: additionalSupport, set: setAdditionalSupport, ph: 'Optional onboarding mentor' },
            ].map((field) => (
              <div key={field.id}>
                <label
                  htmlFor={field.id}
                  className="block text-sm font-semibold text-[#0F1E36] dark:text-slate-100 mb-1.5"
                >
                  {field.label}
                </label>
                <input
                  id={field.id}
                  type="text"
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  placeholder={field.ph}
                  className="w-full min-h-[48px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F3F4F6]/60 dark:bg-slate-800 px-3.5 py-2.5 text-base text-[#0F1E36] dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-[#0F1E36] dark:focus:border-amber-400"
                />
              </div>
            ))}
          </div>

          {publishError && (
            <p
              role="alert"
              className="text-sm font-semibold text-red-900 dark:text-red-100 bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-700 rounded-xl p-3.5"
            >
              {publishError}
            </p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={isPublishing || violations.length > 0}
              className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-md text-base font-bold bg-amber-500 hover:bg-amber-400 text-[#0F1E36] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <span>{isPublishing ? t.common.loadingStatus : t.employer.publishButton}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
