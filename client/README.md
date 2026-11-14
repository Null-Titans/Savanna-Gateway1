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
npm run test:e2e    # Playwright + @axe-core/playwright (requires: npx playwright install)
```
