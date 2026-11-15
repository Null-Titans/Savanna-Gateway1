import React from 'react';
import { BookOpen, Globe, Info, Mic, Moon, SlidersHorizontal, Sun } from 'lucide-react';
import { useI18n } from '../../i18n';
import { LANGUAGE_REGISTRY } from '../../i18n/types';
import { SupportedLanguage } from '../../types/gateway';
import type { ColorMode } from '../../app/GatewayShell';

interface DemoBannerProps {
  apiMode: 'mock' | 'real';
  colorMode: ColorMode;
  onToggleColorMode: () => void;
  easyRead: boolean;
  onToggleEasyRead: () => void;
  onOpenThemeDrawer: () => void;
  onOpenVoiceAssistant?: () => void;
}

export const DemoBanner: React.FC<DemoBannerProps> = ({
  apiMode,
  colorMode,
  onToggleColorMode,
  easyRead,
  onToggleEasyRead,
  onOpenThemeDrawer,
  onOpenVoiceAssistant,
}) => {
  const { language, t, setLanguage } = useI18n();
  const isDark = colorMode === 'dark';

  return (
    <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-[#0F1E36] dark:text-slate-100 transition-colors">
      <div className="gw-container py-2.5 flex flex-wrap lg:flex-nowrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            type="button"
            onClick={onToggleColorMode}
            aria-pressed={isDark}
            aria-label={isDark ? t.common.lightModeLabel : t.common.darkModeLabel}
            title={isDark ? t.common.lightModeLabel : t.common.darkModeLabel}
            className="inline-flex items-center justify-center min-h-[44px] min-w-[44px] p-1.5 rounded-lg bg-transparent border-0 text-[#0F1E36] dark:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 cursor-pointer"
          >
            {isDark ? (
              <Sun className="w-5 h-5 text-amber-400" aria-hidden="true" />
            ) : (
              <Moon className="w-5 h-5 text-[#1E3A5F]" aria-hidden="true" />
            )}
          </button>

          <div className="flex items-start sm:items-center gap-2 min-w-0">
            <Info className="w-4 h-4 shrink-0 mt-0.5 sm:mt-0 text-[#1E3A5F] dark:text-amber-400" aria-hidden="true" />
            <p className="text-slate-700 dark:text-slate-300 leading-snug">
              <strong className="font-semibold text-[#0F1E36] dark:text-white">
                {apiMode === 'mock' ? t.common.demoBannerTitle : t.common.realApiLabel}:
              </strong>{' '}
              <span>{t.common.demoBannerBody}</span>
            </p>
          </div>
        </div>

        <div className="ms-auto flex flex-wrap items-center justify-end gap-2 shrink-0">
          <div className="inline-flex items-center gap-1.5 min-h-[44px] rounded-lg border border-slate-300 dark:border-slate-500 bg-slate-50 dark:bg-slate-800 px-2.5 text-[#0F1E36] dark:text-white shadow-xs hover:border-slate-400 dark:hover:border-amber-400 transition-colors dark:[color-scheme:dark]">
            <Globe className="w-4 h-4 shrink-0 text-[#1E3A5F] dark:text-amber-400" aria-hidden="true" />
            <label htmlFor="gw-language-select" className="gw-sr-only">
              {t.common.languageLabel}
            </label>
            <select
              id="gw-language-select"
              value={language}
              onChange={(e) => void setLanguage(e.target.value as SupportedLanguage)}
              className="min-h-[40px] bg-transparent dark:bg-slate-800 pe-1 text-xs sm:text-sm font-semibold text-[#0F1E36] dark:text-white dark:[color-scheme:dark] cursor-pointer"
            >
              {LANGUAGE_REGISTRY.map((lang) => (
                <option
                  key={lang.code}
                  value={lang.code}
                  className="bg-white text-[#0F1E36] dark:bg-slate-900 dark:text-white"
                >
                  {lang.nativeName} ({lang.code.toUpperCase()})
                </option>
              ))}
            </select>
          </div>

          {onOpenVoiceAssistant && (
            <button
              type="button"
              onClick={onOpenVoiceAssistant}
              className="inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs sm:text-sm font-semibold text-[#0F1E36] dark:text-slate-100 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Mic className="w-4 h-4 text-[#1E3A5F] dark:text-amber-400" aria-hidden="true" />
              <span>{t.voiceAssistant.openButton}</span>
            </button>
          )}

          <button
            type="button"
            onClick={onToggleEasyRead}
            aria-pressed={easyRead}
            className={`inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-lg border text-xs sm:text-sm font-semibold shadow-xs transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              easyRead
                ? 'border-[#0F1E36] bg-[#0F1E36] text-white dark:border-amber-400 dark:bg-amber-500 dark:text-[#0F1E36]'
                : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-[#0F1E36] dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
            }`}
          >
            <BookOpen
              className={`w-4 h-4 ${
                easyRead ? 'text-amber-400 dark:text-[#0F1E36]' : 'text-[#1E3A5F] dark:text-amber-400'
              }`}
              aria-hidden="true"
            />
            <span>{easyRead ? t.common.easyReadOn : t.common.easyReadOff}</span>
          </button>

          <button
            type="button"
            onClick={onOpenThemeDrawer}
            className="inline-flex items-center gap-2 min-h-[44px] px-3.5 py-2 rounded-lg border border-[#0F1E36]/20 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm font-semibold text-[#0F1E36] dark:text-slate-100 shadow-xs hover:bg-[#0F1E36] hover:text-white dark:hover:bg-slate-700 hover:border-[#0F1E36] dark:hover:border-slate-500 transition-colors whitespace-nowrap shrink-0 cursor-pointer group"
          >
            <SlidersHorizontal
              className="w-4 h-4 text-[#1E3A5F] dark:text-amber-400 group-hover:text-amber-400 transition-colors"
              aria-hidden="true"
            />
            <span>{t.nav.themeSettings}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
