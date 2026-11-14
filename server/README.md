# Savanna Accessible Onboarding & Career Gateway — Backend Server

A multi-tenant, privacy-first Node.js/TypeScript backend for accessible onboarding, inclusive employment discovery, and multi-language speech integration (Amharic, Afaan Oromo, English).

---

## 1. Prerequisites

- **Node.js**: v20.x or v22.x LTS
- **npm**: v10.x or higher
- **MongoDB**: v6.0+ or MongoDB Atlas instance
- **Gemini API Key**: (Optional, for neural speech synthesis and recognition features)

---

## 2. Environment Setup

Copy `.env.example` to `.env`:

```powershell
cp .env.example .env
```

Key environment configuration variables:

```env
# Server Configuration
PORT=4000
NODE_ENV=development
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:3000

# Database
MONGODB_URI=mongodb://127.0.0.1:27017/savanna_gateway

# Cryptography & Authentication (Minimum 32 chars in production)
JWT_SECRET=dev_jwt_access_secret_32_characters_minimum_len
JWT_REFRESH_SECRET=dev_jwt_refresh_secret_32_characters_minimum_len
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef

# Speech AI Integration (Gemini)
GEMINI_API_KEY=your_gemini_api_key_here
```

---

## 3. Installation & Build

```powershell
# Install dependencies
npm install

# Type check without emitting files
npm run lint

# Compile TypeScript to dist/
npm run build
```

---

## 4. Running the Server

```powershell
# Development mode with hot-reloading (tsx watch)
npm run dev

# Production mode
npm start
```

The server binds to `http://localhost:4000` with API endpoints accessible under `/api/v1` and speech services under `/api/speech`.

---

## 5. Automated Test Suite

Run the full automated test suite using Vitest and Supertest:

```powershell
# Run all unit and integration tests
npm test

# Run tests in watch mode
npm run test:watch
```

---

## 6. Architecture & Documentation

Comprehensive architectural and integration documentation is available in `docs/`:
- [`docs/architecture.md`](docs/architecture.md) — Architectural overview, pipeline, and modular monolith design.
- [`docs/data-model.md`](docs/data-model.md) — Schemas, relationships, compound indexes, and tenant scoping.
- [`docs/security-and-privacy.md`](docs/security-and-privacy.md) — Threat model, AES-256-GCM encryption, and Addendum D4 safeguards.
- [`docs/integration-guide.md`](docs/integration-guide.md) — Frontend integration, dual-envelope response format, and speech boundary.
- [`api/openapi.yaml`](api/openapi.yaml) — Canonical OpenAPI 3.1 specification.
- [`api/frontend-contract.md`](api/frontend-contract.md) — Frontend REST adapter contract reference.
