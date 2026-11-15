import { describe, it, expect } from 'vitest';
import { AuthService } from '../../src/modules/authentication/auth.service.js';
import { User } from '../../src/modules/authentication/user.model.js';
import { Organization } from '../../src/modules/organizations/organization.model.js';
import mongoose from 'mongoose';
import { RefreshToken } from '../../src/modules/authentication/refreshToken.model.js';
import { ForbiddenError, UnauthorizedError } from '../../src/shared/errors/index.js';
import { hashSha256 } from '../../src/shared/utils/crypto.js';

/** Helper to create a test organization and user */
async function createUserAndOrg() {
  const org = await Organization.create({
    name: 'Test Org',
    slug: `test-org-${new mongoose.Types.ObjectId().toHexString()}`,
    branding: {},
    settings: {},
    status: 'active',
  });
  const password = 'Password123!';
  const user = await User.create({
    email: `user_${new mongoose.Types.ObjectId().toHexString()}@example.com`,
    passwordHash: await User.hashPassword(password),
    firstName: 'Test',
    lastName: 'User',
    role: 'ORGANIZATION_MEMBER',
    organizationId: org._id,
    status: 'active',
    lastLoginAt: new Date(),
  });
  return { user, org, password };
}

describe('Concurrent refresh token rotation', () => {
  it('second request using same raw token does not revoke the newly issued token', async () => {
    const { user, password } = await createUserAndOrg();

    // Simulate login to obtain refresh token
    const loginResult = await AuthService.login({ email: user.email, password, organizationId: user.organizationId?.toString() });
    const rawRefresh = loginResult.tokens.refreshToken;

    // Fire two concurrent refreshes using the same raw token
    const firstPromise = AuthService.refreshTokens(rawRefresh);
    const secondPromise = AuthService.refreshTokens(rawRefresh);

    const results = await Promise.allSettled([firstPromise, secondPromise]);

    // One should be fulfilled, the other rejected with TOKEN_REUSE_DETECTED (ForbiddenError)
    const fulfilled = results.filter(r => r.status === 'fulfilled') as PromiseFulfilledResult<any>[];
    const rejected = results.filter(r => r.status === 'rejected') as PromiseRejectedResult[];

    expect(fulfilled).toHaveLength(1);
    expect(rejected).toHaveLength(1);
    const rejectReason = rejected[0].reason;
    expect(rejectReason).toBeInstanceOf(ForbiddenError);
    expect(rejectReason.code).toBe('TOKEN_REUSE_DETECTED');

    // After a reuse detection, the entire family is revoked, so the newly issued token must be invalidated.
    const newRefresh = fulfilled[0].value.refreshToken;
    await expect(AuthService.refreshTokens(newRefresh)).rejects.toMatchObject({
      code: 'TOKEN_REUSE_DETECTED',
    });
  });
});

describe('Refresh token error code distinctions', () => {
  it('missing token', async () => {
    await expect(AuthService.refreshTokens('')).rejects.toMatchObject({
      code: 'MISSING_REFRESH_TOKEN',
    });
  });

  it('malformed token (nonâ€‘string)', async () => {
    // @ts-ignore deliberately passing wrong type
    await expect(AuthService.refreshTokens(123 as any)).rejects.toMatchObject({
      code: 'MISSING_REFRESH_TOKEN',
    });
  });

  it('invalid token', async () => {
    await expect(AuthService.refreshTokens('invalid.random.token')).rejects.toMatchObject({
      code: 'INVALID_REFRESH_TOKEN',
    });
  });

  it('expired token', async () => {
    const { user, password } = await createUserAndOrg();
    // Create a refresh token session with a past expiration date
    const plain = 'expiredtoken123';
    const tokenHash = hashSha256(plain);
    const past = new Date();
    past.setDate(past.getDate() - 10);
    await RefreshToken.create({
      userId: user._id,
      organizationId: user.organizationId,
      tokenHash,
      family: 'expiredfamily',
      isRevoked: false,
      expiresAt: past,
    });
    await expect(AuthService.refreshTokens(plain)).rejects.toMatchObject({
      code: 'REFRESH_TOKEN_EXPIRED',
    });
  });

  it('revoked token (logout)', async () => {
    const { user, password } = await createUserAndOrg();
    const login = await AuthService.login({ email: user.email, password, organizationId: user.organizationId?.toString() });
    const raw = login.tokens.refreshToken;
    // Revoke via logout
    await AuthService.logout(raw);
    await expect(AuthService.refreshTokens(raw)).rejects.toMatchObject({
      code: 'INVALID_REFRESH_TOKEN',
    });
  });
});

describe('Family revocation isolation', () => {
  it('revoking one user family does not affect another user', async () => {
    const { user: userA } = await createUserAndOrg();
    const { user: userB } = await createUserAndOrg();

    const loginA = await AuthService.login({ email: userA.email, password: 'Password123!', organizationId: userA.organizationId?.toString() });
    const loginB = await AuthService.login({ email: userB.email, password: 'Password123!', organizationId: userB.organizationId?.toString() });

    // Trigger reuse detection on user A's token
    const rawA = loginA.tokens.refreshToken;
    await AuthService.refreshTokens(rawA); // first rotation succeeds
    await expect(AuthService.refreshTokens(rawA)).rejects.toMatchObject({ code: 'TOKEN_REUSE_DETECTED' });

    // User B's token should still be valid
    const rawB = loginB.tokens.refreshToken;
    const resultB = await AuthService.refreshTokens(rawB);
    expect(resultB).toHaveProperty('accessToken');
  });
});

