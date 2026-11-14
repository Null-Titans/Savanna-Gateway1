import { ThemeConfig, ValidatedTheme } from '../types/gateway';
import { ensureAccessibleColor } from '../utils/contrast';

export const PRESET_THEMES: Record<string, ThemeConfig> = {
  alx: {
    id: 'alx',
    organizationName: 'Savanna / ALX Learning',
    logoText: 'Savanna Gateway',
    primaryColor: '#0a2540',
    secondaryColor: '#0f766e',
    fontFamily: '"GatewaySans", "GatewayEthiopic", "Noto Sans Ethiopic", system-ui, sans-serif',
    defaultLanguage: 'en',
    introText: 'Simple, step-by-step registration and accessible career opportunities.',
  },
  neutral: {
    id: 'neutral',
    organizationName: 'Civic Open Learning Partner',
    logoText: 'OpenPath Portal',
    primaryColor: '#3730a3',
    secondaryColor: '#b45309',
    fontFamily: '"GatewaySans", "GatewayEthiopic", "Noto Sans Ethiopic", system-ui, sans-serif',
    defaultLanguage: 'en',
    introText: 'Independent, accessible onboarding for universities, NGOs, and training centers.',
  },
};

export function validateTheme(theme: ThemeConfig): ValidatedTheme {
  const primaryCheck = ensureAccessibleColor(theme.primaryColor, '#0a2540', 4.5);
  const secondaryCheck = ensureAccessibleColor(theme.secondaryColor, '#0f766e', 4.5);

  const warnings: string[] = [];
  if (primaryCheck.reason) warnings.push(primaryCheck.reason);
  if (secondaryCheck.reason) warnings.push(secondaryCheck.reason);

  return {
    ...theme,
    effectivePrimary: primaryCheck.effectiveColor,
    effectivePrimaryText: primaryCheck.textColorOnFill,
    effectiveSecondary: secondaryCheck.effectiveColor,
    effectiveSecondaryText: secondaryCheck.textColorOnFill,
    primaryAdjusted: primaryCheck.adjusted,
    secondaryAdjusted: secondaryCheck.adjusted,
    primaryContrastRatio: primaryCheck.contrastWithWhite,
    secondaryContrastRatio: secondaryCheck.contrastWithWhite,
    warnings,
  };
}
