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

export interface GatewayShellProps {
  tenantKey?: string;
  initialModule?: GatewayModule;
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
  initialTheme = PRESET_THEMES.alx,
  isDemoMode = true,
  hostElement = null,
}) => {
  const { t, metadata } = useI18n();
  const [activeModule, setActiveModule] = useState<GatewayModule>(initialModule);
  const [partnerAssisted, setPartnerAssisted] = useState(false);
  const [rawTheme, setRawTheme] = useState<ThemeConfig>(initialTheme);
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
    setRawTheme(initialTheme);
  }, [initialTheme]);

  const validatedTheme = useMemo(() => validateTheme(rawTheme), [rawTheme]);

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
      style={themeCssVars}
      className="min-h-screen flex flex-col bg-[var(--gw-bg-canvas)] text-[var(--gw-text-primary)] font-[var(--gw-font-sans)]"
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
        onOpenThemeDrawer={() => setThemeDrawerOpen(true)}
        onOpenVoiceAssistant={() => setVoiceAssistantOpen(true)}
      />

      <main id="gw-main-content" tabIndex={-1} className="flex-1 gw-container py-6 sm:py-10 focus:outline-none">
        {activeModule === 'home' && (
          <MainGateway theme={validatedTheme} onNavigate={handleNavigate} />
        )}

        {activeModule === 'onboarding' && (
          <OnboardingWizard
            tenantKey={tenantKey}
            initialMode={partnerAssisted ? 'partner_assisted' : 'self'}
            hostElement={hostElement}
            onNavigateToCareers={(prefill) => {
              if (prefill) setPrefillApplicant(prefill);
              handleNavigate('career');
            }}
          />
        )}

        <Suspense
          fallback={
            <div role="status" className="rounded-xl border border-slate-300 bg-white p-6 text-base font-medium text-slate-800">
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
      </main>

      <footer className="border-t border-slate-300 bg-white py-5 text-xs sm:text-sm text-slate-600">
        <div className="gw-container flex flex-wrap items-center justify-between gap-3">
          <span>{validatedTheme.organizationName} · Accessible Onboarding &amp; Career Gateway</span>
          <span>WCAG 2.2 AA First · Privacy-First · Platform-Independent</span>
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
