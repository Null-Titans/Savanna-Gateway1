import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { useI18n } from '../../i18n';
import { GatewayModule, ValidatedTheme } from '../../types/gateway';

interface GatewayHeaderProps {
  theme: ValidatedTheme;
  activeModule: GatewayModule;
  isDemoMode: boolean;
  onNavigate: (mod: GatewayModule) => void;
}

export const GatewayHeader: React.FC<GatewayHeaderProps> = ({
  theme,
  activeModule,
  isDemoMode,
  onNavigate,
}) => {
  const { t } = useI18n();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: Array<{ id: GatewayModule; label: string }> = [
    { id: 'home', label: t.nav.gateway },
    { id: 'onboarding', label: t.nav.onboarding },
    { id: 'career', label: t.nav.careers },
    { id: 'employer', label: t.nav.employers },
    ...(isDemoMode ? [{ id: 'judge' as const, label: t.nav.judgeChecklist }] : []),
  ];

  const handleNav = (id: GatewayModule) => {
    setMobileMenuOpen(false);
    onNavigate(id);
  };

  return (
    <header className="sticky top-0 z-30 border-b border-slate-300 bg-white">
      <div className="gw-container h-14 flex items-center justify-between gap-8">
        {/* Zone 1: Single-line brand title */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 min-h-[44px]"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <rect width="24" height="24" rx="6" fill={theme.effectivePrimary} />
            <path
              d="M7 12.5L10.5 16L17 9"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>{theme.logoText}</span>
        </button>

        {/* Zone 2: Concise single-line navigation links */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isCurrent = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isCurrent ? 'page' : undefined}
                onClick={() => handleNav(item.id)}
                className={`min-h-[44px] px-1 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors ${
                  isCurrent
                    ? 'border-slate-900 text-slate-950 font-semibold'
                    : 'border-transparent text-slate-700 hover:text-slate-950 hover:border-slate-300'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action (+ mobile menu button on small screens) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleNav('onboarding')}
            className="hidden sm:inline-flex items-center justify-center min-h-[40px] px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap shrink-0 transition-colors"
            style={{
              backgroundColor: 'var(--gw-primary)',
              color: 'var(--gw-primary-text)',
            }}
          >
            {t.nav.startAction}
          </button>

          <button
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="gw-mobile-nav"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-slate-300 bg-white text-slate-900"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Accessible mobile / 400% zoom navigation panel */}
      {mobileMenuOpen && (
        <nav
          id="gw-mobile-nav"
          aria-label="Mobile navigation"
          className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1"
        >
          {navItems.map((item) => {
            const isCurrent = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isCurrent ? 'page' : undefined}
                onClick={() => handleNav(item.id)}
                className={`block w-full text-start min-h-[44px] px-3 py-2 rounded-lg text-base font-medium ${
                  isCurrent ? 'bg-slate-100 text-slate-950 font-semibold' : 'text-slate-800 hover:bg-slate-50'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      )}
    </header>
  );
};
