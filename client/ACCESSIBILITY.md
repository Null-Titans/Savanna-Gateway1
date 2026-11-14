# Accessibility Report & WCAG 2.2 AA Checklist

## 1. Automated Tools & Verified Test Results

| Check | Command | Result |
| --- | --- | --- |
| TypeScript static checks | `npm run lint` | **Pass** (0 errors) |
| Component, Privacy, Safeguard & `axe-core` tests | `npm test` (`vitest run`) | **Pass** (9/9 tests passed; 0 `axe-core` violations on Main Gateway) |
| Production + Web Component build | `npm run build` | **Pass** (Web Component `119.71 kB` gzipped, Initial app `148.12 kB` gzipped) |
| Playwright keyboard-only + `@axe-core/playwright` | `npm run test:e2e` | **Not run in sandbox** (`chromium` binary not installed; requires `npx playwright install` in CI/local) |

## 2. WCAG 2.2 AA Checklist

| Criterion / Requirement | Status | Implementation Notes |
| --- | --- | --- |
| Skip to main content link | Pass | `SkipLink` renders first focusable link targeting `#gw-main-content` |
| Visible focus indicator (≥ 2px, ≥ 3:1 contrast) | Pass | `3px solid #1d4ed8` with `2px` offset in `tokens.css` |
| Focus not obscured (2.4.11) | Pass | `scroll-padding-top: 112px` on `html`; sticky header kept at `56px` |
| Focus moves to step heading on step change | Pass | `useStepFocus` focuses `<h2 tabIndex={-1}>` on every step change |
| Persistent `<label>` on every field | Pass | All inputs & textareas use explicit `<label htmlFor>` |
| Error identification & summary (3.3.1 / 3.3.3) | Pass | Inline `role="alert"` + linked `ErrorSummary` using 3-part plain error messages |
| No automatic timeout (2.2.1) | Pass | Zero session/form timers; explicit notice shown above every step |
| Target size ≥ 44×44 CSS px (2.5.8) | Pass | Primary controls use `min-h-[44px]` or `min-h-[48px]` |
| Contrast ≥ 4.5:1 + Partner color auto-fallback (1.4.3) | Pass | `ensureAccessibleColor()` validates and auto-darkens failing partner hex colors |
| No color-only status or errors (1.4.1) | Pass | Icons + explicit text labels paired on every error, warning, and listening state |
| Reduced motion support (2.3.3) | Pass | `@media (prefers-reduced-motion: reduce)` disables non-essential transitions |
| Language attributes & Ethiopic fallback (3.1.1 / 3.1.2) | Pass | `document.documentElement.lang` and `dir` updated dynamically; Ethiopic font stack configured |
| Reflow at 400% zoom / 320px width (1.4.10) | Not tested manually | Responsive flex/grid classes implemented; requires browser verification at 400% zoom |

## 3. Manual Tests Still Required Before Production Sign-Off

The following manual audits have **NOT** been executed in this automated environment and must be confirmed by human testers:
1. **NVDA on Windows** (Chrome & Firefox): Verify Shadow DOM custom element navigation, live-region announcements during voice listening, and Amharic/English switching.
2. **TalkBack on Android** (Chrome + Android WebView): Verify touch-target ergonomics, low-end device responsiveness, and `SpeechSynthesis` behavior.
3. **400% Browser Zoom & 320px Reflow**: Confirm zero horizontal scrolling or clipped controls across all onboarding steps and job cards.
4. **Native Amharic, Afaan Oromo & Lived-Experience Review**: Translations in `src/i18n/locales/am.ts` and `src/i18n/locales/om.ts` are marked `needsNativeReview: true` and must be reviewed by native speakers and learners with lived experience of disability or low literacy.

## 4. Known Limitations

- **Neural Speech vs Offline Browser Fallback:** Full natural Amharic (`am`) and Afaan Oromo (`om`) speech synthesis and recognition use the server-side Gemini speech endpoints when `GEMINI_API_KEY` is configured on the server. When offline or unconfigured, browsers generally lack native `am-ET` or `om-ET` voices; the app enforces an anti-mismatch guard so an English voice is never used to mispronounce Amharic or Afaan Oromo, displays an honest availability notice, and preserves full manual typing and on-screen text reading.
- **Playwright Browser Binary:** End-to-end Playwright scripts (`e2e/gateway.spec.ts`) are written and ready, but browser binaries were not pre-installed in this container (`npx playwright install` required before running `npm run test:e2e`).
- **Backend Persistence & SMS:** Demo mode uses an in-memory mock adapter and opt-in IndexedDB (non-sensitive fields only). Real server persistence and SMS resume links require a live backend implementing `openapi.proposed.yaml`.
