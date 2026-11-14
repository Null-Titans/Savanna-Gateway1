import React from 'react';
import { ExternalLink, ArrowRight } from 'lucide-react';
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
      <div className="space-y-2">
        <h2 className="text-2xl sm:text-3xl font-bold text-slate-900">
          Judge Verification Checklist (Demo Mode Only)
        </h2>
        <p className="text-base text-slate-700 gw-prose-measure">
          Every required capability maps directly to a live, working journey in this application. This page is hidden when Demo Mode is disabled.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-300 bg-white overflow-hidden">
        <div className="divide-y divide-slate-200">
          {rows.map((row) => (
            <div
              key={row.id}
              className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-slate-900">{row.requirement}</h3>
                <p className="text-sm text-slate-600">{row.where}</p>
              </div>
              <button
                type="button"
                onClick={row.onAction}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0"
                style={{
                  backgroundColor: 'var(--gw-primary)',
                  color: 'var(--gw-primary-text)',
                }}
              >
                <span>{row.actionLabel}</span>
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <section className="rounded-2xl border border-slate-300 bg-white p-5 sm:p-6 space-y-3">
        <h3 className="text-lg font-bold text-slate-900">
          Level 1 &amp; B2 Embeddable Web Component Host Demos (No React on Host)
        </h3>
        <p className="text-sm text-slate-700">
          These static HTML host pages load the compiled Shadow DOM Web Component bundle via a single{' '}
          <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">&lt;script&gt;</code> tag.
        </p>
        <div className="flex flex-wrap gap-3 pt-1">
          <a
            href="/demo-plain-html.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg border border-slate-400 bg-white text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            <span>Open Plain HTML Host Demo</span>
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
          <a
            href="/demo-savanna-host.html"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-lg border border-slate-400 bg-white text-sm font-semibold text-slate-900 hover:bg-slate-50"
          >
            <span>Open Simulated Savanna Host Demo</span>
            <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
      </section>
    </div>
  );
};
