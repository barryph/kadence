import jwt from 'jsonwebtoken';
import { AppleProvider } from './apple.provider';
import { OAuthCredentialError } from '../../authentication.errors';
import {
  buildUnsignedToken,
  createTestSigningKey,
  sha256Hex,
  signToken,
  startJwksServer,
  type JwksServer,
  type TestSigningKey,
} from '../../../../../test/helpers/test-jwks';

const BUNDLE_ID = 'com.example.app';
const ISSUER = 'https://appleid.apple.com';

describe('AppleProvider', () => {
  let provider: AppleProvider;
  let jwksServer: JwksServer;
  let keyA: TestSigningKey;
  let keyB: TestSigningKey;

  const validToken = (
    overrides: Partial<{
      key?: TestSigningKey;
      iss?: string;
      aud?: string | string[];
      sub?: string;
      email?: string;
      nonce?: string;
      exp?: number;
      algorithm?: string;
    }> = {},
  ) =>
    signToken({
      key: keyA,
      iss: ISSUER,
      aud: BUNDLE_ID,
      sub: 'apple-subject-1',
      email: 'user@example.com',
      ...overrides,
    });

  beforeAll(async () => {
    keyA = createTestSigningKey('apple-key-a');
    keyB = createTestSigningKey('apple-key-b');
    jwksServer = await startJwksServer([keyA]);
  });

  afterAll(async () => {
    await jwksServer.close();
  });

  beforeEach(() => {
    process.env.APPLE_CLIENT_IDS = BUNDLE_ID;
    process.env.APPLE_JWKS_URL = jwksServer.url;
    process.env.APPLE_JWKS_COOLDOWN_MS = '0';
    jwksServer.setKeys([keyA]);
    provider = new AppleProvider();
  });

  it('returns the verified identity for a valid identity token with nonce', async () => {
    const rawNonce = 'crypto-secure-random-nonce';
    const identity = await provider.verifyIdentityToken(
      validToken({ nonce: sha256Hex(rawNonce) }),
      rawNonce,
    );

    expect(identity).toEqual({
      provider: 'apple',
      subject: 'apple-subject-1',
      email: 'user@example.com',
    });
  });

  it('accepts any configured client ID as audience', async () => {
    process.env.APPLE_CLIENT_IDS = `${BUNDLE_ID},com.example.secondary`;
    provider = new AppleProvider();
    const rawNonce = 'nonce-for-audience-test';

    const identity = await provider.verifyIdentityToken(
      validToken({ aud: 'com.example.secondary', nonce: sha256Hex(rawNonce) }),
      rawNonce,
    );

    expect(identity.subject).toBe('apple-subject-1');
  });

  it('rejects a token signed with an unknown/rotated-out key', async () => {
    await expect(
      provider.verifyIdentityToken(validToken({ key: keyB })),
    ).rejects.toThrow(OAuthCredentialError);
  });

  it('rejects a token with a tampered signature', async () => {
    const token = validToken({});
    const tampered = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`;

    await expect(provider.verifyIdentityToken(tampered)).rejects.toThrow(
      OAuthCredentialError,
    );
  });

  it('rejects an expired token', async () => {
    const expired = validToken({ exp: Math.floor(Date.now() / 1000) - 60 });

    await expect(provider.verifyIdentityToken(expired)).rejects.toThrow(
      OAuthCredentialError,
    );
  });

  it('rejects a token with an incorrect issuer', async () => {
    await expect(
      provider.verifyIdentityToken(
        validToken({ iss: 'https://evil.example.com' }),
      ),
    ).rejects.toThrow(OAuthCredentialError);
  });

  it('rejects a token with an incorrect audience', async () => {
    await expect(
      provider.verifyIdentityToken(validToken({ aud: 'com.evil.app' })),
    ).rejects.toThrow(OAuthCredentialError);
  });

  it('rejects a token missing the sub claim', async () => {
    await expect(
      provider.verifyIdentityToken(validToken({ sub: undefined })),
    ).rejects.toThrow(OAuthCredentialError);
  });

  it('rejects a token whose nonce does not match the raw nonce', async () => {
    const token = validToken({ nonce: sha256Hex('different-nonce') });

    await expect(
      provider.verifyIdentityToken(token, 'expected-raw-nonce'),
    ).rejects.toThrow(OAuthCredentialError);
  });

  it('rejects when no nonce is provided', async () => {
    const token = validToken({ nonce: sha256Hex('some-nonce') });

    await expect(provider.verifyIdentityToken(token)).rejects.toThrow(
      OAuthCredentialError,
    );
  });

  it('rejects a token without a nonce claim when a nonce is provided', async () => {
    await expect(
      provider.verifyIdentityToken(validToken({}), 'some-raw-nonce'),
    ).rejects.toThrow(OAuthCredentialError);
  });

  it('rejects an alg=none token', async () => {
    const unsigned = buildUnsignedToken({
      iss: ISSUER,
      aud: BUNDLE_ID,
      sub: 'apple-subject-1',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    await expect(provider.verifyIdentityToken(unsigned)).rejects.toThrow(
      OAuthCredentialError,
    );
  });

  it('rejects an alg=HS256 algorithm-confusion token', async () => {
    const token = jwt.sign(
      { email: 'user@example.com', sub: 'apple-subject-1' },
      'some-hmac-secret',
      {
        algorithm: 'HS256',
        issuer: ISSUER,
        audience: BUNDLE_ID,
        expiresIn: '1h',
        header: { alg: 'HS256', kid: keyA.kid },
      },
    );

    await expect(provider.verifyIdentityToken(token)).rejects.toThrow(
      OAuthCredentialError,
    );
  });

  it('handles Apple signing-key rotation', async () => {
    const rawNonce = 'rotation-nonce';
    const tokenA = validToken({ nonce: sha256Hex(rawNonce) });
    await expect(
      provider.verifyIdentityToken(tokenA, rawNonce),
    ).resolves.toMatchObject({
      subject: 'apple-subject-1',
    });

    // Apple now serves only keyB.
    jwksServer.setKeys([keyB]);
    const tokenB = validToken({
      key: keyB,
      sub: 'apple-subject-2',
      nonce: sha256Hex(rawNonce),
    });

    await expect(
      provider.verifyIdentityToken(tokenB, rawNonce),
    ).resolves.toMatchObject({
      subject: 'apple-subject-2',
    });

    // A token signed with the rotated-out keyA is rejected.
    await expect(
      provider.verifyIdentityToken(tokenA, rawNonce),
    ).rejects.toThrow(OAuthCredentialError);
  });
});
