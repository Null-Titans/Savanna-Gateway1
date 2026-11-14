# Integration Guide (`<accessible-gateway>`)

## 1. Plain HTML Website (Zero React on Host)

Add the compiled Web Component script once and place `<accessible-gateway>` anywhere in your HTML. All styles are encapsulated inside Shadow DOM so host CSS never breaks the component and component CSS never leaks into your page.

```html
<script src="/accessible-gateway.js" defer></script>

<accessible-gateway
  tenant-key="PUBLIC_TENANT_KEY"
  module="onboarding"
  theme="alx"
  lang="en"
  api-mode="mock"
  demo="true"
></accessible-gateway>
```

Live reference demos included in this repository:
- `/demo-plain-html.html` — Plain third-party HTML page with conflicting Georgia serif and button styles.
- `/demo-savanna-host.html` — Simulated Savanna host with live attribute controls and event log.

## 2. React Host Website

Import and render the `<accessible-gateway>` element after calling `registerAccessibleGatewayElement()` (or loading the script bundle):

```tsx
import { useEffect, useRef } from 'react';
import { registerAccessibleGatewayElement } from './src/web-component/AccessibleGatewayElement';

registerAccessibleGatewayElement();

export function PartnerPage() {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onSubmitted = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      console.log('Onboarding completed:', detail);
    };
    el.addEventListener('gateway:onboarding-submitted', onSubmitted);
    return () => el.removeEventListener('gateway:onboarding-submitted', onSubmitted);
  }, []);

  return (
    <accessible-gateway
      ref={ref}
      tenant-key="UNIVERSITY_PARTNER_01"
      theme="neutral"
      org-name="Addis Open University"
      primary-color="#1e3a8a"
      secondary-color="#0f766e"
      module="all"
      lang="en"
      api-mode="real"
      api-base-url="https://api.example.org"
      demo="false"
    />
  );
}
```

## 3. Supported Attributes

| Attribute | Values | Default | Notes |
| --- | --- | --- | --- |
| `tenant-key` | string | `PUBLIC_TENANT_KEY` | Public tenant identifier (never pass private secrets) |
| `module` | `all` \| `onboarding` \| `career` \| `employer` | `all` | Controls the initial active module |
| `theme` | `alx` \| `neutral` | `alx` | Partner theme preset |
| `org-name` | string | Theme default | Overrides displayed partner organization & logo title |
| `primary-color` | hex color | Theme default | Validated against WCAG 2.2 AA (4.5:1); auto-darkens if contrast fails |
| `secondary-color` | hex color | Theme default | Validated against WCAG 2.2 AA (4.5:1); auto-darkens if contrast fails |
| `intro-text` | string | Theme default | Optional plain-language welcome paragraph |
| `lang` | `en` \| `am` \| `om` | `en` | Active UI language (`en` English, `am` Amharic, `om` Afaan Oromo; `am` and `om` lazy-load on demand) |
| `api-mode` | `mock` \| `real` | `mock` | Explicit Mock vs REST adapter switch |
| `api-base-url` | URL string | `""` | Overrides `VITE_API_BASE_URL` for REST requests |
| `demo` | `true` \| `false` | `true` | Hides Judge Checklist when `false` |

## 4. Custom Events & Privacy Guarantees

All custom events bubble and set `composed: true` so host listeners receive them across the Shadow DOM boundary.

**Strict Privacy Rule:** Event payloads NEVER contain private support preference categories, support notes, or identity reference numbers unless the learner explicitly consents and the host requires them.

| Event Name | Payload Type |
| --- | --- |
| `gateway:onboarding-started` | `{ tenantKey: string, language: string, timestamp: string }` |
| `gateway:step-changed` | `{ flow: 'onboarding' \| 'job_application', stepId: string, stepIndex: number, totalSteps: number }` |
| `gateway:draft-saved` | `{ storage: 'memory_only' \| 'device_indexeddb' \| 'server_saved', sensitiveExcluded: boolean, timestamp: string }` |
| `gateway:onboarding-submitted` | `{ submissionId: string, mode: 'mock' \| 'real', registrationMode: 'self' \| 'partner_assisted', identityRoute: string, supportRequestedFlag: boolean }` |
| `gateway:support-requested` | `{ hasSupportRequest: boolean }` (only boolean flag by default) |
| `gateway:job-applied` | `{ jobId: string, applicationId: string, mode: 'mock' \| 'real', sharedAccommodationConsent: boolean }` |
| `gateway:error` | `{ code: string, message: string, recoverable: boolean }` |
