import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { app } from '../../src/app.js';

describe('Integration: Health Check Infrastructure', () => {
  it('GET /health returns 200 with operational status, system metrics, and database probe', async () => {
    const res = await request(app).get('/health');

    expect(res.status).toBe(200);
    expect(['ok', 'degraded']).toContain(res.body.status);
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('database');
    expect(res.body.database).toHaveProperty('connected');
    expect(res.body.database).toHaveProperty('state');
    expect(res.headers).toHaveProperty('x-request-id');
  });

  it('GET /api/v1/health returns 200 through versioned API gateway router', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(['ok', 'degraded']).toContain(res.body.status);
    expect(res.body.database).toBeDefined();
  });

  it('GET /api/v1 metadata discovery root returns valid operational endpoints list', async () => {
    const res = await request(app).get('/api/v1');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name', 'Accessible Onboarding & Career Gateway API');
    expect(res.body).toHaveProperty('version', 'v1');
    expect(res.body.endpoints).toHaveProperty('health', '/api/v1/health');
    expect(res.body.endpoints).toHaveProperty('capabilities', '/api/v1/capabilities');
    expect(res.body.endpoints).toHaveProperty('jobs', '/api/v1/jobs');
  });
});
