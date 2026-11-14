import crypto from 'crypto';
import { env } from '../../config/env.js';

const CURRENT_KEY_VERSION = 'v1';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96 bits recommended for GCM
const AUTH_TAG_LENGTH = 16; // 128 bits

// Deterministically derive a 32-byte encryption key from string
function deriveKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

const keyRing: Record<string, Buffer> = {
  v1: deriveKey(env.ENCRYPTION_KEY),
};

export interface EncryptedPayload {
  version: string;
  iv: string; // hex
  tag: string; // hex
  ciphertext: string; // hex
}

/**
 * Encrypts a plaintext string using AES-256-GCM with a fresh random IV.
 * Returns an EncryptedPayload containing the key version, IV, auth tag, and ciphertext.
 */
export function encryptStructured(
  plaintext: string,
  keyVersion = CURRENT_KEY_VERSION
): EncryptedPayload {
  const key = keyRing[keyVersion];
  if (!key) {
    throw new Error(`Encryption key version '${keyVersion}' not found in key ring`);
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return {
    version: keyVersion,
    iv: iv.toString('hex'),
    tag: tag.toString('hex'),
    ciphertext: encrypted.toString('hex'),
  };
}

/**
 * Serializes an EncryptedPayload to a compact string format:
 * version:iv:tag:ciphertext
 */
export function serializeEncrypted(payload: EncryptedPayload): string {
  return `${payload.version}:${payload.iv}:${payload.tag}:${payload.ciphertext}`;
}

/**
 * Deserializes a compact string back to an EncryptedPayload
 */
export function deserializeEncrypted(serialized: string): EncryptedPayload {
  const parts = serialized.split(':');
  if (parts.length !== 4) {
    throw new Error('Malformed encrypted payload string. Expected 4 segments (version:iv:tag:ciphertext)');
  }

  const [version, iv, tag, ciphertext] = parts as [string, string, string, string];
  return { version, iv, tag, ciphertext };
}

/**
 * Encrypts plaintext and returns the serialized format (v1:iv:tag:ciphertext).
 */
export function encrypt(plaintext: string, keyVersion = CURRENT_KEY_VERSION): string {
  return serializeEncrypted(encryptStructured(plaintext, keyVersion));
}

/**
 * Decrypts an encrypted payload (either serialized string or EncryptedPayload object).
 * Verifies authenticity with GCM authentication tag.
 */
export function decrypt(input: string | EncryptedPayload): string {
  const payload = typeof input === 'string' ? deserializeEncrypted(input) : input;
  const key = keyRing[payload.version];

  if (!key) {
    throw new Error(`Decryption key version '${payload.version}' not recognized`);
  }

  const iv = Buffer.from(payload.iv, 'hex');
  const tag = Buffer.from(payload.tag, 'hex');
  const ciphertext = Buffer.from(payload.ciphertext, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString('utf8');
}

/**
 * Encrypts arbitrary serializable JavaScript object.
 */
export function encryptObject<T>(obj: T, keyVersion = CURRENT_KEY_VERSION): string {
  return encrypt(JSON.stringify(obj), keyVersion);
}

/**
 * Decrypts serialized ciphertext back into parsed JavaScript object.
 */
export function decryptObject<T>(encryptedString: string): T {
  const decrypted = decrypt(encryptedString);
  return JSON.parse(decrypted) as T;
}

/**
 * Deterministic SHA-256 hash for indexed lookups (e.g. searching sensitive learner IDs or tokens without decrypting)
 */
export function hashSha256(value: string): string {
  return crypto.createHash('sha256').update(value, 'utf8').digest('hex');
}

/**
 * Generates an API key pair with prefix and SHA-256 hash for secure storage.
 * The full plaintext key is only returned once during generation.
 */
export function generateApiKey(prefix: 'pk_live_' | 'sk_live_' | 'pk_test_' | 'sk_test_') {
  const randomHex = crypto.randomBytes(24).toString('hex');
  const plainKey = `${prefix}${randomHex}`;
  const keyHash = hashSha256(plainKey);
  const displayPrefix = `${prefix}${randomHex.slice(0, 6)}...`;

  return {
    key: plainKey,
    keyHash,
    displayPrefix,
  };
}

/**
 * Generates a cryptographically secure random token (e.g. for refresh tokens or session IDs)
 */
export function generateSecureToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}
