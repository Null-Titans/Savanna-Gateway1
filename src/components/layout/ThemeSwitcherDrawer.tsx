import React, { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, Moon, Sun, X } from 'lucide-react';
import { ThemeConfig, ValidatedTheme } from '../../types/gateway';
import { PRESET_THEMES } from '../../config/themes';
import { ApiMode } from '../../services/api/client';
import { getRecentGatewayEvents } from '../../utils/events';
import type { ColorMode } from '../../app/GatewayShell';
import { useI18n } from '../../i18n';

interface ThemeSwitcherDrawerProps {
  open: boolean;
  onClose: () => void;
  rawTheme: ThemeConfig;
  validatedTheme: ValidatedTheme;
  onUpdateTheme: (next: ThemeConfig) => void;
  colorMode: ColorMode;
  onToggleColorMode: () => void;
  apiMode: ApiMode;
  apiBaseUrl: string;
  onChangeApiMode: (mode: ApiMode, baseUrl: string) => void;
  flakyNetwork: boolean;
  onToggleFlakyNetwork: (enabled: boolean) => void;
}

export const ThemeSwitcherDrawer: React.FC<ThemeSwitcherDrawerProps> = ({
  open,
  onClose,
  rawTheme,
  validatedTheme,
  onUpdateTheme,
  colorMode,
  onToggleColorMode,
  apiMode,
  apiBaseUrl,
  onChangeApiMode,
  flakyNetwork,
  onToggleFlakyNetwork,
}) => {
  const { t } = useI18n();
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);
  const isDark = colorMode === 'dark';

  useEffect(() => {
    if (open) {
      closeBtnRef.current?.focus();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const events = getRecentGatewayEvents();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gw-theme-dialog-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 bg-[#0F1E36]/60 dark:bg-black/70 backdrop-blur-[2px] flex justify-end"
    >
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 text-[#0F1E36] dark:text-slate-100 h-screen overflow-y-auto overscroll-contain shadow-2xl border-s border-slate-200 dark:border-slate-800 flex flex-col">
        <div
          className="bg-[#0F1E36] text-white p-5 sm:p-6 flex items-start justify-between gap-4 shrink-0 border-b border-white/10 dark:border-slate-800"
          style={{ backgroundColor: 'var(--gw-primary)', color: 'var(--gw-primary-text)' }}
        >
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-amber-400">
              Live Configuration
            </p>
            <h2 id="gw-theme-dialog-title" className="text-xl font-bold tracking-tight text-white">
              Partner Theme &amp; API Configuration
            </h2>
          </div>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close configuration dialog"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md border border-white/25 bg-[#162947] text-white hover:bg-white/15 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6 flex-1">
          {/* Appearance: Light / Dark Mode Switch */}
          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F3F4F6]/80 dark:bg-slate-800/80 p-3.5">
              <div>
                <p className="text-sm font-bold text-[#0F1E36] dark:text-white">Color Appearance</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Switch between light and high-contrast dark surfaces
                </p>
              </div>
              <button
                type="button"
                onClick={onToggleColorMode}
                aria-pressed={isDark}
                className="inline-flex items-center gap-2 min-h-[44px] px-4 py-2 rounded-md border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-xs sm:text-sm font-semibold text-[#0F1E36] dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400" aria-hidden="true" />
                ) : (
                  <Moon className="w-4 h-4 text-[#1E3A5F]" aria-hidden="true" />
                )}
                <span>{isDark ? t.common.lightModeLabel : t.common.darkModeLabel}</span>
              </button>
            </div>
          </section>

          {/* Partner Theme Presets (Addendum G3) */}
          <section className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-5">
            <h3 className="text-base font-bold text-[#0F1E36] dark:text-white">
              1. Switch Partner Theme Live
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.values(PRESET_THEMES).map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onUpdateTheme(preset)}
                  className={`min-h-[48px] p-3.5 rounded-xl border-2 text-start transition-colors cursor-pointer ${
                    rawTheme.id === preset.id
                      ? 'border-[#0F1E36] dark:border-amber-400 bg-[#0F1E36]/[0.05] dark:bg-amber-500/10 ring-1 ring-[#0F1E36] dark:ring-amber-400 font-semibold'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:bg-[#F3F4F6]/70 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="text-sm font-bold text-[#0F1E36] dark:text-white">
                    {preset.organizationName}
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {preset.logoText}
                  </div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label
                  htmlFor="gw-custom-org-name"
                  className="block text-xs font-semibold text-[#0F1E36] dark:text-slate-200 mb-1.5"
                >
                  Organization Name
                </label>
                <input
                  id="gw-custom-org-name"
                  type="text"
                  value={rawTheme.logoText}
                  onChange={(e) =>
                    onUpdateTheme({
                      ...rawTheme,
                      id: 'custom',
                      logoText: e.target.value,
                      organizationName: e.target.value,
                    })
                  }
                  className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F3F4F6]/60 dark:bg-slate-800 px-3 py-2 text-sm text-[#0F1E36] dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-[#0F1E36] dark:focus:border-amber-400"
                />
              </div>

              <div>
                <label
                  htmlFor="gw-custom-primary-hex"
                  className="block text-xs font-semibold text-[#0F1E36] dark:text-slate-200 mb-1.5"
                >
                  Primary Brand Hex (try #facc15 to test fallback)
                </label>
                <div className="flex gap-2">
                  <input
                    id="gw-custom-primary-hex"
                    type="text"
                    value={rawTheme.primaryColor}
                    onChange={(e) =>
                      onUpdateTheme({ ...rawTheme, id: 'custom', primaryColor: e.target.value })
                    }
                    className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F3F4F6]/60 dark:bg-slate-800 px-3 py-2 text-sm font-mono text-[#0F1E36] dark:text-slate-100 focus:bg-white dark:focus:bg-slate-900 focus:border-[#0F1E36] dark:focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateTheme({ ...rawTheme, id: 'custom', primaryColor: '#facc15' })
                    }
                    className="min-h-[44px] px-3 rounded-md border border-slate-300 dark:border-slate-600 bg-[#F3F4F6] dark:bg-slate-800 text-xs font-semibold text-[#0F1E36] dark:text-slate-100 hover:bg-slate-200/80 dark:hover:bg-slate-700 whitespace-nowrap cursor-pointer"
                  >
                    Test Low Contrast
                  </button>
                </div>
              </div>
            </div>

            {/* Live Contrast Validation Report */}
            {validatedTheme.warnings.length > 0 ? (
              <div
                role="status"
                className="rounded-xl border border-amber-400 dark:border-amber-600 bg-amber-50 dark:bg-amber-950/50 p-3.5 text-xs text-[#0F1E36] dark:text-amber-100 space-y-1"
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-800 dark:text-amber-400" aria-hidden="true" />
                  <span>WCAG 2.2 AA Contrast Auto-Fallback Active</span>
                </div>
                {validatedTheme.warnings.map((w) => (
                  <p key={w}>{w}</p>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-950/50 p-3.5 text-xs text-emerald-950 dark:text-emerald-100 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700 dark:text-emerald-400" aria-hidden="true" />
                <span>
                  Contrast verified: Primary {validatedTheme.primaryContrastRatio}:1 · Secondary{' '}
                  {validatedTheme.secondaryContrastRatio}:1 (≥ 4.5:1 WCAG AA)
                </span>
              </div>
            )}
          </section>

          {/* Mock vs Real API Switch */}
          <section className="space-y-3 border-t border-slate-200 dark:border-slate-800 pt-5">
            <h3 className="text-base font-bold text-[#0F1E36] dark:text-white">
              2. API Mode (Mock vs Real REST)
            </h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                aria-pressed={apiMode === 'mock'}
                onClick={() => onChangeApiMode('mock', apiBaseUrl)}
                className={`min-h-[44px] px-4 py-2 rounded-md border text-sm font-semibold transition-colors cursor-pointer ${
                  apiMode === 'mock'
                    ? 'border-[#0F1E36] dark:border-amber-400 bg-[#0F1E36] dark:bg-amber-500 text-white dark:text-[#0F1E36] shadow-xs'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0F1E36] dark:text-slate-100 hover:bg-[#F3F4F6] dark:hover:bg-slate-700'
                }`}
              >
                Demo Mode (Mock Adapter)
              </button>
              <button
                type="button"
                aria-pressed={apiMode === 'real'}
                onClick={() => onChangeApiMode('real', apiBaseUrl)}
                className={`min-h-[44px] px-4 py-2 rounded-md border text-sm font-semibold transition-colors cursor-pointer ${
                  apiMode === 'real'
                    ? 'border-[#0F1E36] dark:border-amber-400 bg-[#0F1E36] dark:bg-amber-500 text-white dark:text-[#0F1E36] shadow-xs'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0F1E36] dark:text-slate-100 hover:bg-[#F3F4F6] dark:hover:bg-slate-700'
                }`}
              >
                Real REST API
              </button>
            </div>

            <div>
              <label
                htmlFor="gw-api-base-url"
                className="block text-xs font-semibold text-[#0F1E36] dark:text-slate-200 mb-1.5"
              >
                VITE_API_BASE_URL (used in Real REST API mode)
              </label>
              <input
                id="gw-api-base-url"
                type="url"
                value={apiBaseUrl}
                onChange={(e) => onChangeApiMode(apiMode, e.target.value)}
                placeholder="https://api.example.org"
                className="w-full min-h-[44px] rounded-xl border border-slate-300 dark:border-slate-700 bg-[#F3F4F6]/60 dark:bg-slate-800 px-3 py-2 text-sm font-mono text-[#0F1E36] dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-[#0F1E36] dark:focus:border-amber-400"
              />
            </div>

            <label className="flex items-center gap-3 min-h-[44px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-[#F3F4F6]/60 dark:bg-slate-800/70 cursor-pointer">
              <input
                type="checkbox"
                checked={flakyNetwork}
                onChange={(e) => onToggleFlakyNetwork(e.target.checked)}
                className="h-5 w-5 rounded accent-[#0F1E36] dark:accent-amber-500"
              />
              <span className="text-sm font-medium text-[#0F1E36] dark:text-slate-200">
                Simulate 3G flaky connection (tests retry &amp; zero answer loss)
              </span>
            </label>
          </section>

          {/* Live Custom Events Log */}
          <section className="space-y-2 border-t border-slate-200 dark:border-slate-800 pt-5">
            <h3 className="text-base font-bold text-[#0F1E36] dark:text-white">
              3. Emitted Custom Events (Privacy Verified)
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Events cross Shadow DOM boundaries without exposing private support preferences or ID numbers.
            </p>
            <div className="rounded-xl border border-slate-700 bg-[#0F1E36] dark:bg-slate-950 text-slate-100 p-3.5 max-h-56 overflow-y-auto overscroll-contain text-xs font-mono space-y-2">
              {events.length === 0 ? (
                <p className="text-slate-300">No events dispatched yet in this session.</p>
              ) : (
                events.map((ev) => (
                  <div key={ev.id} className="border-b border-white/10 pb-2 last:border-b-0">
                    <div className="text-amber-400 font-semibold">{ev.name}</div>
                    <pre className="text-slate-200 whitespace-pre-wrap break-all mt-0.5">
                      {JSON.stringify(ev.detail)}
                    </pre>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};
