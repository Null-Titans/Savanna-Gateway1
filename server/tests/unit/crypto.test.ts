import { describe, expect, it } from 'vitest';
import {
  encrypt,
  decrypt,
  encryptStructured,
  deserializeEncrypted,
  serializeEncrypted,
  encryptObject,
  decryptObject,
  hashSha256,
  generateApiKey,
  generateSecureToken,
} from '../../src/shared/utils/crypto.js';

describe('Unit: Authenticated Cryptographic Utilities (AES-256-GCM)', () => {
  it('encrypts plaintext with AES-256-GCM, yielding serialized v1:iv:tag:data string', () => {
    const secret = 'Learner National ID: ET-99887766';
    const encrypted = encrypt(secret);

    expect(encrypted).toMatch(/^v1:[0-9a-f]{24}:[0-9a-f]{32}:[0-9a-f]+$/);

    const decrypted = decrypt(encrypted);
    expect(decrypted).toBe(secret);
  });

  it('guarantees unique Initialization Vectors (IV) across successive encryptions of identical data', () => {
    const identicalText = 'Same text encrypted multiple times';
    const enc1 = encryptStructured(identicalText);
    const enc2 = encryptStructured(identicalText);

    expect(enc1.iv).not.toBe(enc2.iv);
    expect(enc1.ciphertext).not.toBe(enc2.ciphertext);
    expect(decrypt(enc1)).toBe(identicalText);
    expect(decrypt(enc2)).toBe(identicalText);
  });

  it('enforces GCM authentication tags: rejects tampered ciphertext or manipulated auth tags', () => {
    const original = encrypt('Vulnerable applicant sensitive medical context');
    const parts = original.split(':');
    const [version, iv, tag, ciphertext] = parts;

    // Tamper with ciphertext
    const flippedCiphertext = (ciphertext || '').slice(0, -2) + '00';
    const tamperedString = `${version}:${iv}:${tag}:${flippedCiphertext}`;

    expect(() => decrypt(tamperedString)).toThrow();

    // Tamper with authentication tag
    const flippedTag = (tag || '').slice(0, -2) + 'ff';
    const tamperedTagString = `${version}:${iv}:${flippedTag}:${ciphertext}`;

    expect(() => decrypt(tamperedTagString)).toThrow();
  });

  it('serializes and deserializes arbitrary JavaScript objects safely', () => {
    interface LearnerAccommodationProfile {
      learnerId: string;
      specialAccommodations: string[];
      preferredFormat: string;
      isVerified: boolean;
    }

    const profile: LearnerAccommodationProfile = {
      learnerId: 'lrn_001',
      specialAccommodations: ['screen_reader', 'extended_time', 'accessible_transport'],
      preferredFormat: 'large_print_amharic',
      isVerified: true,
    };

    const encryptedObj = encryptObject(profile);
    const decryptedObj = decryptObject<LearnerAccommodationProfile>(encryptedObj);

    expect(decryptedObj).toEqual(profile);
    expect(decryptedObj.specialAccommodations).toContain('extended_time');
  });

  it('produces deterministic SHA-256 hashes for indexed database lookups', () => {
    const input = 'applicant.phone.+251911000000';
    const hash1 = hashSha256(input);
    const hash2 = hashSha256(input);

    expect(hash1).toBe(hash2);
    expect(hash1).toMatch(/^[0-9a-f]{64}$/);
  });

  it('generates cryptographically secure API keys and random tokens', () => {
    const liveWidgetKey = generateApiKey('pk_live_');
    expect(liveWidgetKey.key.startsWith('pk_live_')).toBe(true);
    expect(liveWidgetKey.keyHash).toBe(hashSha256(liveWidgetKey.key));
    expect(liveWidgetKey.displayPrefix).toMatch(/^pk_live_[0-9a-f]{6}\.\.\.$/);

    const randomToken = generateSecureToken(32);
    expect(randomToken).toMatch(/^[0-9a-f]{64}$/);
  });
});
