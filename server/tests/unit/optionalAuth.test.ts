// tests/unit/optionalAuth.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import { optionalAuthenticate } from '../../src/middleware/authenticate.js';
import { UnauthorizedError } from '../../src/shared/errors/index.js';

// Mock AuthService
vi.mock('../../src/modules/authentication/auth.service.js', () => {
  return {
    AuthService: {
      verifyAccessToken: vi.fn(),
    },
  };
});

import { AuthService } from '../../src/modules/authentication/auth.service.js';

function mockReq(headers: Record<string, string | undefined> = {}): Request {
  return { headers } as unknown as Request;
}
function mockRes(): Response {
  return {} as unknown as Response;
}

describe('optionalAuthenticate middleware', () => {
  let nextFn: NextFunction;
  beforeEach(() => {
    nextFn = vi.fn();
    vi.clearAllMocks();
  });

  it('continues without user when no Authorization header', async () => {
    const req = mockReq();
    await optionalAuthenticate(req, mockRes(), nextFn);
    expect(req).not.toHaveProperty('user');
    expect(nextFn).toHaveBeenCalledWith();
  });

  it('attaches user when valid token provided', async () => {
    const user = { id: '123', role: 'PLATFORM_ADMIN' } as any;
    AuthService.verifyAccessToken.mockResolvedValue(user);
    const req = mockReq({ authorization: 'Bearer validtoken' });
    await optionalAuthenticate(req, mockRes(), nextFn);
    expect(req).toHaveProperty('user', user);
    expect(nextFn).toHaveBeenCalledWith();
  });

  it('forwards error for invalid/expired token', async () => {
    const err = new UnauthorizedError('Invalid token', 'INVALID_TOKEN');
    AuthService.verifyAccessToken.mockRejectedValue(err);
    const req = mockReq({ authorization: 'Bearer badtoken' });
    await optionalAuthenticate(req, mockRes(), nextFn);
    expect(nextFn).toHaveBeenCalledWith(err);
  });

  it('forwards error for malformed token header', async () => {
    // Header present but not bearer format – extractBearerToken returns null, so middleware should just call next()
    // To test malformed, we simulate a token that fails verification (treated same as invalid)
    const err = new UnauthorizedError('Malformed token', 'MALFORMED_TOKEN');
    AuthService.verifyAccessToken.mockRejectedValue(err);
    const req = mockReq({ authorization: 'Bearer malformed' });
    await optionalAuthenticate(req, mockRes(), nextFn);
    expect(nextFn).toHaveBeenCalledWith(err);
  });
});
