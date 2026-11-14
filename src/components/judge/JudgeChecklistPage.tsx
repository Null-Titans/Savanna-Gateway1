import React from 'react';
import { ArrowRight, Cross, ExternalLink, ShieldCheck } from 'lucide-react';
import { GatewayModule } from '../../types/gateway';

interface JudgeChecklistPageProps {
  onNavigate: (mod: GatewayModule, opts?: { partnerAssisted?: boolean }) => void;
  onOpenThemeDrawer: () => void;
}

export const JudgeChecklistPage: React.FC<JudgeChecklistPageProps> = ({
  onNavigate,
  onOpenThemeDrawer,
}) => {
  const rows: Array<{
    id: string;
    requirement: string;
    where: string;
    actionLabel: string;
    onAction: () => void;
  }> = [
    {
      id: 'p0-form-engine',
      requirement: 'P0: One-question-per-screen form engine (no timeout, review/edit, plain errors, focus on heading)',
      where: 'Onboarding Wizard & Job Application',
      actionLabel: 'Open Onboarding',
      onAction: () => onNavigate('onboarding'),
    },
    {
      id: 'p0-voice',
      requirement: 'P0: Feature-detected Voice input + Read-aloud + Amharic (am) i18n with Ethiopic fallback',
      where: 'Any eligible text step (Name, Contact, Experience)',
      actionLabel: 'Test Voice Step',
      onAction: () => onNavigate('onboarding'),
    },
    {
      id: 'p0-identity',
      requirement: 'P0: 5 Identity alternatives (No kebele ID required, mic disabled on ID number)',
      where: 'Onboarding Step 4 (Identity route)',
      actionLabel: 'Go to Onboarding',
      onAction: () => onNavigate('onboarding'),
    },
    {
      id: 'p0-support',
      requirement: 'P0: Private support request (no medical proof/diagnosis, skippable, excluded from host events)',
      where: 'Onboarding Step 5 (Private support)',
      actionLabel: 'Go to Onboarding',
      onAction: () => onNavigate('onboarding'),
    },
    {
      id: 'p1-career',
      requirement: 'P1: Career Gateway (lazy-loaded, private accommodation filter, Schema.org JobPosting JSON-LD, application reuse)',
      where: 'Accessible Jobs module',
      actionLabel: 'Open Career Gateway',
      onAction: () => onNavigate('career'),
    },
    {
      id: 'p1-employer',
      requirement: 'P1: Employer accommodation form with D4 medical/diagnosis safeguard blocker',
      where: 'For Employers module',
      actionLabel: 'Open Employer Form',
      onAction: () => onNavigate('employer'),
    },
    {
      id: 'p2-partner',
      requirement: 'P2: Partner-assisted registration with explicit consent record & timestamp',
      where: 'Onboarding in Partner-Assisted mode',
      actionLabel: 'Launch Partner Mode',
      onAction: () => onNavigate('onboarding', { partnerAssisted: true }),
    },
    {
      id: 'd1-privacy',
      requirement: 'D1/C3: Shared device protection, opt-in IndexedDB (excluding sensitive IDs), honest SMS status, flaky network retry',
      where: 'Save & Resume Panel + API Config Drawer',
      actionLabel: 'Open Theme & API Drawer',
      onAction: onOpenThemeDrawer,
    },
  ];

  return (
    <div className="space-y-6">
      <div
        className="relative overflow-hidden rounded-2xl bg-[#0F1E36] dark:border dark:border-slate-800 text-white p-6 sm:p-8 shadow-md space-y-2.5"
        style={{ backgroundColor: 'var(--gw-primary)', color: 'var(--gw-primary-text)' }}
      >
        <Cross
          className="w-36 h-36 text-white/[0.04] absolute -right-4 -bottom-6 pointer-events-none"
          aria-hidden="true"
        />
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
          <ShieldCheck className="w-4 h-4" aria-hidden="true" />
          <span>Judge Verification · WCAG 2.2 AA</span>
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
          Judge Verification Checklist (Demo Mode Only)
        </h2>
        <p className="text-base text-slate-200 gw-prose-measure leading-relaxed">
          Every required capability maps directly to a live, working journey in this application. This page is hidden when Demo Mode is disabled.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {rows.map((row, idx) => (
            <div
              key={row.id}
              className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#F3F4F6]/60 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="flex items-start gap-3.5">
                <span className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-950/70 border border-amber-300 dark:border-amber-700 text-[#0F1E36] dark:text-amber-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 tabular-nums">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-[#0F1E36] dark:text-white">
                    {row.requirement}
                  </h3>
                  <p className="text-sm text-slate-600 dark:text-slate-300">{row.where}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={row.onAction}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-4 py-2 rounded-md bg-[#1E3A5F] hover:bg-[#0F1E36] dark:bg-slate-800 dark:hover:bg-slate-700 dark:border dark:border-slate-600 text-white text-sm font-semibold whitespace-nowrap shrink-0 transition-colors shadow-xs cursor-pointer"
              >
                <span>{row.actionLabel}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <section
        className="relative overflow-hidden rounded-2xl bg-[#0F1E36] dark:border dark:border-slate-800 text-white p-6 sm:p-8 shadow-md space-y-4"
        style={{ backgroundColor: 'var(--gw-primary)', color: 'var(--gw-primary-text)' }}
      >
        <Cross
          className="w-32 h-32 text-white/[0.04] absolute -right-4 -bottom-6 pointer-events-none"
          aria-hidden="true"
        />
        <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
          No React on Host · Shadow DOM
        </p>
        <h3 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
          Level 1 &amp; B2 Embeddable Web Component Host Demos (No React on Host)
        </h3>
        <p className="text-sm sm:text-base text-slate-200 max-w-2xl leading-relaxed">
          These static HTML host pages load the compiled Shadow DOM Web Component bundle via a single{' '}
          <code className="font-mono bg-[#162947] border border-white/15 text-amber-300 px-1.5 py-0.5 rounded">
            &lt;script&gt;
          </code>{' '}
          tag.
        </p>
        <div className="flex flex-wrap gap-3 pt-1 relative z-10">
          <a
            href="/demo-plain-html.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 min-h-[48px] px-5 py-2.5 rounded-md bg-amber-500 hover:bg-amber-400 text-[#0F1E36] text-sm font-bold shadow-sm transition-colors"
          >
            <span>Open Plain HTML Host Demo</span>
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
          <a
            href="/demo-savanna-host.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 min-h-[48px] px-5 py-2.5 rounded-md border border-white/25 bg-[#162947] text-white text-sm font-semibold hover:bg-white/15 transition-colors"
          >
            <span>Open Simulated Savanna Host Demo</span>
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      </section>
    </div>
  );
};
