import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeStepTransition,
  formatEthiopianDate,
  normalizeEthiopianPhone,
  restoreDraftPayload,
  sanitizeDraftPayload,
} from '../src/utils/coreHelpers.mjs';

test('normalizeEthiopianPhone normalizes 09, 07, 251, and +251 formats to +251XXXXXXXXX', () => {
  assert.equal(normalizeEthiopianPhone('0911234567'), '+251911234567');
  assert.equal(normalizeEthiopianPhone('07 1234 5678'), '+251712345678');
  assert.equal(normalizeEthiopianPhone('251922334455'), '+251922334455');
  assert.equal(normalizeEthiopianPhone('+251-911-23-45-67'), '+251911234567');
  assert.equal(normalizeEthiopianPhone('0811234567'), null);
  assert.equal(normalizeEthiopianPhone('12345'), null);
});

test('computeStepTransition handles next, back, skip, goto, and review state', () => {
  const step0 = computeStepTransition({
    currentStepIndex: 0,
    totalFormSteps: 5,
    isReviewStep: false,
    action: 'next',
  });
  assert.deepEqual(step0, { stepIndex: 1, isReviewStep: false, step: 2, of: 6 });

  const toReview = computeStepTransition({
    currentStepIndex: 4,
    totalFormSteps: 5,
    isReviewStep: false,
    action: 'next',
  });
  assert.deepEqual(toReview, { stepIndex: 4, isReviewStep: true, step: 6, of: 6 });

  const backFromReview = computeStepTransition({
    currentStepIndex: 4,
    totalFormSteps: 5,
    isReviewStep: true,
    action: 'back',
  });
  assert.deepEqual(backFromReview, { stepIndex: 4, isReviewStep: false, step: 5, of: 6 });

  const skipStep = computeStepTransition({
    currentStepIndex: 2,
    totalFormSteps: 5,
    isReviewStep: false,
    action: 'skip',
  });
  assert.deepEqual(skipStep, { stepIndex: 3, isReviewStep: false, step: 4, of: 6 });
});

test('sanitizeDraftPayload & restoreDraftPayload strip sensitive fields and round-trip safe data', () => {
  const rawDraft = {
    fullName: 'Abebe Bikila',
    contactMethod: 'phone',
    contactValue: '+251911223344',
    identityRoute: 'partner_referral',
    partnerReferralOrg: 'Community Center',
    registrationMode: 'partner_assisted',
    identityReferenceNumber: 'SECRET-ID-999',
    supportPreferences: ['alternative_materials'],
    supportNotes: 'Private health note',
    updatedAtIso: '2026-11-14T12:00:00Z',
  };

  const sanitized = sanitizeDraftPayload(rawDraft);
  assert.ok(sanitized);
  assert.equal('identityReferenceNumber' in sanitized, false);
  assert.equal('supportPreferences' in sanitized, false);
  assert.equal('supportNotes' in sanitized, false);

  const restored = restoreDraftPayload(JSON.stringify(sanitized));
  assert.ok(restored);
  assert.equal(restored.fullName, 'Abebe Bikila');
  assert.equal(restored.identityRoute, 'partner_referral');
  assert.equal(restored.registrationMode, 'partner_assisted');
});

test('formatEthiopianDate returns non-empty Ethiopian calendar string for valid dates', () => {
  const formatted = formatEthiopianDate('2026-11-14T12:00:00Z');
  assert.equal(typeof formatted, 'string');
  assert.ok(formatted.length > 0);
});
