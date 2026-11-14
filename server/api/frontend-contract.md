# Frontend API Contract — Accessible Onboarding & Career Gateway

> **Audience:** Frontend team (AI Studio).  
> **Status:** Canonical reference for backend REST API integration.  
> **OpenAPI source of truth:** [`docs/api/openapi.yaml`](./openapi.yaml) — TypeScript types must track that spec.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Environment Configuration](#2-environment-configuration)
3. [Standard Response Shapes](#3-standard-response-shapes)
4. [Capability Negotiation](#4-capability-negotiation)
5. [Widget Configuration](#5-widget-configuration)
6. [Onboarding Flow](#6-onboarding-flow)
7. [Job Discovery](#7-job-discovery)
8. [Job Applications](#8-job-applications)
9. [Partner Referral](#9-partner-referral)
10. [Error Handling](#10-error-handling)
11. [Authentication — Org Users](#11-authentication--org-users)
12. [TypeScript Types Reference](#12-typescript-types-reference)
13. [Speech Endpoints (Existing, Unchanged)](#13-speech-endpoints-existing-unchanged)

---

## 1. Overview

| Property | Value |
|---|---|
| **Base URL** | `{VITE_API_BASE_URL}/api/v1` |
| **API Version** | `v1` |
| **Content-Type** | `application/json` (all requests and responses) |
| **Breaking changes** | Increments to `v2`; `v1` and `v2` are supported in parallel during the migration window |
| **Auth (authenticated routes)** | `Authorization: Bearer <token>` header |
| **Widget key** | Public opaque string — passed as a path param or query param; **never grants admin access** |

> [!IMPORTANT]
> Every request body **must** include `Content-Type: application/json`. Requests without it will receive a `400 VALIDATION_ERROR`.

---

## 2. Environment Configuration

The frontend adapter layer switches between a local **MockAdapter** (no network calls, demo data) and a **RestAdapter** (real HTTP) based on runtime configuration.

### VITE environment variable

| `VITE_API_BASE_URL` set? | Adapter used | Behaviour |
|---|---|---|
| **Not set / empty** | `MockAdapter` | All API calls are fulfilled locally; no network requests are made. Use for demo/offline mode. |
| **Set** (e.g. `https://api.example.com`) | `RestAdapter` | All API calls are real HTTP requests to `{VITE_API_BASE_URL}/api/v1`. |

```env
# .env.development — mock mode
# VITE_API_BASE_URL=

# .env.production — real backend
VITE_API_BASE_URL=https://api.example.com
```

### Web component runtime override

The embedded widget web component exposes an `api-mode` HTML attribute that overrides the env-var switch at runtime without a rebuild:

```html
<!-- Force mock mode regardless of env -->
<gateway-widget api-mode="mock" widget-key="wk_..."></gateway-widget>

<!-- Force real mode -->
<gateway-widget api-mode="real" widget-key="wk_..."></gateway-widget>
```

> [!NOTE]
> `api-mode` takes precedence over `VITE_API_BASE_URL`. When `api-mode` is omitted, the env-var rule applies.

---

## 3. Standard Response Shapes

### 3.1 Success — single resource

Data is returned **directly** (not wrapped in a `data` envelope):

```jsonc
// GET /api/v1/jobs/:jobId — 200 OK
{
  "id": "job_abc123",
  "title": "Accessibility Specialist",
  "organization": "Acme Corp",
  // ... rest of JobPosting fields
}
```

### 3.2 Success — paginated list

```typescript
interface PaginatedList<T> {
  items: T[];
  total: number;       // total matching records (before pagination)
  hasMore: boolean;    // true if there are more pages
  nextCursor?: string; // opaque cursor for the next page; absent on last page
}
```

```jsonc
// GET /api/v1/jobs?q=driver — 200 OK
{
  "items": [ /* JobPosting[] */ ],
  "total": 42,
  "hasMore": true,
  "nextCursor": "eyJpZCI6ImFiYzEyMyJ9"
}
```

> [!NOTE]
> Simple list endpoints (e.g. `GET /api/v1/jobs` without pagination parameters) may return a plain `JobPosting[]` array for backward compatibility. Check the per-endpoint documentation below.

### 3.3 Error

```typescript
interface ErrorResponse {
  error: string;                       // human-readable summary
  code: string;                        // machine-readable code (see §10)
  details?: Array<{
    field: string;                     // dot-notation field path
    message: string;                   // per-field error description
  }>;
}
```

```jsonc
// 400 Bad Request
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": [
    { "field": "contactValue", "message": "Must be a valid phone number" },
    { "field": "fullName",     "message": "Required" }
  ]
}
```

### 3.4 SubmissionReceipt

Returned by all submit/apply endpoints:

```typescript
interface SubmissionReceipt {
  id: string;                       // server-assigned submission ID
  submittedAtIso: string;           // ISO 8601 timestamp
  mode: 'mock' | 'real';            // which adapter processed the request
  persistedToServer: boolean;       // false in mock mode
  notice?: string;                  // optional human-readable notice for the user
}
```

```jsonc
{
  "id": "sub_7x9kQm",
  "submittedAtIso": "2026-11-14T10:30:00.000Z",
  "mode": "real",
  "persistedToServer": true,
  "notice": "Your application has been received. Expect a response within 5 business days."
}
```

---

## 4. Capability Negotiation

Call this endpoint **once on startup** (before rendering feature-gated UI) to discover which optional features the server has enabled.

### `GET /api/v1/capabilities`

**Auth:** None  
**Response:** `200 OK`

```typescript
interface Capabilities {
  serverDraftsEnabled: boolean; // whether session-based draft save/restore is on
  smsResumeEnabled: boolean;    // whether SMS resume-link delivery is on
}
```

```jsonc
{
  "serverDraftsEnabled": true,
  "smsResumeEnabled": false
}
```

**Usage pattern:**

```typescript
const caps = await api.getCapabilities();
if (!caps.serverDraftsEnabled) hideDraftSaveButton();
if (!caps.smsResumeEnabled)    hideSmsResumeOption();
```

---

## 5. Widget Configuration

### `GET /api/v1/widget/:widgetKey/config`

**Auth:** None — this is a **public** endpoint  
**Path param:** `widgetKey` — the opaque public key embedded in the host page's HTML attributes  
**Response:** `200 OK`

```typescript
interface WidgetConfig {
  organizationName: string;
  theme: string;                  // e.g. "default" | "high-contrast" | "branded"
  primaryColor: string;           // CSS hex color, e.g. "#1A73E8"
  secondaryColor: string;         // CSS hex color
  allowedModules: string[];       // e.g. ["onboarding", "jobs", "applications"]
  defaultLanguage: string;        // BCP-47 tag, e.g. "en", "am", "om"
  introText?: string;             // optional welcome copy shown at top of widget
  draftsEnabled: boolean;         // show draft-save UI
  smsEnabled: boolean;            // show SMS resume option
}
```

```jsonc
{
  "organizationName": "Addis Jobs Initiative",
  "theme": "high-contrast",
  "primaryColor": "#005F6B",
  "secondaryColor": "#F4A261",
  "allowedModules": ["onboarding", "jobs"],
  "defaultLanguage": "am",
  "introText": "ወደ የሥራ ፍለጋ ፖርታላችን እንኳን ደህና መጡ",
  "draftsEnabled": true,
  "smsEnabled": true
}
```

> [!IMPORTANT]
> `widgetKey` is a **public** identifier — it is safe to embed in HTML. It scopes configuration and data to an organization but **never** grants write, admin, or employer access.

---

## 6. Onboarding Flow

The recommended flow uses **sessions** (steps 1–4). A backward-compatible direct-submit route (step 5) is also supported.

### Privacy rules — read before implementing

> [!CAUTION]
> - **`identityReferenceNumber`** — sent in the submit body but **never stored raw** by the backend. Only a hashed reference is kept.
> - **`supportNotes`** — sent in the submit body but the backend stores only the boolean `hasSupportRequest`. The free-text notes are discarded server-side.
> - **Session draft** — encrypted server-side. The `sessionToken` returned on session creation **must be kept in memory only** — never write it to `localStorage`, `sessionStorage`, or cookies.

---

### Step 1 — Start a session

#### `POST /api/v1/onboarding/sessions`

**Auth:** None  
**Body:** None required (optionally include `widgetKey` and/or `referralCode`)

```jsonc
// Request body (optional)
{
  "widgetKey": "wk_live_abc123",
  "referralCode": "REF-XYZ-9981"
}
```

**Response:** `201 Created`

```typescript
interface SessionCreated {
  sessionId: string;
  sessionToken: string; // ⚠ keep IN MEMORY ONLY — never persist
  expiresAt: string;    // ISO 8601
}
```

```jsonc
{
  "sessionId": "sess_7kQm9pR",
  "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-11-14T16:54:00.000Z"
}
```

---

### Step 2 — Save a draft (autosave)

#### `PUT /api/v1/onboarding/sessions/:sessionId/draft`

**Auth:** `Authorization: Bearer <sessionToken>` (the in-memory token from step 1)  
**Body:** Partial `OnboardingDraft` — send only changed fields

```typescript
// Partial — all fields optional
interface OnboardingDraftPartial {
  isSharedDevice?: boolean;
  registrationMode?: string;
  fullName?: string;
  contactMethod?: 'phone' | 'email' | 'none';
  contactValue?: string;
  identityRoute?: string;
  identityReferenceNumber?: string; // ⚠ hashed server-side, never stored raw
  partnerReferralOrg?: string;
  supportPreferences?: string[];
  supportNotes?: string;             // ⚠ backend discards content, stores only hasSupportRequest
  partnerConsent?: boolean;
  updatedAtIso?: string;
}
```

**Response:** `200 OK`

```jsonc
{
  "saved": true,
  "savedAt": "2026-11-14T10:35:22.000Z"
}
```

---

### Step 3 — Submit the onboarding form

#### `POST /api/v1/onboarding/sessions/:sessionId/submit`

**Auth:** `Authorization: Bearer <sessionToken>`  
**Body:** Complete `OnboardingDraft`

```typescript
interface OnboardingDraft {
  isSharedDevice: boolean;
  registrationMode: string;
  fullName: string;
  contactMethod: 'phone' | 'email' | 'none';
  contactValue: string;
  identityRoute: string;
  identityReferenceNumber: string; // ⚠ hashed server-side
  partnerReferralOrg?: string;
  supportPreferences: string[];
  supportNotes?: string;           // ⚠ content discarded server-side
  partnerConsent?: boolean;
  updatedAtIso: string;
}
```

**Response:** `201 Created` → [`SubmissionReceipt`](#34-submissionreceipt)

---

### Step 4 — SMS resume link

#### `POST /api/v1/onboarding/resume-sms`

**Auth:** None  
**Body:**

```jsonc
{
  "phone": "+251911234567",
  "draftToken": "dft_abc987xyz"
}
```

**Response:** `200 OK`

```jsonc
{
  "sent": true,
  "message": "A resume link has been sent to your phone."
}
```

> [!NOTE]
> Only available when `smsResumeEnabled: true` from capabilities. Gate this UI behind that check.

---

### Step 5 — Direct submit (backward compatibility)

#### `POST /api/v1/onboarding/submissions`

**Auth:** None  
**Body:** Complete `OnboardingDraft` (same schema as step 3)  
**Response:** `201 Created` → [`SubmissionReceipt`](#34-submissionreceipt)

> [!NOTE]
> This route exists for backward compatibility with the original proposed spec. It bypasses session management entirely. Prefer the session-based flow (steps 1–3) for new implementations; it offers draft autosave and server-side encryption.

---

## 7. Job Discovery

### `GET /api/v1/jobs`

**Auth:** None  
**Query params:**

| Param | Type | Description |
|---|---|---|
| `q` | `string` | Free-text search across title, description, organization |
| `accommodations` | `string` | Comma-separated `AccommodationCategory` values (see below) |
| `cursor` | `string` | Pagination cursor from previous response |
| `limit` | `number` | Page size (default: 20, max: 100) |

**AccommodationCategory values:** `remote_work`, `flexible_hours`, `assistive_technology`, `accessible_workspace`, `sign_language`, `screen_reader_compatible`, `transport_support`, `job_coach`

> [!IMPORTANT]
> Accommodation filter params are processed **server-side for filtering only**. They are **never stored** against a user profile or session. Do not include them in any user-identifying context.

**Response:** `200 OK` — `JobPosting[]` (plain array, matching the existing proposed spec)

```typescript
interface JobPosting {
  id: string;
  title: string;
  organization: string;
  location: string;
  isRemote: boolean;
  employmentType: 'full_time' | 'part_time' | 'contract' | 'volunteer' | 'internship';
  descriptionSummary: string;
  requiredSkills: string[];
  accommodationCategories: AccommodationCategory[];
  accommodationsOffered: string;
  accommodationDetails: EmployerAccommodationDetails;
  applicationDeadline?: string; // ISO 8601 date
  postedAtIso: string;          // ISO 8601
  isDemoData: boolean;
}

interface EmployerAccommodationDetails {
  workEnvironmentAccessibility: string;
  remoteOrFlexibleArrangements: string;
  assistiveTechnologyAvailable: string;
  communicationOptions: string;
  interviewAccommodations: string;
  applicationProcessAccommodations: string;
  additionalSupportOffered: string;
}
```

---

### `GET /api/v1/jobs/:jobId`

**Auth:** None  
**Response:** `200 OK` → `JobPosting`  
**Errors:** `404 NOT_FOUND`

---

## 8. Job Applications

### Submit an application

#### `POST /api/v1/jobs/:jobId/applications`

**Auth:** None (or session token if available)  
**Body:**

```typescript
interface JobApplicationDraft {
  jobId: string;
  applicantName: string;
  contactValue: string;
  relevantExperience: string;
  shareAccommodationRequest: boolean;
  accommodationRequestNote?: string;
  explicitConsentToShare: boolean; // must be true if shareAccommodationRequest is true
}
```

**Response:** `201 Created` → [`SubmissionReceipt`](#34-submissionreceipt)

> [!CAUTION]
> `shareAccommodationRequest` and `accommodationRequestNote` are **never** forwarded to employer-facing views without explicit consent (`explicitConsentToShare: true`). Render a clear consent checkbox before this field is submitted as `true`.

---

### Get application status

#### `GET /api/v1/applications/:applicationId`

**Auth:** `Authorization: Bearer <sessionToken>` or `Bearer <learnerToken>`  
**Response:** `200 OK`

```jsonc
{
  "id": "app_mNpQ8r",
  "jobId": "job_abc123",
  "status": "under_review",
  "submittedAtIso": "2026-11-14T10:30:00.000Z",
  "updatedAtIso": "2026-11-14T12:00:00.000Z"
}
```

**Errors:** `401 UNAUTHORIZED`, `403 FORBIDDEN`, `404 NOT_FOUND`

---

### Update accommodation consent

#### `PUT /api/v1/applications/:applicationId/consent`

**Auth:** `Authorization: Bearer <sessionToken>` or `Bearer <learnerToken>`  
**Body:**

```jsonc
{
  "shareAccommodationRequest": true,
  "explicitConsentToShare": true
}
```

**Response:** `200 OK`

```jsonc
{
  "updated": true,
  "updatedAtIso": "2026-11-14T13:00:00.000Z"
}
```

---

## 9. Partner Referral

### Create a referral

#### `POST /api/v1/partners/referrals`

**Auth:** `X-Api-Key: <partnerApiKey>` (server-to-server; not from browser widget)  
**Body:**

```jsonc
{
  "applicantReference": "ext_ref_7891",
  "partnerOrganizationId": "org_partner_xyz",
  "metadata": {}
}
```

**Response:** `201 Created`

```typescript
interface ReferralCreated {
  referralId: string;
  referralCode: string; // include this in onboarding session creation (step 1)
  expiresAt: string;    // ISO 8601
}
```

```jsonc
{
  "referralId": "ref_GhJk3L",
  "referralCode": "REF-XYZ-9981",
  "expiresAt": "2026-11-21T10:54:00.000Z"
}
```

> [!NOTE]
> The `referralCode` is then passed as the `referralCode` body field when calling `POST /api/v1/onboarding/sessions` (§6 Step 1). This links the onboarding session to the referring partner organization.

---

## 10. Error Handling

### Error code table

| HTTP Status | `code` | Meaning | Frontend action |
|---|---|---|---|
| `400` | `VALIDATION_ERROR` | One or more fields failed validation | Display `details` array inline next to each field; do not navigate away |
| `401` | `UNAUTHORIZED` | Missing, expired, or malformed token | Redirect to login / restart session |
| `403` | `FORBIDDEN` | Valid token but insufficient scope | Show "you don't have permission" message; do not retry automatically |
| `404` | `NOT_FOUND` | Resource does not exist | Show "not found" UI; do not retry |
| `409` | `CONFLICT` | Duplicate resource (e.g. already applied) | Show specific conflict message from `error` field |
| `429` | `RATE_LIMITED` | Too many requests | Show "please slow down" message; implement exponential back-off (start: 1 s, max: 30 s) |
| `502` | `UPSTREAM_ERROR` | Speech/AI upstream service failure | Show "service temporarily unavailable" with retry button; log to telemetry |
| `503` | `SERVICE_UNAVAILABLE` | Backend not ready | Show "service temporarily unavailable" with retry button; do not hammer endpoint |

### Handling field-level errors (400)

```typescript
// Example: map details array to form state
function applyServerErrors(details: { field: string; message: string }[]) {
  for (const { field, message } of details) {
    formState.setError(field, { type: 'server', message });
  }
}
```

### Handling 429 / 502 / 503

Show a non-blocking toast or banner:

> _"We're having trouble connecting. Please try again in a moment."_

Do **not** surface raw error codes or stack traces to the user.

---

## 11. Authentication — Org Users

> [!NOTE]
> This section covers **organizational users only**: admins, employers, and partner staff who access the management dashboard. Embedded widget users authenticate via session tokens (§6 Step 1) — a completely separate flow.

### Login

#### `POST /api/v1/org/auth/login`

**Auth:** None  
**Body:**

```jsonc
{
  "email": "admin@organization.example",
  "password": "s3cur3P@ss!"
}
```

**Response:** `200 OK`

```typescript
interface OrgLoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds until accessToken expires
  user: {
    id: string;
    email: string;
    role: 'org_admin' | 'employer' | 'partner_staff';
    scopes: string[]; // e.g. ["jobs:read", "jobs:write", "applications:read"]
  };
}
```

> [!CAUTION]
> - Store `accessToken` **in memory only** (a React context, Zustand store, etc.). **Never** write it to `localStorage` or `sessionStorage`.
> - Store `refreshToken` in an **httpOnly cookie** (preferred) or in memory. Never in `localStorage`.
> - Org admin, employer, and partner staff JWT scopes are **distinct and non-interchangeable** — the backend enforces this.

---

### Refresh access token

#### `POST /api/v1/org/auth/refresh`

**Auth:** None  
**Body:**

```jsonc
{
  "refreshToken": "<refreshToken>"
}
```

**Response:** `200 OK`

```typescript
interface OrgRefreshResponse {
  accessToken: string;
  expiresIn: number;
}
```

Call this automatically when any authenticated request returns `401 UNAUTHORIZED` and you hold a valid refresh token. If the refresh also returns `401`, redirect to login.

---

### Logout

#### `POST /api/v1/org/auth/logout`

**Auth:** `Authorization: Bearer <accessToken>`  
**Body:**

```jsonc
{
  "refreshToken": "<refreshToken>"
}
```

**Response:** `204 No Content`

On receipt, clear all in-memory tokens and redirect to login.

---

## 12. TypeScript Types Reference

The canonical TypeScript types for all gateway entities live in the **frontend repo** at:

```
src/types/gateway.ts
```

> [!IMPORTANT]
> `src/types/gateway.ts` **must track** the backend OpenAPI specification at [`docs/api/openapi.yaml`](./openapi.yaml), which is the **single authoritative source of truth** for all schemas.
>
> When the OpenAPI spec changes, regenerate or manually update `gateway.ts` before shipping UI changes that depend on the new fields. A CI lint step should validate alignment.

Key types defined there (non-exhaustive):

| Type | Description |
|---|---|
| `OnboardingDraft` | Full onboarding form payload |
| `JobPosting` | Public job listing |
| `EmployerAccommodationDetails` | Nested accommodation detail block |
| `JobApplicationDraft` | Job application payload |
| `SubmissionReceipt` | Returned by all submit/apply endpoints |
| `Capabilities` | Server feature flags |
| `WidgetConfig` | Per-org widget configuration |
| `ErrorResponse` | Standard error envelope |
| `OrgLoginResponse` | Org user auth response |
| `ConsentRecord` | Consent audit trail record |

---

## 13. Speech Endpoints (Existing, Unchanged)

These endpoints are on **`/api/speech/*`** — note the **absence of `/v1/`** — and are already implemented. Do **not** route them through the versioned prefix.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/speech/capabilities` | Discover available speech features |
| `POST` | `/api/speech/tts` | Text-to-speech synthesis |
| `POST` | `/api/speech/stt` | Speech-to-text transcription |
| `POST` | `/api/speech/assistant` | Conversational assistant (voice) |
| `POST` | `/api/speech/detect-language` | Language detection from audio or text |

> [!NOTE]
> These routes are outside the `v1` versioning scheme and will not be incremented to `v2` on the same cadence. Treat them as a stable, separately-versioned sub-API.

---

*Last updated: 2026-11-14 — maintained by the backend team. File issues in the backend repo; do not edit this file directly in the frontend repo.*
