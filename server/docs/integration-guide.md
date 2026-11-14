# Frontend Integration Guide — Savanna Career Gateway

This guide documents how the React/Vite frontend (and embedded Web Component widgets) communicates with the backend REST API.

---

## 1. Connecting the Frontend

The client switches between `MockAdapter` and `RestAdapter` based on the environment configuration:

```bash
# In client/.env.local (or client/.env.production):
VITE_API_BASE_URL=http://localhost:4000
```

When `VITE_API_BASE_URL` is set, `client/src/services/api/restAdapter.ts` handles all HTTP communication.

---

## 2. Common Request Headers

| Header | Usage | Example |
|---|---|---|
| `Content-Type` | Required for all POST / PUT requests | `application/json` |
| `Authorization` | JWT Bearer token for authenticated routes | `Bearer eyJhbGciOi...` |
| `X-Organization-Id` | Explicitly targets an organization tenant | `507f1f77bcf86cd799439011` |
| `X-Organization-Slug`| Identifies tenant by slug | `sunrise-staffing` |
| `X-Api-Key` | Integration key for server-to-server or widget | `pk_live_...` or `sk_live_...` |
| `X-Draft-Token` | One-time resume token for draft recovery | `dt_...` |
| `X-Request-Id` | Correlation ID (echoed back in response) | `uuid-v4` |

---

## 3. Dual-Envelope Response Format

All responses provide dual-envelope compatibility:
1. **Direct unnested top-level fields** (`id`, `title`, `serverDraftsEnabled`) so `restAdapter.ts` functions without modifications.
2. **Encapsulated API envelope** (`success: true`, `data: ...`, `meta: { ... }`) for enterprise API gateway compliance.

### Example Response:
```json
{
  "id": "sub_01HABC999",
  "submittedAtIso": "2026-11-14T17:35:00.000Z",
  "mode": "real",
  "persistedToServer": true,
  "notice": "Your onboarding profile has been saved.",
  "success": true,
  "data": {
    "id": "sub_01HABC999",
    "submittedAtIso": "2026-11-14T17:35:00.000Z",
    "mode": "real",
    "persistedToServer": true,
    "notice": "Your onboarding profile has been saved."
  },
  "meta": {
    "timestamp": "2026-11-14T17:35:00.000Z"
  }
}
```

---

## 4. Key Integration Flows

### 4.1 Onboarding Session & Progressive Draft
1. **Start Session**: `POST /api/v1/onboarding/sessions` with `{ isSharedDevice, registrationMode, widgetKey }`.
   - Returns `{ sessionId, draftToken, expiresAtIso }`.
2. **Save Question Step**: `PUT /api/v1/onboarding/sessions/:sessionId/draft` with `{ stepIndex, stepKey, stepValue, ...draftFields }`.
3. **Submit Session**: `POST /api/v1/onboarding/sessions/:sessionId/submit`.
4. **Direct Legacy Submission**: `POST /api/v1/onboarding/submissions` (accepts full `OnboardingDraft` payload).

### 4.2 Job Discovery & Accessible Applications
1. **Search Jobs**: `GET /api/v1/jobs?q=Frontend&accommodations=remote_flexible,flexible_hours`.
2. **Apply**: `POST /api/v1/jobs/:jobId/applications` with `JobApplicationDraft`.
   - `explicitConsentToShare: true` must be specified for employers to see the accommodation notes.

### 4.3 Speech Integration Boundary (`/api/speech/*`)
The speech endpoints are hosted directly at `/api/speech/*` (mirroring the client adapter's requests):

```typescript
// Discover capabilities
const caps = await fetch('/api/speech/capabilities').then(r => r.json());

// Synthesize Speech (Text-to-Speech)
const ttsResponse = await fetch('/api/speech/tts', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Akkam jirtu, nagaa kooti',
    language: 'om' // 'am' (Amharic) | 'om' (Oromo) | 'en' (English)
  })
});
const { audioBase64, mimeType } = await ttsResponse.json();

// Speech-to-Text (Transcription)
const sttResponse = await fetch('/api/speech/stt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    audioBase64: 'UklGRi...',
    mimeType: 'audio/webm',
    targetLanguage: 'am'
  })
});
const { transcript, detectedLanguage } = await sttResponse.json();
```
