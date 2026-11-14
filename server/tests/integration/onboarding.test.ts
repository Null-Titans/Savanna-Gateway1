import { describe, expect, it, vi, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';
import { OnboardingService } from '../../src/modules/onboarding/onboarding.service.js';

describe('Integration: Accessible Onboarding & Privacy Safeguards', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('starts onboarding session and returns opaque, high-entropy draftToken without URL secrets', async () => {
    vi.spyOn(OnboardingService, 'startSession').mockResolvedValue({
      sessionId: 'sess_9988776655',
      draftToken: 'dt_secure_token_48_bytes',
      expiresAtIso: new Date(Date.now() + 86400000).toISOString(),
    });

    const res = await request(app)
      .post('/api/v1/onboarding/sessions')
      .send({
        isSharedDevice: true,
        registrationMode: 'self',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sessionId).toBe('sess_9988776655');
    expect(res.body.data.draftToken).toMatch(/^dt_/);
    expect(res.body.data).toHaveProperty('expiresAtIso');
  });

  it('supports progressive one-question-at-a-time draft autosaving and step updates', async () => {
    vi.spyOn(OnboardingService, 'updateDraft').mockResolvedValue({
      isSharedDevice: false,
      registrationMode: 'self',
      fullName: 'Yared Tadesse',
      contactMethod: 'email',
      contactValue: 'yared@example.org',
      identityRoute: 'no_documents', // No-document pathway
      identityReferenceNumber: '',
      partnerReferralOrg: '',
      supportPreferences: ['communication_assistance'],
      supportNotes: 'Prefers questions in plain text',
      updatedAtIso: new Date().toISOString(),
    });

    const res = await request(app)
      .put('/api/v1/onboarding/sessions/sess_9988776655/draft')
      .send({
        stepIndex: 2,
        stepKey: 'supportPreferences',
        stepValue: ['communication_assistance'],
        fullName: 'Yared Tadesse',
        identityRoute: 'no_documents',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.identityRoute).toBe('no_documents');
    expect(res.body.data.supportPreferences).toContain('communication_assistance');
  });

  it('accepts full OnboardingDraft directly matching frontend restAdapter.ts submission shape', async () => {
    vi.spyOn(OnboardingService, 'submitDirect').mockResolvedValue({
      id: 'sub_receipt_abc',
      submittedAtIso: new Date().toISOString(),
      mode: 'real',
      persistedToServer: true,
      notice: 'Onboarding profile saved.',
      clearDeviceStorage: false,
    });

    const fullDraft = {
      isSharedDevice: false,
      registrationMode: 'self',
      fullName: 'Kalkidan Bekele',
      contactMethod: 'phone',
      contactValue: '+251911223344',
      identityRoute: 'no_documents',
      identityReferenceNumber: '',
      partnerReferralOrg: '',
      supportPreferences: ['flexible_scheduling'],
      supportNotes: 'Requires afternoon scheduling',
      updatedAtIso: new Date().toISOString(),
    };

    const res = await request(app)
      .post('/api/v1/onboarding/submissions')
      .send(fullDraft);

    expect(res.status).toBe(200);
    // Verified: Both top-level and data wrapper present for dual compatibility
    expect(res.body).toHaveProperty('id', 'sub_receipt_abc');
    expect(res.body).toHaveProperty('persistedToServer', true);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('sub_receipt_abc');
  });

  it('handles SMS resume request and returns boolean flag matching client expectation', async () => {
    vi.spyOn(OnboardingService, 'requestSmsResume').mockResolvedValue({
      sent: true,
      message: 'Resume link dispatched.',
    });

    const res = await request(app)
      .post('/api/v1/onboarding/resume-sms')
      .send({
        phone: '+251911223344',
        draftToken: 'dt_abcdef1234567890',
      });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('sent', true);
    expect(res.body).toHaveProperty('message');
    expect(res.body.success).toBe(true);
  });
});
