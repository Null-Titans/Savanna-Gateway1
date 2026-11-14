import React from 'react';
import { createRoot, Root } from 'react-dom/client';
import gatewayCss from '../index.css?inline';
import { GatewayShell } from '../app/GatewayShell';
import { PRESET_THEMES } from '../config/themes';
import { GatewayModule, SupportedLanguage, ThemeConfig } from '../types/gateway';
import { ApiMode } from '../services/api/client';

const OBSERVED_ATTRS = [
  'tenant-key',
  'module',
  'theme',
  'primary-color',
  'secondary-color',
  'org-name',
  'intro-text',
  'lang',
  'api-mode',
  'api-base-url',
  'demo',
] as const;

function ensureTailwindPropertiesRegistered(cssText: string): void {
  if (typeof document === 'undefined' || !document.head) return;
  if (document.querySelector('style[data-gw-tw-properties]')) return;
  const matches = cssText.match(/@property\s+--tw-[^{]+\{[^}]*\}/g);
  if (!matches || matches.length === 0) return;
  const propStyle = document.createElement('style');
  propStyle.setAttribute('data-gw-tw-properties', 'true');
  propStyle.textContent = matches.join('\n');
  document.head.appendChild(propStyle);
}

export class AccessibleGatewayElement extends HTMLElement {
  private shadowRootRef: ShadowRoot;
  private mountPoint: HTMLDivElement;
  private reactRoot: Root | null = null;

  static get observedAttributes() {
    return [...OBSERVED_ATTRS];
  }

  constructor() {
    super();
    ensureTailwindPropertiesRegistered(gatewayCss);
    this.shadowRootRef = this.attachShadow({ mode: 'open' });

    const styleEl = document.createElement('style');
    styleEl.textContent = gatewayCss;

    this.mountPoint = document.createElement('div');
    this.mountPoint.setAttribute('part', 'gateway-root');

    this.shadowRootRef.appendChild(styleEl);
    this.shadowRootRef.appendChild(this.mountPoint);
  }

  connectedCallback() {
    if (!this.reactRoot) {
      this.reactRoot = createRoot(this.mountPoint);
    }
    this.renderComponent();
  }

  disconnectedCallback() {
    if (this.reactRoot) {
      this.reactRoot.unmount();
      this.reactRoot = null;
    }
  }

  attributeChangedCallback() {
    if (this.reactRoot) {
      this.renderComponent();
    }
  }

  private resolveModule(): GatewayModule {
    const attr = (this.getAttribute('module') || 'all').toLowerCase();
    if (attr === 'onboarding') return 'onboarding';
    if (attr === 'career') return 'career';
    if (attr === 'employer') return 'employer';
    return 'home';
  }

  private resolveTheme(): ThemeConfig {
    const presetKey = (this.getAttribute('theme') || 'alx').toLowerCase();
    const base = PRESET_THEMES[presetKey] || PRESET_THEMES.alx;
    const orgName = this.getAttribute('org-name');
    const primaryColor = this.getAttribute('primary-color');
    const secondaryColor = this.getAttribute('secondary-color');
    const introText = this.getAttribute('intro-text');

    return {
      ...base,
      organizationName: orgName || base.organizationName,
      logoText: orgName || base.logoText,
      primaryColor: primaryColor || base.primaryColor,
      secondaryColor: secondaryColor || base.secondaryColor,
      introText: introText || base.introText,
    };
  }

  private renderComponent() {
    if (!this.reactRoot) return;
    const tenantKey = this.getAttribute('tenant-key') || 'PUBLIC_TENANT_KEY';
    const langAttr = (this.getAttribute('lang') || 'en') as SupportedLanguage;
    const apiMode = (this.getAttribute('api-mode') || 'mock') as ApiMode;
    const apiBaseUrl = this.getAttribute('api-base-url') || '';
    const isDemoMode = this.getAttribute('demo') !== 'false';

    this.reactRoot.render(
      <React.StrictMode>
        <GatewayShell
          tenantKey={tenantKey}
          initialModule={this.resolveModule()}
          initialTheme={this.resolveTheme()}
          initialLanguage={langAttr}
          initialApiMode={apiMode}
          initialApiBaseUrl={apiBaseUrl}
          isDemoMode={isDemoMode}
          hostElement={this}
        />
      </React.StrictMode>
    );
  }
}

export function registerAccessibleGatewayElement(tagName = 'accessible-gateway'): void {
  if (typeof customElements !== 'undefined' && !customElements.get(tagName)) {
    customElements.define(tagName, AccessibleGatewayElement);
  }
}
