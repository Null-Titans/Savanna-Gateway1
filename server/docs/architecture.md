# Architecture Overview — Savanna Accessible Onboarding & Career Gateway

## 1. Executive Architectural Summary

The Savanna Accessible Onboarding & Career Gateway backend is architected as a high-integrity, modular monolith built on **TypeScript**, **Express**, and **Mongoose/MongoDB**. It provides a robust, multi-tenant digital gateway specifically optimized for vulnerable jobseekers and learners who may experience displacement or disabilities.

Privacy, safeguarding, non-discrimination, and autonomy are primary architectural invariants rather than afterthoughts.

```
+-----------------------------------------------------------------------------------+
|                              Client Layer (React / Vite)                         |
|  (Widget Web Component, Accessible Wizard, Public Job Board, Speech Interface)   |
+-----------------------------------------------------------------------------------+
                                      |
                         HTTP / REST (JSON API 3.1)
                                      v
+-----------------------------------------------------------------------------------+
|                         Server Middleware Gateway Pipeline                        |
|                                                                                   |
|  [RequestIdMiddleware] ---> [PinoHttp Logger (with Sensitive Field Redaction)]   |
|         |                                                                         |
|  [Helmet Security]     ---> [CORS Preflight & Origin Validation]                  |
|         |                                                                         |
|  [Rate Limiter]        ---> [Tenant Context Extraction & Isolation Helper]        |
|         |                                                                         |
|  [JWT Authentication]  ---> [RBAC Authorization & Privilege Enclosure]            |
|         |                                                                         |
|  [Zod Schema Validator]---> [Controller Route Execution]                         |
|         |                                                                         |
|  [Centralized Error Handler (Translates AppErrors & Zod into RFC-Compatible JSON)]|
+-----------------------------------------------------------------------------------+
                                      |
                  +-------------------+-------------------+
                  |                                       |
                  v                                       v
+-----------------------------------+   +-------------------------------------------+
|          Core Domain Modules      |   |       Speech Boundary Integration         |
|  - Organizations (Multi-Tenancy)  |   |  - Multilingual Speech-to-Text (STT)      |
|  - Authentication & JWT Rotation  |   |  - Neural Text-to-Speech (TTS, 24kHz WAV) |
|  - Accessible Onboarding Sessions |   |  - Afaan Oromo, Amharic & English Parsing |
|  - Career Gateway & Job Board     |   |  - Server-Isolated Gemini Credentials     |
|  - Privacy & Consent Audit Store  |   +-------------------------------------------+
+-----------------------------------+
                  |
                  v
+-----------------------------------------------------------------------------------+
|                           Persistence & Security Primitives                       |
|  - Authenticated AES-256-GCM Encryption (IV + Auth Tags + Key Ring Versioning)    |
|  - Deterministic SHA-256 Search Indexing (Without Plaintext Decryption)           |
|  - Compound Indexed MongoDB Collections Scoped by organizationId                  |
+-----------------------------------------------------------------------------------+
```

---

## 2. Directory & Modular Monolith Layout

```
server/
├── api/
│   ├── openapi.yaml               # Canonical OpenAPI 3.1 specification
│   └── frontend-contract.md       # Frontend adapter integration guide
├── docs/
│   ├── architecture.md            # Modular architecture and lifecycle
│   ├── data-model.md              # Schemas, relationships, and indexes
│   ├── security-and-privacy.md    # Threat model, safeguarding, AES-GCM
│   └── integration-guide.md       # Frontend integration and speech boundary
├── src/
│   ├── config/                    # Environment, security, database configs
│   ├── middleware/                # Auth, RBAC, tenantContext, validation, errors
│   ├── modules/
│   │   ├── authentication/        # User model, token rotation, auth routes
│   │   ├── consent/               # Informed consent records and audit logging
│   │   ├── jobs/                  # Job listings, applications, privacy views
│   │   ├── onboarding/            # Sessions, draft recovery, walled support
│   │   ├── organizations/         # Multi-tenant branding, settings, apiKeys
│   │   └── speech/                # Speech synthesis, recognition, assistant
│   ├── routes/                    # Versioned root (/api/v1) and health routes
│   ├── shared/                    # Logger, AppErrors, AES-256-GCM crypto utils
│   ├── types/                     # Express type augmentations and gateway models
│   ├── app.ts                     # Express application factory
│   └── server.ts                  # Server entrypoint and graceful shutdown
└── tests/
    ├── integration/               # Supertest API endpoint test suites
    └── unit/                      # Isolated crypto, env, safeguard unit tests
```

---

## 3. Multi-Tenant Architecture & Data Isolation

### 3.1 Tenant Resolution Order
Tenant context is resolved deterministically by [`tenantContextMiddleware`](file:///c:/ALX/accessible-onboarding-career-gateway/server/src/middleware/tenantContext.ts):
1. **Explicit Request Headers**: `X-Organization-Id`, `X-Tenant-Id`, or `X-Organization-Slug`.
2. **URL Parameters**: `?organizationId=` or `?orgSlug=`.
3. **Authenticated Principal**: In the absence of an explicit header, the tenant context is derived from `req.user.organizationId`.
4. **Subdomain Extraction**: If custom domain routing is configured (excluding raw IP addresses such as `127.0.0.1` and `localhost`).

### 3.2 Tenant Context Attachment
When validated, a typed `TenantContext` is attached to `req.tenant`:
- Organization status is verified (`active`). Suspended accounts are immediately rejected with `403 FORBIDDEN (ORGANIZATION_SUSPENDED)`.
- If a user is authenticated, cross-tenant modification is strictly forbidden unless the user carries the `PLATFORM_ADMIN` role.

### 3.3 Query Isolation Helpers
To eliminate the risk of developer error or data leakage across organizations:
```typescript
// Strict query filter construction
const filter = getTenantFilter(req); // { organizationId: ObjectId("...") }
// Safe query wrapper merging conditions with tenant scoping
const scopedQuery = withTenantScope(req, { status: 'published' });
```

---

## 4. Request Lifecycle & Pipeline Sequence

1. **Request Identification (`requestIdMiddleware`)**: Assigns or propagates `X-Request-Id` (UUIDv4) across headers.
2. **Structured Logging (`pinoHttp`)**: Injects request correlation ID and automatically redacts all sensitive fields (`password`, `token`, `phone`, `identityDocument`).
3. **Security Headers (`helmetMiddleware`)**: Applies strict CSP, HSTS, cross-origin resource policy, and frameguard headers.
4. **CORS Validation (`corsMiddleware`)**: Enforces whitelist origins, allows custom headers (`X-Organization-Id`, `X-Api-Key`, `X-Draft-Token`), and exposes trace headers.
5. **Rate Limiting (`standardLimiter`)**: Safeguards against brute-force attacks and abuse.
6. **Body Parsing**: Parses JSON payloads with a strict 10MB limit.
7. **Route Dispatching**: Directs traffic to `/health`, `/api/speech`, or versioned `/api/v1/*` routers.
8. **Centralized Error Handling (`errorHandler`)**: Catches operational `AppError` instances, Mongoose duplicate key errors, and Zod validation issues, formatting responses consistently without leaking internal stack traces.
