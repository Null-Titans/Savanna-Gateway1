import { describe, expect, it } from 'vitest';
import { envSchema } from '../../src/config/env.js';

describe('Unit: Environment Configuration Schema Validation', () => {
  it('parses valid environment configurations with appropriate defaults', () => {
    const rawEnv = {
      NODE_ENV: 'test',
      PORT: '5000',
      MONGODB_URI: 'mongodb://localhost:27017/test_db',
    };

    const parsed = envSchema.safeParse(rawEnv);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.PORT).toBe(5000);
      expect(parsed.data.NODE_ENV).toBe('test');
      expect(parsed.data.API_PREFIX).toBe('/api/v1');
      expect(parsed.data.JWT_SECRET).toBeDefined();
    }
  });

  it('fails validation when PORT is out of valid network range', () => {
    const invalidPortEnv = {
      PORT: '80', // Below minimum 1024
      NODE_ENV: 'development',
    };

    const parsed = envSchema.safeParse(invalidPortEnv);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const portIssue = parsed.error.issues.find((i) => i.path.includes('PORT'));
      expect(portIssue).toBeDefined();
      expect(portIssue?.message).toMatch(/between 1024 and 65535/i);
    }
  });

  it('fails validation when LOG_LEVEL has an unrecognized severity value', () => {
    const invalidLogEnv = {
      PORT: '3000',
      LOG_LEVEL: 'verbose_invalid',
    };

    const parsed = envSchema.safeParse(invalidLogEnv);
    expect(parsed.success).toBe(false);
    if (!parsed.success) {
      const logIssue = parsed.error.issues.find((i) => i.path.includes('LOG_LEVEL'));
      expect(logIssue).toBeDefined();
    }
  });
});
