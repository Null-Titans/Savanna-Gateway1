const capturedScriptSrc: string | null = (() => {
  if (typeof document === 'undefined') return null;
  const current = document.currentScript as HTMLScriptElement | null;
  return current?.src || null;
})();

function normalizeRelativeAssetPath(assetPath: string): string {
  return assetPath.replace(/^\/+/, '').replace(/^\.\//, '');
}

function getWebComponentScriptBase(): string | null {
  if (typeof document === 'undefined') return null;
  const src =
    capturedScriptSrc ||
    document.querySelector<HTMLScriptElement>('script[src*="accessible-gateway"]')?.src ||
    null;
  if (!src) return null;
  try {
    return new URL('.', src).href;
  } catch {
    return null;
  }
}

export function resolveAssetUrl(assetPath: string): string {
  const cleanPath = normalizeRelativeAssetPath(assetPath);

  const scriptBase = getWebComponentScriptBase();
  if (scriptBase) {
    try {
      return new URL(cleanPath, scriptBase).href;
    } catch {
      // Fall through to Vite/location resolution
    }
  }

  const baseUrl =
    (typeof import.meta !== 'undefined' &&
      (import.meta as { env?: { BASE_URL?: string } }).env?.BASE_URL) ||
    './';

  if (typeof window !== 'undefined' && window.location?.href && window.location.href !== 'about:blank') {
    try {
      const resolvedBase = new URL(baseUrl, window.location.href);
      return new URL(cleanPath, resolvedBase).href;
    } catch {
      // Fall through to root-relative fallback
    }
  }

  return `/${cleanPath}`;
}

export function getAssetCandidates(assetPath: string): string[] {
  const cleanPath = normalizeRelativeAssetPath(assetPath);
  const candidates = [
    resolveAssetUrl(cleanPath),
    `/${cleanPath}`,
    `./${cleanPath}`,
    `/public/${cleanPath}`,
  ];
  return Array.from(new Set(candidates));
}
