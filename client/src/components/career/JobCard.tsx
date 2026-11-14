import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, Code2, Send } from 'lucide-react';
import { useI18n } from '../../i18n';
import { JobPosting } from '../../types/gateway';
import { buildJobPostingJsonLd } from '../../utils/jsonLd';

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
      className="rounded-2xl border border-slate-300 bg-white p-5 sm:p-6 space-y-4"
    >
      {/* Level 3 Delivery Criteria: valid schema.org/JobPosting JSON-LD per job card */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdString }}
      />

      <div className="space-y-2">
        <h3 id={`job-title-${job.id}`} className="text-xl font-bold text-slate-900">
          {job.title}
        </h3>
        {/* Clean unboxed metadata with typographic separators (no static pill clusters) */}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-700">
          <span className="font-semibold text-slate-900">{job.organization}</span>
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
              <span className="text-slate-600">Demo listing</span>
            </>
          )}
        </div>
      </div>

      <p className="text-base text-slate-800 gw-prose-measure">{job.descriptionSummary}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-1.5">{t.career.accommodationsHeading}</h4>
          <ul className="space-y-1 text-sm text-slate-800 list-disc ps-5">
            {job.accommodationsOffered.map((acc) => (
              <li key={acc}>{acc}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-900 mb-1.5">{t.career.skillsHeading}</h4>
          <ul className="space-y-1 text-sm text-slate-700 list-disc ps-5">
            {job.requiredSkills.map((skill) => (
              <li key={skill}>{skill}</li>
            ))}
          </ul>
        </div>
      </div>

      {expanded && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-sm text-slate-800">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <dt className="font-semibold text-slate-900">{t.employer.workEnvLabel}</dt>
              <dd className="mt-0.5">{job.accommodationDetails.workEnvironmentAccessibility}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">{t.employer.remoteFlexLabel}</dt>
              <dd className="mt-0.5">{job.accommodationDetails.remoteOrFlexibleArrangements}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">{t.employer.assistiveTechLabel}</dt>
              <dd className="mt-0.5">{job.accommodationDetails.assistiveTechnologyAvailable}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">{t.employer.commOptionsLabel}</dt>
              <dd className="mt-0.5">{job.accommodationDetails.communicationOptions}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">{t.employer.interviewAccLabel}</dt>
              <dd className="mt-0.5">{job.accommodationDetails.interviewAccommodations}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">{t.employer.appProcessAccLabel}</dt>
              <dd className="mt-0.5">{job.accommodationDetails.applicationProcessAccommodations}</dd>
            </div>
          </dl>

          <details className="pt-2 border-t border-slate-200">
            <summary className="cursor-pointer font-medium text-slate-800 inline-flex items-center gap-1.5 min-h-[44px]">
              <Code2 className="w-4 h-4" aria-hidden="true" />
              <span>{t.career.jsonLdLabel}</span>
            </summary>
            <pre className="mt-2 p-3 rounded-lg bg-slate-900 text-slate-100 text-xs overflow-x-auto">
              {jsonLdString}
            </pre>
          </details>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="inline-flex items-center gap-1.5 min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-800 hover:bg-slate-50"
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

        <button
          type="button"
          onClick={() => onApply(job)}
          aria-label={`${t.career.applyButton}: ${job.title}`}
          className="inline-flex items-center gap-2 min-h-[48px] px-5 py-2.5 rounded-xl text-base font-semibold transition-colors"
          style={{
            backgroundColor: 'var(--gw-primary)',
            color: 'var(--gw-primary-text)',
          }}
        >
          <Send className="w-4 h-4" aria-hidden="true" />
          <span>{t.career.applyButton}</span>
        </button>
      </div>
    </article>
  );
};
