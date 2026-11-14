export interface AppEnvConfig {
  apiBaseUrl: string;
  isDemoMode: boolean;
  defaultApiMode: 'mock' | 'real';
}

export function getEnvConfig(): AppEnvConfig {
  const rawBase =
    (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) || '';
  const apiBaseUrl = String(rawBase).trim().replace(/\/+$/, '');
  return {
    apiBaseUrl,
    isDemoMode: true,
    defaultApiMode: apiBaseUrl ? 'real' : 'mock',
  };
}
