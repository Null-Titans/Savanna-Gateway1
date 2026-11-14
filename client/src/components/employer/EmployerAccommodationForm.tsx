import React, { useMemo, useState } from 'react';
import { AlertOctagon, CheckCircle2, ShieldAlert } from 'lucide-react';
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
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{t.employer.pageTitle}</h2>
        <p className="text-base text-slate-700 gw-prose-measure">{t.employer.pageSubtitle}</p>
      </div>

      {/* Addendum D4 Safeguard Notice */}
      <div className="rounded-xl border border-amber-400 bg-amber-50 p-4 flex items-start gap-3 text-amber-950">
        <ShieldAlert className="w-5 h-5 text-amber-900 shrink-0 mt-0.5" aria-hidden="true" />
        <div className="text-sm space-y-1">
          <p className="font-semibold">{t.employer.safeguardBannerTitle}</p>
          <p>{t.employer.safeguardBannerBody}</p>
        </div>
      </div>

      {violations.length > 0 && (
        <div
          role="alert"
          className="rounded-xl border-2 border-red-700 bg-red-50 p-4 space-y-2 text-red-950"
        >
          <div className="flex items-center gap-2 font-bold">
            <AlertOctagon className="w-5 h-5 text-red-800 shrink-0" aria-hidden="true" />
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
        <div className="rounded-2xl border-2 border-emerald-700 bg-white p-6 space-y-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <h3 className="text-xl font-bold text-slate-900">{publishedJob.title}</h3>
              <p className="text-sm text-slate-700 mt-1">{t.employer.publishedSuccess}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onPublishedNavigateToCareers}
              className="min-h-[48px] px-5 py-2.5 rounded-xl text-base font-semibold"
              style={{
                backgroundColor: 'var(--gw-primary)',
                color: 'var(--gw-primary-text)',
              }}
            >
              {t.employer.viewPublishedInGateway}
            </button>
            <button
              type="button"
              onClick={() => setPublishedJob(null)}
              className="min-h-[48px] px-5 py-2.5 rounded-xl border border-slate-400 bg-white text-slate-900 text-base font-medium"
            >
              Post another role
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handlePublish} className="rounded-2xl border border-slate-300 bg-white p-5 sm:p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="emp-title" className="block text-sm font-semibold text-slate-900 mb-1.5">
                {t.employer.jobTitleLabel}
              </label>
              <input
                id="emp-title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Example: Accessible Content Editor"
                className="w-full min-h-[48px] rounded-lg border border-slate-400 px-3.5 py-2 text-base"
              />
            </div>

            <div>
              <label htmlFor="emp-org" className="block text-sm font-semibold text-slate-900 mb-1.5">
                {t.employer.orgNameLabel}
              </label>
              <input
                id="emp-org"
                type="text"
                required
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="Example: Selam Tech Partners"
                className="w-full min-h-[48px] rounded-lg border border-slate-400 px-3.5 py-2 text-base"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label htmlFor="emp-location" className="block text-sm font-semibold text-slate-900 mb-1.5">
                {t.employer.locationLabel}
              </label>
              <input
                id="emp-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Addis Ababa or Remote"
                className="w-full min-h-[48px] rounded-lg border border-slate-400 px-3.5 py-2 text-base"
              />
            </div>

            <div>
              <label htmlFor="emp-type" className="block text-sm font-semibold text-slate-900 mb-1.5">
                {t.employer.employmentTypeLabel}
              </label>
              <select
                id="emp-type"
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as JobPosting['employmentType'])}
                className="w-full min-h-[48px] rounded-lg border border-slate-400 bg-white px-3.5 py-2 text-base"
              >
                <option value="Full-time">Full-time</option>
                <option value="Part-time">Part-time</option>
                <option value="Apprenticeship">Apprenticeship</option>
                <option value="Contract">Contract</option>
                <option value="Fellowship">Fellowship</option>
              </select>
            </div>
          </div>

          <label className="inline-flex items-center gap-3 min-h-[44px] cursor-pointer">
            <input
              type="checkbox"
              checked={isRemote}
              onChange={(e) => setIsRemote(e.target.checked)}
              className="h-5 w-5 rounded"
            />
            <span className="text-sm font-medium text-slate-900">{t.employer.remoteCheckbox}</span>
          </label>

          <div>
            <label htmlFor="emp-summary" className="block text-sm font-semibold text-slate-900 mb-1.5">
              {t.employer.summaryLabel}
            </label>
            <textarea
              id="emp-summary"
              required
              rows={2}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full rounded-lg border border-slate-400 px-3.5 py-2.5 text-base"
            />
          </div>

          <div>
            <label htmlFor="emp-skills" className="block text-sm font-semibold text-slate-900 mb-1.5">
              {t.employer.skillsLabel}
            </label>
            <input
              id="emp-skills"
              type="text"
              value={skillsRaw}
              onChange={(e) => setSkillsRaw(e.target.value)}
              placeholder="Communication, Basic Excel, Amharic"
              className="w-full min-h-[48px] rounded-lg border border-slate-400 px-3.5 py-2 text-base"
            />
          </div>

          <div className="border-t border-slate-200 pt-5 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Workplace &amp; Interview Accommodations</h3>
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
                <label htmlFor={field.id} className="block text-sm font-semibold text-slate-900 mb-1.5">
                  {field.label}
                </label>
                <input
                  id={field.id}
                  type="text"
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  placeholder={field.ph}
                  className="w-full min-h-[48px] rounded-lg border border-slate-400 px-3.5 py-2 text-base"
                />
              </div>
            ))}
          </div>

          {publishError && (
            <p role="alert" className="text-sm font-semibold text-red-900 bg-red-50 border border-red-300 rounded-lg p-3">
              {publishError}
            </p>
          )}

          <button
            type="submit"
            disabled={isPublishing || violations.length > 0}
            className="min-h-[48px] px-6 py-3 rounded-xl text-base font-semibold disabled:opacity-50"
            style={{
              backgroundColor: 'var(--gw-primary)',
              color: 'var(--gw-primary-text)',
            }}
          >
            {isPublishing ? t.common.loadingStatus : t.employer.publishButton}
          </button>
        </form>
      )}
    </div>
  );
};
