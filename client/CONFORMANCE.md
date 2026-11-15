# Accessibility Conformance Report (WCAG 2.2 AA) — Track 1

**Component:** `<accessible-gateway>` (with `db-signup:*` events, onboarding, profile edit, and career gateway)  
**Target Standard:** W3C WCAG 2.2 Level A & Level AA  
**Evaluation Method:** Automated `axe-core` audit, keyboard walkthrough, unit tests (`vitest` & `node:test`), and code review.

## WCAG 2.2 AA Criteria Table

| Criterion | Status | Notes |
| --- | --- | --- |
| 1.1.1 Non-text Content | Supports | Decorative icons carry `aria-hidden="true"`; interactive icon buttons provide explicit `aria-label` or visible text. |
| 1.2.1 Audio-only and Video-only | Supports | Non-autoplaying `<audio controls>` voice-note fallback includes text/transcript review alongside playback. |
| 1.3.1 Info and Relationships | Supports | Real semantic headings (`h1`/`h2`/`h3`), `<fieldset>`/`<legend>`, `<label for>`, native `<button>` and `<a>` elements (no clickable `<div>`s). |
| 1.3.2 Meaningful Sequence | Supports | Logical DOM order matches visual reading flow in both LTR and RTL-ready containers (`margin-inline`, `padding-inline`). |
| 1.3.5 Identify Input Purpose | Supports | `autocomplete="name"`, `autocomplete="tel"`, `autocomplete="email"` used on personal/contact fields. |
| 1.4.1 Use of Color | Supports | Validation errors, active filters, and privacy badges combine color with text and icons. |
| 1.4.3 Contrast (Minimum) | Supports | Contrast guardrail (`ensureAccessibleColor`) enforces >= 4.5:1 on partner colors; verified with `axe-core`. |
| 1.4.4 Resize Text | Supports | `rem` typography, Ethiopic `line-height: 1.7`, and optional Simple View (`.gw-easy-read`) scaling. |
| 1.4.10 Reflow (200% / 400% Zoom) | Supports | Single-column flexible grids (`grid-cols-1`) reflow without horizontal scrolling at 320 CSS px and 200%+ zoom. |
| 1.4.11 Non-text Contrast | Supports | Borders, inputs, and custom radio/checkbox cards use 2px high-contrast boundaries and `3px` `:focus-visible` outlines. |
| 1.4.12 Text Spacing | Supports | Responsive containers and `line-height: 1.7` for Amharic prevent clipping when user stylesheets override spacing. |
| 2.1.1 Keyboard | Supports | Every action uses native `<button>`, `<a>`, `<input>`, `<select>`, and `Escape` closes modal dialogs and drawers. |
| 2.1.2 No Keyboard Trap | Supports | Focus moves cleanly through steps, dialogs, and drawers; background scroll lock releases cleanly on close. |
| 2.2.1 Timing Adjustable | Supports | Zero session timeouts or inactivity timers. Typed/spoken answers remain until submitted or cleared. |
| 2.4.1 Bypass Blocks | Supports | `<SkipLink>` targets `#gw-main-content` directly above navigation. |
| 2.4.3 Focus Order | Supports | `useStepFocus` moves focus to each step heading (`tabIndex={-1}`) on forward/back navigation. |
| 2.4.6 Headings and Labels | Supports | Every form step has a visible question heading and associated label; no placeholder-only labels. |
| 2.4.7 Focus Visible | Supports | High-contrast `3px solid` `:focus-visible` outline inside Shadow DOM (`tokens.css`). |
| 2.4.11 Focus Not Obscured (Minimum) | Supports | `scroll-padding-top` accounts for the sticky header height. |
| 2.5.8 Target Size (Minimum) | Supports | Interactive controls enforce `min-height: 44px` (`--gw-touch-min: 44px`). |
| 3.1.1 / 3.1.2 Language of Page & Parts | Supports | `dir` and `lang` synchronize with active i18n dictionary (`en`, `am`, `om`). |
| 3.2.1 / 3.2.2 On Focus / On Input | Supports | No automatic navigation or context jumps on input changes. |
| 3.3.1 / 3.3.3 Error Identification & Suggestion | Supports | `ErrorSummary` (`role="alert"`) explains what happened, why, and how to fix in plain language. |
| 3.3.7 Redundant Entry | Supports | Edit mode (`<accessible-gateway mode="edit">`) preloads saved answers; Job Apply prefills applicant info from onboarding. |
| 4.1.2 Name, Role, Value | Supports | Native controls with `aria-pressed`, `aria-expanded`, `aria-current="page"`, and `role="dialog"`. |
| 4.1.3 Status Messages | Supports | `<LiveRegion>` announces draft saves, offline/online network transitions, and filter changes politely. |

## Manual Co-Designer Accessibility Testing Log

> Leave blank below for co-designer sign-off during usability and assistive technology sessions.

| Who tested | Device / Browser / Assistive Tech | What worked well | What they could not do (issues found) |
| --- | --- | --- | --- |
| | | | |
| | | | |
| | | | |
