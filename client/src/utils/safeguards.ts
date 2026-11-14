export interface SafeguardViolation {
  field: string;
  matchedTerm: string;
  guidance: string;
}

const PROHIBITED_MEDICAL_PATTERNS: Array<{ pattern: RegExp; label: string }> = [
  { pattern: /\b(diagnosis|diagnoses|diagnosed)\b/i, label: 'diagnosis' },
  { pattern: /\b(medical\s+proof|medical\s+certificate|doctor'?s?\s+note|physician\s+letter)\b/i, label: 'medical proof' },
  { pattern: /\b(disability\s+certificate|disability\s+card|disability\s+type|disability\s+category)\b/i, label: 'disability type or certificate' },
  { pattern: /\b(prove\s+your\s+disability|proof\s+of\s+disability|icd-?10|medical\s+records?)\b/i, label: 'medical records or proof' },
  { pattern: /\b(state\s+your\s+condition|name\s+your\s+illness|disclose\s+your\s+disability)\b/i, label: 'forced disclosure' },
];

export function checkEmployerTextSafeguards(
  fields: Record<string, string>
): SafeguardViolation[] {
  const violations: SafeguardViolation[] = [];
  for (const [field, value] of Object.entries(fields)) {
    if (!value) continue;
    for (const rule of PROHIBITED_MEDICAL_PATTERNS) {
      const match = value.match(rule.pattern);
      if (match) {
        violations.push({
          field,
          matchedTerm: match[0],
          guidance: `Do not ask applicants for "${rule.label}". Describe the support or workplace adjustment your team offers instead.`,
        });
      }
    }
  }
  return violations;
}
