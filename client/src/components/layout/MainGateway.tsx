import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  Briefcase,
  Building2,
  CheckCircle2,
  Cross,
  ShieldCheck,
  UserPlus,
  Users,
} from 'lucide-react';
import { useI18n } from '../../i18n';
import { GatewayModule, ValidatedTheme } from '../../types/gateway';
import { getAssetCandidates } from '../../utils/assetUrl';
import { ReadAloudButton } from '../accessibility/ReadAloudButton';

interface MainGatewayProps {
  theme: ValidatedTheme;
  onNavigate: (mod: GatewayModule, opts?: { partnerAssisted?: boolean }) => void;
}

const HERO_IMAGE = 'assets/images/saia_hero_team_1794654721733.jpg';
const CARD_MEETING_IMAGE = 'assets/images/saia_card_meeting_1794654722770.jpg';
const ONBOARDING_CARD_IMAGE = 'assets/images/saia_event_forum_1794654723318.jpg';
const CAREER_CARD_IMAGE = 'assets/images/saia_event_retro_1794654722990.jpg';
const AVATAR_ISABELLE = 'assets/images/saia_avatar_isabelle_1794654725631.jpg';
const AVATAR_BARAKAT = 'assets/images/saia_avatar_barakat_1794654725241.jpg';
const AVATAR_LUCAS = 'assets/images/saia_avatar_lucas_1794654725988.jpg';

const HERO_PILL_ROWS: string[][] = [
  ['WCAG 2.2 AA', 'English · አማርኛ · Afaan Oromo', 'Voice Input'],
  ['Privacy-First', 'No Kebele ID Required', 'Platform-Independent'],
];

function GatewayImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className: string;
}) {
  const candidates = useMemo(() => getAssetCandidates(src), [src]);
  const [attemptIdx, setAttemptIdx] = useState(0);

  useEffect(() => {
    setAttemptIdx(0);
  }, [src]);

  if (attemptIdx >= candidates.length) {
    return (
      <div
        className={`${className} bg-gradient-to-br from-[#0F1E36] via-[#1E3A5F] to-amber-700/70`}
        aria-hidden="true"
      />
    );
  }

  return (
    <img
      src={candidates[attemptIdx]}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setAttemptIdx((idx) => idx + 1)}
      className={className}
    />
  );
}

export const MainGateway: React.FC<MainGatewayProps> = ({ theme, onNavigate }) => {
  const { t } = useI18n();

  return (
    <div className="space-y-12">
      {/* Reference-inspired Editorial Hero Banner with Glassmorphism Tags + Notched Floating Card */}
      <section
        aria-labelledby="gw-home-headline"
        className="relative rounded-2xl overflow-hidden bg-[#0F1E36] text-white shadow-xl"
      >
        <GatewayImage
          src={HERO_IMAGE}
          alt=""
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-[#0F1E36]/95 via-[#0F1E36]/82 to-[#0F1E36]/55"
          aria-hidden="true"
        />

        <div className="relative z-10 p-5 sm:p-10 lg:p-12 flex flex-col justify-between gap-7 sm:gap-10 min-h-[400px] sm:min-h-[440px]">
          {/* Upper Left Glassmorphism Feature Tags */}
          <div className="flex flex-col gap-1.5 sm:gap-2 max-w-2xl" aria-hidden="true">
            {HERO_PILL_ROWS.map((row, rowIdx) => (
              <div key={rowIdx} className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                {row.map((tag) => (
                  <span
                    key={tag}
                    className="bg-white/15 backdrop-blur-md border border-white/25 text-white text-[11px] sm:text-xs font-medium rounded-full px-2.5 sm:px-3.5 py-1 whitespace-nowrap"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ))}
          </div>

          {/* Bottom Split: Headline + CTA Left, Notched Floating Card Right */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="space-y-4 max-w-2xl">
              <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-amber-400">
                {theme.organizationName}
              </p>

              <h1
                id="gw-home-headline"
                className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-[1.12]"
              >
                <span>{t.home.headline}</span>
                <span
                  className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-500 text-[#0F1E36] align-middle ms-2.5 shadow-md"
                  aria-hidden="true"
                >
                  <Cross className="w-4 h-4 fill-[#0F1E36]" />
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-100 gw-prose-measure leading-relaxed">
                {theme.introText || t.home.subtitle}
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => onNavigate('onboarding', { partnerAssisted: false })}
                  className="inline-flex items-center justify-center gap-2 min-h-[48px] px-6 py-3 rounded-md text-base font-bold bg-amber-500 text-[#0F1E36] hover:bg-amber-400 transition-colors shadow-lg cursor-pointer"
                >
                  <span>{t.home.onboardingCardCta}</span>
                  <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                </button>

                <ReadAloudButton textToRead={`${t.home.headline}. ${t.home.subtitle}`} />
              </div>
            </div>

            {/* Notched Floating Feature Card (Bottom Right) */}
            <div className="w-full max-w-[320px] shrink-0 self-start lg:self-end drop-shadow-2xl">
              <div className="bg-white dark:bg-slate-900 rounded-t-2xl rounded-br-2xl p-4 pb-3 text-[#0F1E36] dark:text-slate-100">
                <div className="rounded-xl overflow-hidden h-36 w-full bg-slate-100 dark:bg-slate-800">
                  <GatewayImage
                    src={CARD_MEETING_IMAGE}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="mt-3.5 flex items-start gap-3">
                  <div
                    className="w-9 h-9 rounded-full bg-amber-500 text-[#0F1E36] flex items-center justify-center shrink-0 mt-0.5"
                    aria-hidden="true"
                  >
                    <Briefcase className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-sm font-bold text-[#0F1E36] dark:text-white leading-snug">
                      {t.home.careerCardTitle}
                    </p>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 leading-snug">
                      {t.home.careerCardCta}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-stretch">
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-bl-2xl rounded-br-2xl pl-4 pr-3 pb-4 pt-1 flex items-center gap-2.5 text-[#0F1E36] dark:text-slate-100">
                  <div className="flex -space-x-2 shrink-0" aria-hidden="true">
                    <GatewayImage
                      src={AVATAR_BARAKAT}
                      alt=""
                      className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                    />
                    <GatewayImage
                      src={AVATAR_ISABELLE}
                      alt=""
                      className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                    />
                    <GatewayImage
                      src={AVATAR_LUCAS}
                      alt=""
                      className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 object-cover"
                    />
                  </div>
                  <span className="text-xs font-bold text-[#0F1E36] dark:text-slate-100 tabular-nums whitespace-nowrap">
                    EN · አማ · OM
                  </span>
                </div>

                <div className="w-[58px] h-[56px] shrink-0 relative flex items-end justify-end">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 18 18"
                    fill="none"
                    className="absolute top-0 left-0 pointer-events-none text-white dark:text-slate-900"
                    aria-hidden="true"
                  >
                    <path d="M0 0 H18 A18 18 0 0 0 0 18 Z" fill="currentColor" />
                  </svg>
                  <button
                    type="button"
                    onClick={() => onNavigate('career')}
                    aria-label={t.home.careerCardCta}
                    className="w-12 h-12 rounded-full bg-amber-500 hover:bg-amber-400 text-[#0F1E36] flex items-center justify-center shadow-lg hover:scale-105 transition-all cursor-pointer"
                  >
                    <ArrowUpRight className="w-5 h-5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Two Clear Primary Destinations — Reference Card Grid Styling */}
      <section aria-label="Main choices" className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="h-44 w-full relative overflow-hidden bg-slate-100 dark:bg-slate-800">
              <GatewayImage
                src={ONBOARDING_CARD_IMAGE}
                alt=""
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3.5 left-3.5 bg-amber-500 text-[#0F1E36] text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm inline-flex items-center gap-1.5">
                <UserPlus className="w-3.5 h-3.5" aria-hidden="true" />
                <span>01</span>
              </span>
            </div>
            <div className="p-6 sm:p-7 space-y-2.5">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F1E36] dark:text-white">
                {t.home.onboardingCardTitle}
              </h2>
              <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                {t.home.onboardingCardBody}
              </p>
            </div>
          </div>
          <div className="px-6 sm:px-7 pb-6 sm:pb-7">
            <button
              type="button"
              onClick={() => onNavigate('onboarding', { partnerAssisted: false })}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-md text-base font-semibold transition-colors cursor-pointer dark:border dark:border-white/15"
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

        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
          <div>
            <div className="h-44 w-full relative overflow-hidden bg-slate-100 dark:bg-slate-800">
              <GatewayImage
                src={CAREER_CARD_IMAGE}
                alt=""
                className="w-full h-full object-cover"
              />
              <span className="absolute top-3.5 left-3.5 bg-[#0F1E36] text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow-sm inline-flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
                <span>02</span>
              </span>
            </div>
            <div className="p-6 sm:p-7 space-y-2.5">
              <h2 className="text-xl sm:text-2xl font-bold text-[#0F1E36] dark:text-white">
                {t.home.careerCardTitle}
              </h2>
              <p className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
                {t.home.careerCardBody}
              </p>
            </div>
          </div>
          <div className="px-6 sm:px-7 pb-6 sm:pb-7">
            <button
              type="button"
              onClick={() => onNavigate('career')}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto min-h-[48px] px-6 py-3 rounded-md text-base font-semibold transition-colors cursor-pointer dark:border dark:border-white/15"
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
          className="flex items-center justify-between gap-3 min-h-[60px] p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-start shadow-sm hover:border-[#1E3A5F] dark:hover:border-amber-400/60 hover:shadow-md transition-all cursor-pointer"
        >
          <span className="flex items-center gap-3 text-base font-semibold text-[#0F1E36] dark:text-white">
            <span className="w-10 h-10 rounded-lg bg-[#F3F4F6] dark:bg-slate-800 text-[#1E3A5F] dark:text-amber-400 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" aria-hidden="true" />
            </span>
            <span>{t.home.partnerModeCta}</span>
          </span>
          <ArrowUpRight className="w-4 h-4 text-[#1E3A5F] dark:text-amber-400 shrink-0" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('employer')}
          className="flex items-center justify-between gap-3 min-h-[60px] p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-start shadow-sm hover:border-[#1E3A5F] dark:hover:border-amber-400/60 hover:shadow-md transition-all cursor-pointer"
        >
          <span className="flex items-center gap-3 text-base font-semibold text-[#0F1E36] dark:text-white">
            <span className="w-10 h-10 rounded-lg bg-[#F3F4F6] dark:bg-slate-800 text-[#1E3A5F] dark:text-amber-400 flex items-center justify-center shrink-0">
              <Building2 className="w-5 h-5" aria-hidden="true" />
            </span>
            <span>{t.home.employerModeCta}</span>
          </span>
          <ArrowUpRight className="w-4 h-4 text-[#1E3A5F] dark:text-amber-400 shrink-0" aria-hidden="true" />
        </button>
      </section>

      {/* Plain-language Privacy & Access Promises — Deep Navy #0F1E36 Reference Block */}
      <section
        aria-labelledby="gw-promises-title"
        className="relative overflow-hidden rounded-2xl bg-[#0F1E36] dark:border dark:border-slate-800 text-white p-7 sm:p-10 shadow-lg space-y-6"
        style={{ backgroundColor: 'var(--gw-primary)', color: 'var(--gw-primary-text)' }}
      >
        <svg
          width="240"
          height="240"
          viewBox="0 0 100 100"
          fill="none"
          aria-hidden="true"
          className="absolute -right-8 -top-8 text-white/[0.04] pointer-events-none"
        >
          <path d="M36 5H64V36H95V64H64V95H36V64H5V36H36V5Z" fill="currentColor" />
        </svg>

        <div className="relative z-10 space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <ShieldCheck className="w-4 h-4 shrink-0" aria-hidden="true" />
            <span>WCAG 2.2 AA · Privacy-First</span>
          </div>
          <h2 id="gw-promises-title" className="text-2xl sm:text-3xl font-bold text-white">
            {t.home.promiseTitle}
          </h2>
        </div>

        <ul className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4">
          {t.home.promiseItems.map((item) => (
            <li
              key={item}
              className="rounded-xl bg-[#162947] border border-white/10 p-5 flex items-start gap-3 text-sm sm:text-base text-slate-100 leading-relaxed"
            >
              <CheckCircle2
                className="w-5 h-5 text-amber-400 shrink-0 mt-0.5"
                aria-hidden="true"
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};
