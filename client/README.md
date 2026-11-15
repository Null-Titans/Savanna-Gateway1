# Accessible Onboarding & Career Gateway

A reusable, WCAG 2.2 AA–focused **Accessible Onboarding Kit** and **Accessible Career Gateway** built with React, TypeScript, Vite, and an isolated Shadow DOM Web Component (`<accessible-gateway>`).

> **Savanna Reference Note (Addendum A3):** The `Savanna-static-pages-main` ZIP files were not present in the workspace, so no Savanna internal files or private APIs were invented. Default theme tokens follow a clean, Savanna/ALX-compatible palette (`#0a2540` / `#0f766e`) alongside a live-switchable neutral partner theme (`#3730a3` / `#b45309`).

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:3000`:
- Standalone app: `http://localhost:3000/`
- Plain HTML host demo (zero React on host): `http://localhost:3000/demo-plain-html.html`
- Simulated Savanna LMS host demo (live event log): `http://localhost:3000/demo-savanna-host.html`

## Build & Bundle Budget Report (Addendum C1)

```bash
npm run build
```

Measured production Vite build output:
- **Embeddable Web Component (`public/accessible-gateway.js`)**: `440.61 kB` raw / **`119.71 kB` gzipped** (under 150 KB target; React + Shadow DOM styles self-contained).
- **Standalone Initial Onboarding Chunk (`dist/assets/index-*.js`)**: `510.79 kB` raw / **`148.12 kB` gzipped** (under 150 KB target).
- **Lazy-Loaded On-Demand Chunks**:
  - `CareerGateway`: `5.76 kB` gzipped
  - `am` (Amharic locale): `5.71 kB` gzipped
  - `EmployerAccommodationForm`: `3.72 kB` gzipped
  - `ThemeSwitcherDrawer`: `2.37 kB` gzipped
  - `JudgeChecklistPage`: `2.11 kB` gzipped

## Multilingual Voice Server (EN / AM / OM)

The development and production Express server (`server.ts` + `server/speechRouter.ts`) runs on port `3000` and handles:
- **Strictly Three Languages:** English (`en`), Amharic (`am` / አማርኛ), and Afaan Oromo (`om` / Afaan Oromoo).
- **Server-Side Neural Speech (`/api/speech/*`):** When `GEMINI_API_KEY` is configured in the server environment, `/api/speech/tts` (`gemini-3.8-flash-lite-tts`), `/api/speech/stt` (`gemini-3.5-transcribe`), and `/api/speech/assistant` (`gemini-4-hydrogen`) run server-side without exposing secrets to the browser.
- **Anti-Mismatch Voice Guard:** Browser fallback strictly checks for an authentic native voice matching the active language and never pronounces Amharic or Afaan Oromo with an English voice.

## Mock vs Real API Configuration

- Set `VITE_API_BASE_URL` (e.g. `https://api.example.org`) in `.env` to target a real backend matching `openapi.proposed.yaml` (marked `PROPOSED - backend to confirm`).
- When `VITE_API_BASE_URL` is unset, the app starts in **Demo mode (Mock)** with an explicit banner stating sample data is used and no data or SMS is sent to a real server.
- Switch live between **Demo Mode (Mock)** and **Real REST API** (and test simulated 3G network failures) inside **Partner Theme & API** in the top utility bar.

## Testing

```bash
npm run lint        # tsc --noEmit
npm test            # Vitest + Testing Library + axe-core
npm run test:core   # Plain Node core logic tests (no extra installs needed at runtime)
npm run test:e2e    # Playwright + @axe-core/playwright (requires: npx playwright install)
npx @axe-core/cli http://localhost:3000/demo-plain-html.html
```

---

## Track 1 Integration Reference (`<accessible-gateway>`)

### 1. Install & Embed

Include `/accessible-gateway.js` and mount `<accessible-gateway>` in any plain HTML page (`demo-plain-html.html`, `savanna/pages/profile.html`, `savanna/pages/jobs.html`):

```html
<script src="/accessible-gateway.js" defer></script>
<accessible-gateway
  tenant-key="SAVANNA_ALX_DEMO"
  module="onboarding"
  mode="self"
  theme="alx"
  lang="en"
  api-mode="mock"
></accessible-gateway>
```

### 2. Attributes

| Attribute | Values | Purpose |
| --- | --- | --- |
| `module` | `all`, `onboarding`, `profile`, `career`, `employer` | Selects which module renders initially. |
| `mode` | `self`, `partner`, `edit` | Starts self-registration, partner-assisted consent registration, or profile edit mode (`PATCH`). |
| `questions` | URL (e.g. `/questions/signup.json`, `/questions/job-apply.json`, `/questions/employer-accommodations.json`) | Loads a JSON question-file driven flow using the lazy `JsonQuestionFlow` engine. |
| `lang` | `en`, `am`, `om` | Sets UI language (`dir="rtl"` is supported automatically for RTL languages). |
| `api-mode` | `mock`, `real` | Uses `localStorage` / in-memory mock when empty (`mock`), or `fetch()` against `api-base-url`. |
| `api-base-url` | Origin URL | Base REST API origin when `api-mode="real"`. |

### 3. Events

Emits both existing `gateway:*` events and Track 1 `db-signup:*` CustomEvents (composed, bubbling out of Shadow DOM):

- `db-signup:step` — `{ step, of }` on every question transition.
- `db-signup:support` — `{ supportPreferences, timestamp }` dispatched separately from core profile creation.
- `db-signup:done` — `{ profile: { idRoute, ... }, receipt, timestamp }` (`profile.idRoute === 'partner-referral'` on no-document / partner referral).

### 4. REST API `curl` Examples

```bash
# Create learner profile
curl -X POST http://localhost:3000/api/v1/learners \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Abebe Bikila","contactMethod":"phone","contactValue":"+251911234567","identityRoute":"no_documents"}'

# Update learner profile (Edit mode)
curl -X PATCH http://localhost:3000/api/v1/learners/LRN-123 \
  -H "Content-Type: application/json" \
  -d '{"fullName":"Abebe Bikila","contactValue":"+251911234568"}'

# Save separate support preferences
curl -X PUT http://localhost:3000/api/v1/learners/LRN-123/support \
  -H "Content-Type: application/json" \
  -d '{"supportPreferences":["communication_assistance"],"supportNotes":"Interpreter preferred"}'

# Export learner profile JSON
curl http://localhost:3000/api/v1/learners/LRN-123/export

# Delete learner profile
curl -X DELETE http://localhost:3000/api/v1/learners/LRN-123
```

### 5. Adding a New Language (e.g. Arabic `dir="rtl"`)

1. Add one locale file in `src/i18n/locales/ar.ts` matching `TranslationDictionary` (with `needsNativeReview: true` until reviewed by a native speaker).
2. Register it in `src/i18n/index.ts` and `LANGUAGE_REGISTRY` (`dir: 'rtl'`, `speechLangTag: 'ar-SA'`) when ready to expose in the dropdown. Logical CSS utilities (`margin-inline`, `padding-inline`, `text-start`) mirror automatically for `dir="rtl"`.

### 6. Offline & Slow-3G Resilience

- Typed/selected answers stay in component state (and sanitized non-sensitive fields save to IndexedDB/localStorage only when the user confirms the device is **not** shared).
- Listening to `offline` / `online` announces connection drops in plain words inside the ARIA `LiveRegion` and retries pending submissions automatically when connectivity returns.
- Heavy optional modules (`CareerGateway`, `EmployerAccommodationForm`, `JsonQuestionFlow`, `VoiceAssistantPanel`) are code-split and lazy-loaded only when opened.

