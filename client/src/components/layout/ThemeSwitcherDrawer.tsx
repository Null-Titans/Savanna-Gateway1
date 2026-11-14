import React, { useEffect, useRef } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { ThemeConfig, ValidatedTheme } from '../../types/gateway';
import { PRESET_THEMES } from '../../config/themes';
import { ApiMode } from '../../services/api/client';
import { getRecentGatewayEvents } from '../../utils/events';

interface ThemeSwitcherDrawerProps {
  open: boolean;
  onClose: () => void;
  rawTheme: ThemeConfig;
  validatedTheme: ValidatedTheme;
  onUpdateTheme: (next: ThemeConfig) => void;
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
  apiMode,
  apiBaseUrl,
  onChangeApiMode,
  flakyNetwork,
  onToggleFlakyNetwork,
}) => {
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (open) {
      closeBtnRef.current?.focus();
    }
  }, [open]);

  if (!open) return null;

  const events = getRecentGatewayEvents();

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="gw-theme-dialog-title"
      className="fixed inset-0 z-50 bg-slate-950/50 flex justify-end"
    >
      <div className="w-full max-w-lg bg-white h-full overflow-y-auto p-5 sm:p-6 shadow-xl space-y-6">
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <h2 id="gw-theme-dialog-title" className="text-xl font-bold text-slate-900">
            Partner Theme &amp; API Configuration
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close configuration dialog"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white text-slate-900 hover:bg-slate-50"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>

        {/* Partner Theme Presets (Addendum G3) */}
        <section className="space-y-3">
          <h3 className="text-base font-semibold text-slate-900">1. Switch Partner Theme Live</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.values(PRESET_THEMES).map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => onUpdateTheme(preset)}
                className={`min-h-[48px] p-3.5 rounded-xl border-2 text-start ${
                  rawTheme.id === preset.id
                    ? 'border-slate-900 bg-slate-100 font-semibold'
                    : 'border-slate-300 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="text-sm font-semibold text-slate-900">{preset.organizationName}</div>
                <div className="text-xs text-slate-600 mt-0.5">{preset.logoText}</div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div>
              <label htmlFor="gw-custom-org-name" className="block text-xs font-semibold text-slate-700 mb-1">
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
                className="w-full min-h-[44px] rounded-lg border border-slate-400 px-3 py-1.5 text-sm"
              />
            </div>

            <div>
              <label htmlFor="gw-custom-primary-hex" className="block text-xs font-semibold text-slate-700 mb-1">
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
                  className="w-full min-h-[44px] rounded-lg border border-slate-400 px-3 py-1.5 text-sm font-mono"
                />
                <button
                  type="button"
                  onClick={() =>
                    onUpdateTheme({ ...rawTheme, id: 'custom', primaryColor: '#facc15' })
                  }
                  className="min-h-[44px] px-2.5 rounded-lg border border-slate-300 bg-slate-50 text-xs font-medium whitespace-nowrap"
                >
                  Test Low Contrast
                </button>
              </div>
            </div>
          </div>

          {/* Live Contrast Validation Report */}
          {validatedTheme.warnings.length > 0 ? (
            <div role="status" className="rounded-lg border border-amber-400 bg-amber-50 p-3 text-xs text-amber-950 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" aria-hidden="true" />
                <span>WCAG 2.2 AA Contrast Auto-Fallback Active</span>
              </div>
              {validatedTheme.warnings.map((w) => (
                <p key={w}>{w}</p>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 text-xs text-emerald-950 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" aria-hidden="true" />
              <span>
                Contrast verified: Primary {validatedTheme.primaryContrastRatio}:1 · Secondary{' '}
                {validatedTheme.secondaryContrastRatio}:1 (≥ 4.5:1 WCAG AA)
              </span>
            </div>
          )}
        </section>

        {/* Mock vs Real API Switch */}
        <section className="space-y-3 border-t border-slate-200 pt-5">
          <h3 className="text-base font-semibold text-slate-900">2. API Mode (Mock vs Real REST)</h3>
          <div className="flex gap-2">
            <button
              type="button"
              aria-pressed={apiMode === 'mock'}
              onClick={() => onChangeApiMode('mock', apiBaseUrl)}
              className={`min-h-[44px] px-4 py-2 rounded-lg border text-sm font-semibold ${
                apiMode === 'mock'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-800'
              }`}
            >
              Demo Mode (Mock Adapter)
            </button>
            <button
              type="button"
              aria-pressed={apiMode === 'real'}
              onClick={() => onChangeApiMode('real', apiBaseUrl)}
              className={`min-h-[44px] px-4 py-2 rounded-lg border text-sm font-semibold ${
                apiMode === 'real'
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-300 bg-white text-slate-800'
              }`}
            >
              Real REST API
            </button>
          </div>

          <div>
            <label htmlFor="gw-api-base-url" className="block text-xs font-semibold text-slate-700 mb-1">
              VITE_API_BASE_URL (used in Real REST API mode)
            </label>
            <input
              id="gw-api-base-url"
              type="url"
              value={apiBaseUrl}
              onChange={(e) => onChangeApiMode(apiMode, e.target.value)}
              placeholder="https://api.example.org"
              className="w-full min-h-[44px] rounded-lg border border-slate-400 px-3 py-1.5 text-sm font-mono"
            />
          </div>

          <label className="flex items-center gap-3 min-h-[44px] cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={flakyNetwork}
              onChange={(e) => onToggleFlakyNetwork(e.target.checked)}
              className="h-5 w-5 rounded"
            />
            <span className="text-sm font-medium text-slate-900">
              Simulate 3G flaky connection (tests retry &amp; zero answer loss)
            </span>
          </label>
        </section>

        {/* Live Custom Events Log */}
        <section className="space-y-2 border-t border-slate-200 pt-5">
          <h3 className="text-base font-semibold text-slate-900">3. Emitted Custom Events (Privacy Verified)</h3>
          <p className="text-xs text-slate-600">
            Events cross Shadow DOM boundaries without exposing private support preferences or ID numbers.
          </p>
          <div className="rounded-xl border border-slate-300 bg-slate-900 text-slate-100 p-3 max-h-56 overflow-y-auto text-xs font-mono space-y-2">
            {events.length === 0 ? (
              <p className="text-slate-400">No events dispatched yet in this session.</p>
            ) : (
              events.map((ev) => (
                <div key={ev.id} className="border-b border-slate-800 pb-2">
                  <div className="text-emerald-300 font-semibold">{ev.name}</div>
                  <pre className="text-slate-300 whitespace-pre-wrap break-all mt-0.5">
                    {JSON.stringify(ev.detail)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};
