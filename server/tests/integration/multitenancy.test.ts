import { describe, expect, it, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { Organization } from '../../src/modules/organizations/organization.model.js';
import { User } from '../../src/modules/authentication/user.model.js';

describe('Integration: Multi-Tenancy & Isolation Safeguards', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects access to tenant routes when active tenant context cannot be resolved', async () => {
    const adminToken = jwt.sign(
      {
        sub: '507f191e810c19729de860ea',
        email: 'admin@example.org',
        role: 'ORGANIZATION_ADMIN',
        firstName: 'Amina',
        lastName: 'Ahmed',
      },
      env.JWT_SECRET,
      { expiresIn: '15m', issuer: 'savanna-career-gateway', audience: 'savanna-api-consumers' }
    );

    vi.spyOn(User, 'findById').mockReturnValue({
      select: vi.fn().mockResolvedValue({
        _id: '507f191e810c19729de860ea',
        email: 'admin@example.org',
        role: 'ORGANIZATION_ADMIN',
        status: 'active',
      }),
    } as unknown as ReturnType<typeof User.findById>);

    // No X-Organization-Id header and no organizationId on user
    const res = await request(app)
      .get('/api/v1/organizations/current')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TENANT_CONTEXT_REQUIRED');
  });

  it('prevents cross-tenant access when user organizationId does not match requested tenant', async () => {
    const userOrgId = '507f1f77bcf86cd799439011';
    const foreignOrgId = '507f1f77bcf86cd799439099';

    const token = jwt.sign(
      {
        sub: '507f191e810c19729de860ea',
        email: 'org1@example.org',
        role: 'ORGANIZATION_ADMIN',
        organizationId: userOrgId,
        firstName: 'User',
        lastName: 'One',
      },
      env.JWT_SECRET,
      { expiresIn: '15m', issuer: 'savanna-career-gateway', audience: 'savanna-api-consumers' }
    );

    vi.spyOn(User, 'findById').mockReturnValue({
      select: vi.fn().mockResolvedValue({
        _id: '507f191e810c19729de860ea',
        email: 'org1@example.org',
        role: 'ORGANIZATION_ADMIN',
        organizationId: userOrgId,
        status: 'active',
      }),
    } as unknown as ReturnType<typeof User.findById>);

    vi.spyOn(Organization, 'findBySlugOrId').mockResolvedValue({
      _id: foreignOrgId,
      name: 'Foreign Organization',
      slug: 'foreign-org',
      status: 'active',
      branding: { theme: 'light', primaryColor: '#2563EB' },
      settings: { supportedLanguages: ['en'], defaultLanguage: 'en' },
    } as unknown as Awaited<ReturnType<typeof Organization.findBySlugOrId>>);

    const res = await request(app)
      .get('/api/v1/organizations/current')
      .set('Authorization', `Bearer ${token}`)
      .set('X-Organization-Id', foreignOrgId);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('CROSS_TENANT_ACCESS_FORBIDDEN');
  });

  it('rejects suspended tenant accounts immediately with 403 Forbidden', async () => {
    const targetOrgId = '507f1f77bcf86cd799439022';

    vi.spyOn(Organization, 'findBySlugOrId').mockResolvedValue({
      _id: targetOrgId,
      name: 'Suspended Org',
      slug: 'suspended-org',
      status: 'suspended',
    } as unknown as Awaited<ReturnType<typeof Organization.findBySlugOrId>>);

    const res = await request(app)
      .get('/api/v1/organizations/public-config')
      .set('X-Organization-Id', targetOrgId);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ORGANIZATION_SUSPENDED');
  });
});
