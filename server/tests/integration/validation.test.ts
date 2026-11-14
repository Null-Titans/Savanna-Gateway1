import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('Integration: Request Validation Middleware', () => {
  it('returns formatted 400 response with VALIDATION_ERROR code on invalid body schema', async () => {
    // Missing required fields on auth registration
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        email: 'invalid-email-format',
        password: 'short', // Too short
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toHaveProperty('code', 'VALIDATION_ERROR');
    expect(res.body.error.message).toMatch(/validation failed/i);
    expect(Array.isArray(res.body.error.details)).toBe(true);
    expect(res.body.error.details.length).toBeGreaterThanOrEqual(2);

    const emailError = res.body.error.details.find((d: { field?: string }) => d.field === 'email');
    expect(emailError).toBeDefined();
  });

  it('returns standard 400 on malformed raw JSON request bodies', async () => {
    const res = await request(app)
      .post('/api/v1/onboarding/submissions')
      .set('Content-Type', 'application/json')
      .send('{"invalidJson": unquotedValue}');

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('MALFORMED_JSON');
    expect(res.body.message).toMatch(/malformed json/i);
  });

  it('rejects invalid registrationMode enum values with descriptive detail', async () => {
    const res = await request(app)
      .post('/api/v1/onboarding/sessions')
      .send({
        isSharedDevice: false,
        registrationMode: 'unsupported_mode_xyz',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    const modeIssue = res.body.error.details.find(
      (d: { field?: string }) => d.field === 'registrationMode'
    );
    expect(modeIssue).toBeDefined();
  });
});
