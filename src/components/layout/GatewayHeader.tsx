import React, { useState } from 'react';
import { ArrowUpRight, Menu, X } from 'lucide-react';
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
    <header
      className="sticky top-0 z-30 border-b border-white/10 dark:border-slate-800 bg-[#0F1E36] text-white shadow-sm"
      style={{ backgroundColor: 'var(--gw-primary)', color: 'var(--gw-primary-text)' }}
    >
      <div className="gw-container h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Single-line brand title with reference medical/gateway emblem */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight text-white whitespace-nowrap shrink-0 min-h-[44px] hover:opacity-90 transition-opacity cursor-pointer"
        >
          <svg
            width="28"
            height="28"
            viewBox="0 0 36 36"
            fill="none"
            aria-hidden="true"
            className="shrink-0"
          >
            <path d="M14 4H22V14H32V22H22V32H14V22H4V14H14V4Z" fill="#FFFFFF" />
            <circle cx="18" cy="18" r="5.5" fill="#F59E0B" />
            <path
              d="M15.8 18.2L17.4 19.7L20.5 16.5"
              stroke="#0F1E36"
              strokeWidth="2"
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
                className={`min-h-[44px] px-1 text-sm font-medium whitespace-nowrap shrink-0 border-b-2 transition-colors cursor-pointer ${
                  isCurrent
                    ? 'border-amber-400 text-amber-400 font-semibold'
                    : 'border-transparent text-slate-200 hover:text-white hover:border-white/40'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Amber CTA (+ mobile menu button on small screens) */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => handleNav('onboarding')}
            className="hidden sm:inline-flex items-center justify-center gap-1.5 min-h-[42px] px-5 py-2 rounded-md text-sm font-bold whitespace-nowrap shrink-0 bg-amber-500 text-[#0F1E36] hover:bg-amber-400 transition-colors shadow-sm cursor-pointer"
          >
            <span>{t.nav.startAction}</span>
            <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
          </button>

          <button
            type="button"
            aria-expanded={mobileMenuOpen}
            aria-controls="gw-mobile-nav"
            aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg border border-white/20 bg-[#162947] text-white hover:bg-[#1E3A5F] transition-colors cursor-pointer"
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
          className="md:hidden border-t border-white/10 bg-[#162947] px-4 py-3 space-y-1"
        >
          {navItems.map((item) => {
            const isCurrent = activeModule === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={isCurrent ? 'page' : undefined}
                onClick={() => handleNav(item.id)}
                className={`block w-full text-start min-h-[44px] px-3.5 py-2 rounded-lg text-base font-medium transition-colors cursor-pointer ${
                  isCurrent
                    ? 'bg-amber-500 text-[#0F1E36] font-bold'
                    : 'text-slate-100 hover:bg-white/10'
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
