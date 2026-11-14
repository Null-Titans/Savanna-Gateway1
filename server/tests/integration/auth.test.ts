import { describe, expect, it, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../../src/app.js';
import { env } from '../../src/config/env.js';
import { AuthService } from '../../src/modules/authentication/auth.service.js';
import { User } from '../../src/modules/authentication/user.model.js';
import { Organization } from '../../src/modules/organizations/organization.model.js';

describe('Integration: Authentication & Authorization Guards', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects access to /api/v1/auth/me when Authorization header is absent', async () => {
    const res = await request(app).get('/api/v1/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('MISSING_BEARER_TOKEN');
  });

  it('rejects access when provided an expired or forged JWT access token', async () => {
    const expiredToken = jwt.sign(
      { sub: 'usr_123', email: 'test@example.com', role: 'ORGANIZATION_MEMBER' },
      env.JWT_SECRET,
      { expiresIn: '-1s', issuer: 'savanna-career-gateway' }
    );

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(['TOKEN_EXPIRED', 'INVALID_TOKEN']).toContain(res.body.error.code);
  });

  it('allows access and returns authenticated profile for a valid token and active user', async () => {
    const mockUser = {
      _id: '507f191e810c19729de860ea',
      email: 'admin@inclusiveworks.org',
      firstName: 'Almaz',
      lastName: 'Kebede',
      role: 'ORGANIZATION_ADMIN' as const,
      organizationId: '507f1f77bcf86cd799439011',
      status: 'active',
    };

    vi.spyOn(User, 'findById').mockReturnValue({
      select: vi.fn().mockResolvedValue(mockUser),
    } as unknown as ReturnType<typeof User.findById>);

    vi.spyOn(Organization, 'findBySlugOrId').mockResolvedValue({
      _id: mockUser.organizationId,
      name: 'Inclusive Works',
      slug: 'inclusive-works',
      status: 'active',
      branding: { theme: 'light', primaryColor: '#2563EB' },
      settings: { supportedLanguages: ['en', 'am', 'om'], defaultLanguage: 'en' },
    } as unknown as Awaited<ReturnType<typeof Organization.findBySlugOrId>>);

    const validToken = jwt.sign(
      {
        sub: mockUser._id,
        email: mockUser.email,
        role: mockUser.role,
        organizationId: mockUser.organizationId,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
      },
      env.JWT_SECRET,
      { expiresIn: '15m', issuer: 'savanna-career-gateway', audience: 'savanna-api-consumers' }
    );

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${validToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toHaveProperty('email', 'admin@inclusiveworks.org');
    expect(res.body.data.user).toHaveProperty('role', 'ORGANIZATION_ADMIN');
  });

  it('enforces RBAC guards: blocks non-privileged members from employer application review', async () => {
    const memberToken = jwt.sign(
      {
        sub: '507f191e810c19729de860eb',
        email: 'learner@example.org',
        role: 'ORGANIZATION_MEMBER',
        firstName: 'Dawit',
        lastName: 'Haile',
      },
      env.JWT_SECRET,
      { expiresIn: '15m', issuer: 'savanna-career-gateway', audience: 'savanna-api-consumers' }
    );

    vi.spyOn(User, 'findById').mockReturnValue({
      select: vi.fn().mockResolvedValue({
        _id: '507f191e810c19729de860eb',
        email: 'learner@example.org',
        role: 'ORGANIZATION_MEMBER',
        status: 'active',
      }),
    } as unknown as ReturnType<typeof User.findById>);

    // Route requires ['PLATFORM_ADMIN', 'ORGANIZATION_ADMIN', 'EMPLOYER']
    const res = await request(app)
      .get('/api/v1/jobs/507f191e810c19729de860ec/applications')
      .set('Authorization', `Bearer ${memberToken}`);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INSUFFICIENT_ROLE');
  });
});
