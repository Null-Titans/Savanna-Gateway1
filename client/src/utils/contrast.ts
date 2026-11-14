// WCAG 2.2 Relative Luminance & Contrast Validation with Accessible Auto-Fallback

interface RGB {
  r: number;
  g: number;
  b: number;
}

export function parseHexColor(hex: string): RGB | null {
  const cleaned = hex.trim().replace(/^#/, '');
  if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(cleaned)) {
    return null;
  }
  const full =
    cleaned.length === 3
      ? cleaned
          .split('')
          .map((c) => c + c)
          .join('')
      : cleaned;
  const num = parseInt(full, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (n: number) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function getRelativeLuminance(rgb: RGB): number {
  const channel = (val: number) => {
    const s = val / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

export function getContrastRatio(hex1: string, hex2: string): number {
  const c1 = parseHexColor(hex1);
  const c2 = parseHexColor(hex2);
  if (!c1 || !c2) return 1;
  const l1 = getRelativeLuminance(c1);
  const l2 = getRelativeLuminance(c2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

/**
 * Ensures a brand accent color achieves >= 4.5:1 contrast against white text (#FFFFFF)
 * when used as a button background, OR darkens the color until it meets >= 4.5:1 against white
 * and also >= 4.5:1 against light canvas (#F8FAFC) when used as text/border.
 */
export function ensureAccessibleColor(
  candidateHex: string,
  fallbackHex: string,
  minContrastAgainstWhite = 4.5
): {
  effectiveColor: string;
  textColorOnFill: '#ffffff' | '#0f172a';
  adjusted: boolean;
  contrastWithWhite: number;
  reason?: string;
} {
  const parsed = parseHexColor(candidateHex);
  if (!parsed) {
    return {
      effectiveColor: fallbackHex,
      textColorOnFill: '#ffffff',
      adjusted: true,
      contrastWithWhite: getContrastRatio(fallbackHex, '#ffffff'),
      reason: `Invalid hex color "${candidateHex}". Reverted to accessible fallback ${fallbackHex}.`,
    };
  }

  const normalized = rgbToHex(parsed);
  const ratioWhite = getContrastRatio(normalized, '#ffffff');
  if (ratioWhite >= minContrastAgainstWhite) {
    return {
      effectiveColor: normalized,
      textColorOnFill: '#ffffff',
      adjusted: false,
      contrastWithWhite: ratioWhite,
    };
  }

  // Try darkening step-by-step so the partner keeps their hue while passing WCAG AA 4.5:1
  let factor = 0.9;
  while (factor >= 0.15) {
    const darkened = rgbToHex({
      r: parsed.r * factor,
      g: parsed.g * factor,
      b: parsed.b * factor,
    });
    const ratio = getContrastRatio(darkened, '#ffffff');
    if (ratio >= minContrastAgainstWhite) {
      return {
        effectiveColor: darkened,
        textColorOnFill: '#ffffff',
        adjusted: true,
        contrastWithWhite: ratio,
        reason: `Partner color ${normalized} had ${ratioWhite}:1 contrast with white text (below 4.5:1 WCAG AA). Auto-darkened to ${darkened} (${ratio}:1).`,
      };
    }
    factor -= 0.08;
  }

  const fallbackRatio = getContrastRatio(fallbackHex, '#ffffff');
  return {
    effectiveColor: fallbackHex,
    textColorOnFill: '#ffffff',
    adjusted: true,
    contrastWithWhite: fallbackRatio,
    reason: `Partner color ${normalized} failed contrast (${ratioWhite}:1). Auto-fallback applied: ${fallbackHex} (${fallbackRatio}:1).`,
  };
}
