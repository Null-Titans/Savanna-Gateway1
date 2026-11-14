import React from 'react';
import { ArrowRight, Briefcase, Building2, ShieldCheck, UserPlus, Users } from 'lucide-react';
import { useI18n } from '../../i18n';
import { GatewayModule, ValidatedTheme } from '../../types/gateway';
import { ReadAloudButton } from '../accessibility/ReadAloudButton';

interface MainGatewayProps {
  theme: ValidatedTheme;
  onNavigate: (mod: GatewayModule, opts?: { partnerAssisted?: boolean }) => void;
}

export const MainGateway: React.FC<MainGatewayProps> = ({ theme, onNavigate }) => {
  const { t } = useI18n();

  return (
    <div className="space-y-10">
      {/* Welcoming, calm hero without unnecessary decoration or excessive animation */}
      <section aria-labelledby="gw-home-headline" className="space-y-4 max-w-3xl">
        <p className="text-sm font-semibold text-slate-700">{theme.organizationName}</p>
        <h1 id="gw-home-headline" className="text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
          {t.home.headline}
        </h1>
        <p className="text-base sm:text-lg text-slate-700 gw-prose-measure">
          {theme.introText || t.home.subtitle}
        </p>
        <ReadAloudButton textToRead={`${t.home.headline}. ${t.home.subtitle}`} />
      </section>

      {/* Two Clear Primary Destinations */}
      <section aria-label="Main choices" className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <div className="rounded-2xl border border-slate-300 bg-white p-6 sm:p-7 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-slate-100 text-slate-900">
              <UserPlus className="w-6 h-6" aria-hidden="true" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {t.home.onboardingCardTitle}
            </h2>
            <p className="text-base text-slate-700">{t.home.onboardingCardBody}</p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => onNavigate('onboarding', { partnerAssisted: false })}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl text-base font-semibold transition-colors"
              style={{
                backgroundColor: 'var(--gw-primary)',
                color: 'var(--gw-primary-text)',
              }}
            >
              <span>{t.home.onboardingCardCta}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-300 bg-white p-6 sm:p-7 flex flex-col justify-between gap-6">
          <div className="space-y-3">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-teal-50 text-teal-900">
              <Briefcase className="w-6 h-6" aria-hidden="true" />
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {t.home.careerCardTitle}
            </h2>
            <p className="text-base text-slate-700">{t.home.careerCardBody}</p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => onNavigate('career')}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-xl text-base font-semibold transition-colors"
              style={{
                backgroundColor: 'var(--gw-secondary)',
                color: 'var(--gw-secondary-text)',
              }}
            >
              <span>{t.home.careerCardCta}</span>
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>

      {/* Secondary Pathways: Partner & Employer */}
      <section aria-label="Partner and employer options" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => onNavigate('onboarding', { partnerAssisted: true })}
          className="flex items-center justify-between gap-3 min-h-[56px] p-4 rounded-xl border border-slate-300 bg-white text-start hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-3 text-base font-semibold text-slate-900">
            <Users className="w-5 h-5 text-slate-700 shrink-0" aria-hidden="true" />
            <span>{t.home.partnerModeCta}</span>
          </span>
          <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('employer')}
          className="flex items-center justify-between gap-3 min-h-[56px] p-4 rounded-xl border border-slate-300 bg-white text-start hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-3 text-base font-semibold text-slate-900">
            <Building2 className="w-5 h-5 text-slate-700 shrink-0" aria-hidden="true" />
            <span>{t.home.employerModeCta}</span>
          </span>
          <ArrowRight className="w-4 h-4 text-slate-600 shrink-0" aria-hidden="true" />
        </button>
      </section>

      {/* Plain-language Privacy & Access Promises */}
      <section
        aria-labelledby="gw-promises-title"
        className="rounded-2xl border border-slate-300 bg-white p-6 space-y-3"
      >
        <h2 id="gw-promises-title" className="text-lg font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-teal-800 shrink-0" aria-hidden="true" />
          <span>{t.home.promiseTitle}</span>
        </h2>
        <ul className="space-y-2 text-base text-slate-800 list-disc ps-6">
          {t.home.promiseItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </div>
  );
};
