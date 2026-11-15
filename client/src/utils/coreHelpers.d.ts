import { OnboardingDraft } from '../types/gateway';
import { SanitizedLocalDraft } from './indexedDbDrafts';

export function normalizeEthiopianPhone(raw: string): string | null;
export function formatEthiopianDate(input?: Date | string | number): string;
export function computeStepTransition(params: {
  currentStepIndex: number;
  totalFormSteps: number;
  isReviewStep: boolean;
  action: 'next' | 'back' | 'skip' | 'goto';
  targetStepIndex?: number;
}): {
  stepIndex: number;
  isReviewStep: boolean;
  step: number;
  of: number;
};
export function sanitizeDraftPayload(draft: Partial<OnboardingDraft>): SanitizedLocalDraft;
export function restoreDraftPayload(
  raw: string | Record<string, unknown> | null | undefined
): Omit<SanitizedLocalDraft, 'excludedSensitiveNotice'> | null;
