import React, { useCallback, useEffect, useState } from 'react';
import { Lock, Search } from 'lucide-react';
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
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">{t.career.pageTitle}</h2>
        <p className="text-base text-slate-700 gw-prose-measure">{t.career.pageSubtitle}</p>
      </div>

      {/* Search + Private Support-Needs Filter */}
      <div className="rounded-2xl border border-slate-300 bg-white p-5 space-y-5">
        <div className="space-y-2">
          <label htmlFor="gw-job-search" className="block text-sm font-semibold text-slate-900">
            {t.career.searchLabel}
          </label>
          <div className="relative">
            <Search
              className="w-5 h-5 text-slate-500 absolute start-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id="gw-job-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t.career.searchPlaceholder}
              className="w-full min-h-[48px] rounded-xl border border-slate-400 bg-white ps-11 pe-4 py-2.5 text-base text-slate-900"
            />
          </div>
        </div>

        <fieldset className="space-y-3 pt-2 border-t border-slate-200">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <legend className="text-sm font-semibold text-slate-900">{t.career.filterTitle}</legend>
            {selectedCategories.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedCategories([])}
                className="min-h-[44px] px-3 text-sm font-medium text-slate-800 underline hover:text-slate-950"
              >
                {t.career.clearFilters}
              </button>
            )}
          </div>

          <p className="flex items-center gap-2 text-xs text-teal-950 bg-teal-50 border border-teal-800/20 rounded-lg px-3 py-2">
            <Lock className="w-3.5 h-3.5 shrink-0 text-teal-800" aria-hidden="true" />
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
                  className={`min-h-[44px] px-3.5 py-2 rounded-lg border text-sm font-medium transition-colors ${
                    active
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100'
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
        <div role="status" className="rounded-xl border border-slate-300 bg-white p-6 text-base font-medium text-slate-800">
          {t.common.loadingStatus}
        </div>
      ) : errorMsg ? (
        <div role="alert" className="rounded-xl border-2 border-red-700 bg-red-50 p-5 space-y-3 text-red-950">
          <p className="text-base font-semibold">{errorMsg}</p>
          <button
            type="button"
            onClick={() => void fetchJobs()}
            className="min-h-[44px] px-4 py-2 rounded-lg bg-red-800 text-white text-sm font-semibold hover:bg-red-900"
          >
            {t.common.retry}
          </button>
        </div>
      ) : jobs.length === 0 ? (
        <div className="rounded-xl border border-slate-300 bg-white p-6 text-base text-slate-700">
          {t.career.noJobsMatch}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm font-medium text-slate-700 tabular-nums" role="status">
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
