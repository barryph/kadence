import * as Crypto from 'expo-crypto';
import { generateNonce, sha256Hex } from '../nonce';

describe('generateNonce', () => {
  it('returns a hex-encoded string of the requested byte length', async () => {
    const nonce = await generateNonce(32);

    expect(nonce).toHaveLength(64);
    expect(nonce).toMatch(/^[0-9a-f]+$/);
  });

  it('draws from the crypto-secure random source', async () => {
    await generateNonce(32);
    expect(Crypto.getRandomBytesAsync).toHaveBeenCalledWith(32);
  });

  it('produces unpredictable values', async () => {
    const first = await generateNonce(32);
    const second = await generateNonce(32);
    expect(first).not.toBe(second);
  });
});

describe('sha256Hex', () => {
  it('returns a digest for the Apple nonce hash', async () => {
    await expect(sha256Hex('raw-nonce')).resolves.toBe('sha256-of-raw-nonce');
  });
});
