import React, { useCallback, useEffect, useState } from 'react';
import { Briefcase, Cross, Lock, Search } from 'lucide-react';
import { useI18n } from '../../i18n';
import { AccommodationCategory, JobPosting } from '../../types/gateway';
import { gatewayApi } from '../../services/api/client';
import { JobCard } from './JobCard';
import { JobApplicationFlow } from './JobApplicationFlow';

interface CareerGatewayProps {
  prefillApplicant?: { name: string; contact: string } | null;
  hostElement?: HTMLElement | null;
}

const ACCOMMODATION_CATEGORIES: AccommodationCategory[] = [
  'remote_flexible',
  'flexible_hours',
  'screen_reader_tools',
  'accessible_workplace',
  'assistive_tech',
  'communication_support',
  'other_accommodations',
];

export const CareerGateway: React.FC<CareerGatewayProps> = ({
  prefillApplicant,
  hostElement,
}) => {
  const { t } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<AccommodationCategory[]>([]);
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [applyingJob, setApplyingJob] = useState<JobPosting | null>(null);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const results = await gatewayApi.listJobs(searchQuery, selectedCategories);
      setJobs(results);
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Could not load job listings. Check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedCategories]);

  useEffect(() => {
    void fetchJobs();
  }, [fetchJobs]);

  const toggleCategory = (cat: AccommodationCategory) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  if (applyingJob) {
    return (
      <JobApplicationFlow
        job={applyingJob}
        initialName={prefillApplicant?.name}
        initialContact={prefillApplicant?.contact}
        hostElement={hostElement}
        onBackToJobs={() => setApplyingJob(null)}
      />
    );
  }

  return (
    <div className="space-y-8">
      <div
        className="relative overflow-hidden rounded-2xl bg-[#0F1E36] dark:border dark:border-slate-800 text-white p-6 sm:p-8 shadow-md space-y-2.5"
        style={{ backgroundColor: 'var(--gw-primary)', color: 'var(--gw-primary-text)' }}
      >
        <Cross
          className="w-36 h-36 text-white/[0.04] absolute -right-4 -bottom-6 pointer-events-none"
          aria-hidden="true"
        />
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <Briefcase className="w-4 h-4" aria-hidden="true" />
          <span>Accessible Careers · Private Filters</span>
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          {t.career.pageTitle}
        </h2>
        <p className="text-base text-slate-200 gw-prose-measure leading-relaxed">
          {t.career.pageSubtitle}
        </p>
      </div>

      {/* Search + Private Support-Needs Filter */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-7 shadow-sm space-y-5">
        <div className="space-y-2">
          <label
            htmlFor="gw-job-search"
            className="block text-sm font-semibold text-[#0F1E36] dark:text-white"
          >
            {t.career.searchLabel}
          </label>
          <div className="relative">
            <Search
              className="w-5 h-5 text-slate-500 dark:text-slate-400 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="gw-job-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.career.searchPlaceholder}
              className="w-full min-h-[48px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F3F4F6]/60 dark:bg-slate-800 ps-11 pe-4 py-2.5 text-base text-[#0F1E36] dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-[#0F1E36] dark:focus:border-amber-400"
            />
          </div>
        </div>

        <fieldset className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <legend className="text-sm font-bold text-[#0F1E36] dark:text-white">
              {t.career.filterTitle}
            </legend>
            {selectedCategories.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCategories([])}
                className="min-h-[44px] px-3.5 py-1.5 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm font-semibold text-[#0F1E36] dark:text-slate-100 hover:bg-[#F3F4F6] dark:hover:bg-slate-700 transition-colors cursor-pointer"
              >
                {t.career.clearFilters}
              </button>
            )}
          </div>

          <p className="flex items-center gap-2 text-xs font-medium text-[#0F1E36] dark:text-amber-100 bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-700 rounded-xl px-4 py-3">
            <Lock
              className="w-4 h-4 shrink-0 text-amber-800 dark:text-amber-400"
              aria-hidden="true"
            />
            <span>{t.career.filterPrivacyNote}</span>
          </p>

          <div className="flex flex-wrap gap-2">
            {ACCOMMODATION_CATEGORIES.map((cat) => {
              const active = selectedCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleCategory(cat)}
                  className={`min-h-[44px] px-4 py-2 rounded-full border text-sm transition-colors cursor-pointer ${
                    active
                      ? 'border-amber-500 bg-amber-500 text-[#0F1E36] font-bold shadow-xs'
                      : 'border-slate-300 dark:border-slate-700 bg-[#F3F4F6] dark:bg-slate-800 text-[#0F1E36] dark:text-slate-100 font-semibold hover:bg-slate-200/80 dark:hover:bg-slate-700'
                  }`}
                >
                  {t.career.categories[cat]}
                </button>
              );
            })}
          </div>
        </fieldset>
      </div>

      {/* Results Status / Error / Job Cards */}
      {isLoading ? (
        <div
          role="status"
          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm text-base font-medium text-[#0F1E36] dark:text-slate-100"
        >
          {t.common.loadingStatus}
        </div>
      ) : errorMsg ? (
        <div
          role="alert"
          className="rounded-2xl border-2 border-red-700 dark:border-red-500 bg-red-50 dark:bg-red-950/60 p-6 space-y-3 text-red-950 dark:text-red-100 shadow-sm"
        >
          <p className="text-base font-semibold">{errorMsg}</p>
          <button
            type="button"
            onClick={() => void fetchJobs()}
            className="min-h-[44px] px-4 py-2 rounded-md bg-red-800 text-white text-sm font-semibold hover:bg-red-900 cursor-pointer"
          >
            {t.common.retry}
          </button>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 shadow-sm text-base text-slate-700 dark:text-slate-300">
          {t.career.noJobsMatch}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-semibold text-[#0F1E36] dark:text-slate-200 tabular-nums" role="status">
            Showing {jobs.length} accessible {jobs.length === 1 ? 'role' : 'roles'}
          </p>
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} onApply={(j) => setApplyingJob(j)} />
          ))}
        </div>
      )}
    </div>
  );
};
