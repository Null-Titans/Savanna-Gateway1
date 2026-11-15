import React, { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { I18nProvider, useI18n } from '../i18n';
import { PRESET_THEMES, validateTheme } from '../config/themes';
import { GatewayModule, SupportedLanguage, ThemeConfig } from '../types/gateway';
import { ApiMode, gatewayApi } from '../services/api/client';
import {
  getSimulateFlakyNetwork,
  setSimulateFlakyNetwork,
} from '../services/api/mockAdapter';
import { SkipLink } from '../components/accessibility/SkipLink';
import { GatewayHeader } from '../components/layout/GatewayHeader';
import { DemoBanner } from '../components/layout/DemoBanner';
import { MainGateway } from '../components/layout/MainGateway';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';

export type ColorMode = 'light' | 'dark';

const COLOR_MODE_STORAGE_KEY = 'gw_color_scheme';

function getInitialColorMode(): ColorMode {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const saved = window.localStorage.getItem(COLOR_MODE_STORAGE_KEY);
      if (saved === 'dark' || saved === 'light') {
        return saved;
      }
    }
  } catch {
    // Ignore storage access restrictions
  }
  return 'light';
}

// Lazy-load secondary modules so initial onboarding load stays strictly < 150 KB gzipped (Addendum C1)
const ThemeSwitcherDrawer = lazy(() =>
  import('../components/layout/ThemeSwitcherDrawer').then((m) => ({
    default: m.ThemeSwitcherDrawer,
  }))
);
const CareerGateway = lazy(() =>
  import('../components/career/CareerGateway').then((m) => ({ default: m.CareerGateway }))
);
const EmployerAccommodationForm = lazy(() =>
  import('../components/employer/EmployerAccommodationForm').then((m) => ({
    default: m.EmployerAccommodationForm,
  }))
);
const JudgeChecklistPage = lazy(() =>
  import('../components/judge/JudgeChecklistPage').then((m) => ({
    default: m.JudgeChecklistPage,
  }))
);
const VoiceAssistantPanel = lazy(() =>
  import('../components/accessibility/VoiceAssistantPanel').then((m) => ({
    default: m.VoiceAssistantPanel,
  }))
);
const JsonQuestionFlow = lazy(() =>
  import('../components/forms/JsonQuestionFlow').then((m) => ({
    default: m.JsonQuestionFlow,
  }))
);

export interface GatewayShellProps {
  tenantKey?: string;
  initialModule?: GatewayModule;
  initialOnboardingMode?: 'self' | 'partner_assisted' | 'edit';
  initialQuestionsUrl?: string;
  initialTheme?: ThemeConfig;
  initialLanguage?: SupportedLanguage;
  initialApiMode?: ApiMode;
  initialApiBaseUrl?: string;
  isDemoMode?: boolean;
  hostElement?: HTMLElement | null;
}

const GatewayShellInner: React.FC<GatewayShellProps> = ({
  tenantKey = 'savanna-demo-tenant',
  initialModule = 'home',
  initialOnboardingMode = 'self',
  initialQuestionsUrl,
  initialTheme = PRESET_THEMES.alx,
  isDemoMode = true,
  hostElement = null,
}) => {
  const { t, metadata } = useI18n();
  const [activeModule, setActiveModule] = useState<GatewayModule>(initialModule);
  const [partnerAssisted, setPartnerAssisted] = useState(
    initialOnboardingMode === 'partner_assisted'
  );
  const [easyRead, setEasyRead] = useState(false);
  const [rawTheme, setRawTheme] = useState<ThemeConfig>(initialTheme);
  const [colorMode, setColorMode] = useState<ColorMode>(getInitialColorMode);
  const [themeDrawerOpen, setThemeDrawerOpen] = useState(false);
  const [voiceAssistantOpen, setVoiceAssistantOpen] = useState(false);
  const [apiMode, setApiMode] = useState<ApiMode>(gatewayApi.getMode());
  const [apiBaseUrl, setApiBaseUrl] = useState<string>(gatewayApi.getBaseUrl());
  const [flakyNetwork, setFlakyNetwork] = useState<boolean>(getSimulateFlakyNetwork());
  const [prefillApplicant, setPrefillApplicant] = useState<{ name: string; contact: string } | null>(
    null
  );

  useEffect(() => {
    setActiveModule(initialModule);
  }, [initialModule]);

  useEffect(() => {
    setPartnerAssisted(initialOnboardingMode === 'partner_assisted');
  }, [initialOnboardingMode]);

  useEffect(() => {
    setRawTheme(initialTheme);
  }, [initialTheme]);

  // Synchronize .dark class on <html>, Shadow DOM host, and localStorage
  useEffect(() => {
    const isDark = colorMode === 'dark';
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
    }
    if (hostElement) {
      hostElement.classList.toggle('dark', isDark);
    }
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(COLOR_MODE_STORAGE_KEY, colorMode);
      }
    } catch {
      // Ignore storage access errors
    }
  }, [colorMode, hostElement]);

  // Lock background page scroll whenever a side panel drawer is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (!themeDrawerOpen && !voiceAssistantOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [themeDrawerOpen, voiceAssistantOpen]);

  const validatedTheme = useMemo(() => validateTheme(rawTheme), [rawTheme]);

  const handleToggleColorMode = () => {
    setColorMode((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const handleNavigate = (mod: GatewayModule, opts?: { partnerAssisted?: boolean }) => {
    if (opts && typeof opts.partnerAssisted === 'boolean') {
      setPartnerAssisted(opts.partnerAssisted);
    } else if (mod === 'onboarding') {
      setPartnerAssisted(false);
    }
    setActiveModule(mod);
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'auto' });
    }
  };

  const handleChangeApiMode = (nextMode: ApiMode, nextBaseUrl: string) => {
    gatewayApi.setMode(nextMode);
    gatewayApi.setBaseUrl(nextBaseUrl);
    setApiMode(nextMode);
    setApiBaseUrl(nextBaseUrl);
  };

  const handleToggleFlaky = (enabled: boolean) => {
    setSimulateFlakyNetwork(enabled);
    setFlakyNetwork(enabled);
  };

  const themeCssVars = {
    '--gw-primary': validatedTheme.effectivePrimary,
    '--gw-primary-text': validatedTheme.effectivePrimaryText,
    '--gw-secondary': validatedTheme.effectiveSecondary,
    '--gw-secondary-text': validatedTheme.effectiveSecondaryText,
    '--gw-font-sans': validatedTheme.fontFamily,
  } as React.CSSProperties;

  return (
    <div
      dir={metadata.dir}
      lang={metadata.code}
      style={themeCssVars}
      className={`${colorMode === 'dark' ? 'dark' : ''} ${
        easyRead ? 'gw-easy-read' : ''
      } min-h-screen flex flex-col bg-[var(--gw-bg-canvas)] text-[var(--gw-text-primary)] font-[var(--gw-font-sans)] transition-colors`}
    >
      <SkipLink targetId="gw-main-content" />

      <GatewayHeader
        theme={validatedTheme}
        activeModule={activeModule}
        isDemoMode={isDemoMode}
        onNavigate={(mod) => handleNavigate(mod)}
      />

      <DemoBanner
        apiMode={apiMode}
        colorMode={colorMode}
        onToggleColorMode={handleToggleColorMode}
        easyRead={easyRead}
        onToggleEasyRead={() => setEasyRead((prev) => !prev)}
        onOpenThemeDrawer={() => setThemeDrawerOpen(true)}
        onOpenVoiceAssistant={() => setVoiceAssistantOpen(true)}
      />

      <main id="gw-main-content" tabIndex={-1} className="flex-1 gw-container py-6 sm:py-10 focus:outline-none">
        {initialQuestionsUrl ? (
          <Suspense
            fallback={
              <div
                role="status"
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-base font-medium text-[#0F1E36] dark:text-slate-100 shadow-sm"
              >
                {t.common.loadingStatus}
              </div>
            }
          >
            <JsonQuestionFlow questionsUrl={initialQuestionsUrl} hostElement={hostElement} />
          </Suspense>
        ) : (
          <>
            {activeModule === 'home' && (
              <MainGateway theme={validatedTheme} onNavigate={handleNavigate} />
            )}

            {activeModule === 'onboarding' && (
              <OnboardingWizard
                tenantKey={tenantKey}
                initialMode={
                  partnerAssisted
                    ? 'partner_assisted'
                    : initialOnboardingMode === 'edit'
                    ? 'edit'
                    : 'self'
                }
                hostElement={hostElement}
                onNavigateToCareers={(prefill) => {
                  if (prefill) setPrefillApplicant(prefill);
                  handleNavigate('career');
                }}
              />
            )}

            {activeModule === 'profile' && (
              <OnboardingWizard
                tenantKey={tenantKey}
                initialMode="edit"
                hostElement={hostElement}
                onNavigateToCareers={(prefill) => {
                  if (prefill) setPrefillApplicant(prefill);
                  handleNavigate('career');
                }}
              />
            )}

            <Suspense
              fallback={
                <div
                  role="status"
                  className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 text-base font-medium text-[#0F1E36] dark:text-slate-100 shadow-sm"
                >
                  {t.common.loadingStatus}
                </div>
              }
            >
              {activeModule === 'career' && (
                <CareerGateway prefillApplicant={prefillApplicant} hostElement={hostElement} />
              )}

              {activeModule === 'employer' && (
                <EmployerAccommodationForm
                  onPublishedNavigateToCareers={() => handleNavigate('career')}
                />
              )}

              {activeModule === 'judge' && isDemoMode && (
                <JudgeChecklistPage
                  onNavigate={handleNavigate}
                  onOpenThemeDrawer={() => setThemeDrawerOpen(true)}
                />
              )}
            </Suspense>
          </>
        )}
      </main>

      <footer className="border-t border-slate-200 dark:border-slate-800 bg-[#F3F4F6] dark:bg-slate-900 py-6 text-xs sm:text-sm text-slate-700 dark:text-slate-300">
        <div className="gw-container flex flex-wrap items-center justify-between gap-3">
          <span className="font-medium text-[#0F1E36] dark:text-white">
            {validatedTheme.organizationName} · Accessible Onboarding &amp; Career Gateway
          </span>
          <span className="text-slate-600 dark:text-slate-400">
            WCAG 2.2 AA First · Privacy-First · Platform-Independent
          </span>
        </div>
      </footer>

      {themeDrawerOpen && (
        <Suspense fallback={null}>
          <ThemeSwitcherDrawer
            open={themeDrawerOpen}
            onClose={() => setThemeDrawerOpen(false)}
            rawTheme={rawTheme}
            validatedTheme={validatedTheme}
            onUpdateTheme={setRawTheme}
            colorMode={colorMode}
            onToggleColorMode={handleToggleColorMode}
            apiMode={apiMode}
            apiBaseUrl={apiBaseUrl}
            onChangeApiMode={handleChangeApiMode}
            flakyNetwork={flakyNetwork}
            onToggleFlakyNetwork={handleToggleFlaky}
          />
        </Suspense>
      )}

      {voiceAssistantOpen && (
        <Suspense fallback={null}>
          <VoiceAssistantPanel
            open={voiceAssistantOpen}
            onClose={() => setVoiceAssistantOpen(false)}
            activeModule={activeModule}
          />
        </Suspense>
      )}
    </div>
  );
};

export const GatewayShell: React.FC<GatewayShellProps> = (props) => {
  useEffect(() => {
    if (props.initialApiMode) {
      gatewayApi.setMode(props.initialApiMode);
    }
    if (props.initialApiBaseUrl) {
      gatewayApi.setBaseUrl(props.initialApiBaseUrl);
    }
  }, [props.initialApiBaseUrl, props.initialApiMode]);

  return (
    <I18nProvider initialLanguage={props.initialLanguage || 'en'}>
      <GatewayShellInner {...props} />
    </I18nProvider>
  );
};
