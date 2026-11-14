import React from 'react';
import { Globe, Info, Mic, SlidersHorizontal } from 'lucide-react';
import { useI18n } from '../../i18n';
import { LANGUAGE_REGISTRY } from '../../i18n/types';
import { SupportedLanguage } from '../../types/gateway';

interface DemoBannerProps {
  apiMode: 'mock' | 'real';
  onOpenThemeDrawer: () => void;
  onOpenVoiceAssistant?: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  apiMode,
  onOpenThemeDrawer,
  onOpenVoiceAssistant,
}) => {
  const { language, t, setLanguage } = useI18n();

  return (
    <div className="border-b border-slate-300 bg-slate-100 text-slate-900">
      <div className="gw-container py-2 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-start sm:items-center gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0 text-slate-700" aria-hidden="true" />
          <p>
            <strong className="font-semibold">
              {apiMode === 'mock' ? t.common.demoBannerTitle : t.common.realApiLabel}:
            </strong>{' '}
            <span>{t.common.demoBannerBody}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-slate-700" aria-hidden="true" />
            <label htmlFor="gw-language-select" className="gw-sr-only">
              {t.common.languageLabel}
            </label>
            <select
              id="gw-language-select"
              value={language}
              onChange={(e) => void setLanguage(e.target.value as SupportedLanguage)}
              className="min-h-[40px] rounded-lg border border-slate-400 bg-white px-2.5 py-1 text-xs sm:text-sm font-medium text-slate-900"
            >
              {LANGUAGE_REGISTRY.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} ({lang.code.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {onOpenVoiceAssistant && (
            <button
              type="button"
              onClick={onOpenVoiceAssistant}
              className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1 rounded-lg border border-slate-400 bg-white text-xs sm:text-sm font-medium text-slate-900 hover:bg-slate-50 whitespace-nowrap shrink-0"
            >
              <Mic className="w-3.5 h-3.5" aria-hidden="true" />
              <span>{t.voiceAssistant.openButton}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenThemeDrawer}
            className="inline-flex items-center gap-1.5 min-h-[40px] px-3 py-1 rounded-lg border border-slate-400 bg-white text-xs sm:text-sm font-medium text-slate-900 hover:bg-slate-50 whitespace-nowrap shrink-0"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" />
            <span>{t.nav.themeSettings}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
