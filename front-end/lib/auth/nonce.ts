import * as Crypto from 'expo-crypto';

/**
 * Generates a cryptographically secure random nonce for a single
 * authentication attempt. Never use timestamps, counters, Math.random(), or
 * other predictable values.
 */
export async function generateNonce(byteLength = 32): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(byteLength);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

/** SHA-256 hex digest. Used for Apple's hashed-nonce claim. */
export async function sha256Hex(value: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}
