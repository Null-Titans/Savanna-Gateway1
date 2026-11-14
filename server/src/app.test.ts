import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { app } from './app.js';

describe('Savanna Gateway Core Application Infrastructure', () => {
  it('GET /health returns 200 with system metrics and database connectivity', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
    expect(res.body).toHaveProperty('database');
    expect(res.body.database).toHaveProperty('connected');
    expect(res.body.database).toHaveProperty('state');
    expect(res.headers).toHaveProperty('x-request-id');
  });

  it('GET /api/v1/health returns 200 via versioned router', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('database');
  });

  it('GET /api/v1 returns 200 with service metadata', async () => {
    const res = await request(app).get('/api/v1');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('name');
    expect(res.body).toHaveProperty('version', 'v1');
    expect(res.body).toHaveProperty('endpoints');
  });

  it('Returns standard 404 format on unknown routes', async () => {
    const res = await request(app).get('/api/v1/non-existent-route-endpoint');
    expect(res.status).toBe(404);
    expect(res.body).toEqual({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Cannot GET /api/v1/non-existent-route-endpoint',
        details: [],
      },
      message: 'Cannot GET /api/v1/non-existent-route-endpoint',
    });
  });

  it('Propagates or generates X-Request-Id header', async () => {
    const customId = 'b1b51079-58b9-4a0f-90db-3a8309df5599';
    const res = await request(app).get('/health').set('X-Request-Id', customId);
    expect(res.headers['x-request-id']).toBe(customId);
  });
});
