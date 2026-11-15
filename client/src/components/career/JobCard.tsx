import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Code2, Send } from 'lucide-react';
import { useI18n } from '../../i18n';
import { JobPosting } from '../../types/gateway';
import { buildJobPostingJsonLd } from '../../utils/jsonLd';
import { ReadAloudButton } from '../accessibility/ReadAloudButton';

interface JobCardProps {
  job: JobPosting;
  onApply: (job: JobPosting) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onApply }) => {
  const { t } = useI18n();
  const [expanded, setExpanded] = useState(false);

  const jsonLdString = useMemo(() => JSON.stringify(buildJobPostingJsonLd(job), null, 2), [job]);

  return (
    <article
      aria-labelledby={`job-title-${job.id}`}
      className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm hover:shadow-md transition-shadow space-y-5"
    >
      {/* Level 3 Delivery Criteria: valid schema.org/JobPosting JSON-LD per job card */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString }}
      />

      <div className="space-y-2">
        <h3
          id={`job-title-${job.id}`}
          className="text-xl font-bold text-[#0F1E36] dark:text-white tracking-tight"
        >
          {job.title}
        </h3>
        {/* Clean unboxed metadata with typographic separators (no static pill clusters) */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-700 dark:text-slate-300">
          <span className="font-semibold text-[#1E3A5F] dark:text-amber-400">
            {job.organization}
          </span>
          <span aria-hidden="true">·</span>
          <span>{job.location}</span>
          <span aria-hidden="true">·</span>
          <span>{job.employmentType}</span>
          {job.applicationDeadline && (
            <>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {t.career.deadlineLabel}: {job.applicationDeadline}
              </span>
            </>
          )}
          {job.isDemoData && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-slate-600 dark:text-slate-400">Demo listing</span>
            </>
          )}
        </div>
      </div>

      <p className="text-base text-slate-700 dark:text-slate-300 gw-prose-measure leading-relaxed">
        {job.descriptionSummary}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-700 bg-[#F3F4F6]/80 dark:bg-slate-800/70 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F1E36] dark:text-amber-400 mb-2">
            {t.career.accommodationsHeading}
          </h4>
          <ul className="space-y-1 text-sm text-slate-800 dark:text-slate-200 list-disc ps-5">
            {job.accommodationsOffered.map((acc) => (
              <li key={acc}>{acc}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl border border-slate-200/80 dark:border-slate-700 bg-[#F3F4F6]/80 dark:bg-slate-800/70 p-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#0F1E36] dark:text-amber-400 mb-2">
            {t.career.skillsHeading}
          </h4>
          <ul className="space-y-1 text-sm text-slate-700 dark:text-slate-300 list-disc ps-5">
            {job.requiredSkills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </div>
      </div>

      {expanded && (
        <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800/80 p-5 space-y-4 text-sm text-slate-800 dark:text-slate-200">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {t.employer.workEnvLabel}
              </dt>
              <dd className="mt-1 font-medium text-[#0F1E36] dark:text-white">
                {job.accommodationDetails.workEnvironmentAccessibility}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {t.employer.remoteFlexLabel}
              </dt>
              <dd className="mt-1 font-medium text-[#0F1E36] dark:text-white">
                {job.accommodationDetails.remoteOrFlexibleArrangements}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {t.employer.assistiveTechLabel}
              </dt>
              <dd className="mt-1 font-medium text-[#0F1E36] dark:text-white">
                {job.accommodationDetails.assistiveTechnologyAvailable}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {t.employer.commOptionsLabel}
              </dt>
              <dd className="mt-1 font-medium text-[#0F1E36] dark:text-white">
                {job.accommodationDetails.communicationOptions}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {t.employer.interviewAccLabel}
              </dt>
              <dd className="mt-1 font-medium text-[#0F1E36] dark:text-white">
                {job.accommodationDetails.interviewAccommodations}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                {t.employer.appProcessAccLabel}
              </dt>
              <dd className="mt-1 font-medium text-[#0F1E36] dark:text-white">
                {job.accommodationDetails.applicationProcessAccommodations}
              </dd>
            </div>
          </dl>

          <details className="pt-3 border-t border-slate-200 dark:border-slate-700">
            <summary className="cursor-pointer font-semibold text-[#0F1E36] dark:text-white inline-flex items-center gap-1.5 min-h-[44px]">
              <Code2 className="w-4 h-4 text-[#1E3A5F] dark:text-amber-400" aria-hidden="true" />
              <span>{t.career.jsonLdLabel}</span>
            </summary>
            <pre className="mt-2 p-4 rounded-xl bg-[#0F1E36] dark:bg-slate-950 text-slate-100 text-xs overflow-x-auto border border-slate-700">
              {jsonLdString}
            </pre>
          </details>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((prev) => !prev)}
            aria-expanded={expanded}
            className="inline-flex items-center gap-1.5 min-h-[44px] px-4 py-2 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-[#0F1E36] dark:text-slate-100 hover:bg-[#F3F4F6] dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-4 h-4" aria-hidden="true" />
                <span>{t.career.hideDetails}</span>
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" aria-hidden="true" />
                <span>{t.career.viewDetails}</span>
              </>
            )}
          </button>
          <ReadAloudButton
            textToRead={`${job.title} at ${job.organization}, ${job.location}. ${job.descriptionSummary}. Accommodations offered: ${job.accommodationsOffered.join(', ')}.`}
          />
        </div>

        <button
          type="button"
          onClick={() => onApply(job)}
          aria-label={`${t.career.applyButton}: ${job.title}`}
          className="inline-flex items-center gap-2 min-h-[48px] px-6 py-2.5 rounded-md text-base font-bold bg-amber-500 hover:bg-amber-400 text-[#0F1E36] transition-colors shadow-sm cursor-pointer"
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          <span>{t.career.applyButton}</span>
        </button>
      </div>
    </article>
  );
};
