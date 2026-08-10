import jwt from 'jsonwebtoken';
import { GoogleProvider } from './google.provider';
import { OAuthCredentialError } from '../../authentication.errors';
import {
  buildUnsignedToken,
  createTestSigningKey,
  signToken,
  startGoogleCertsServer,
  type GoogleCertsServer,
  type TestSigningKey,
} from '../../../../../test/helpers/test-jwks';

const SERVER_CLIENT_ID = 'test-server-client-id.apps.googleusercontent.com';

describe('GoogleProvider', () => {
  let provider: GoogleProvider;
  let certsServer: GoogleCertsServer;
  let keyA: TestSigningKey;
  let keyB: TestSigningKey;

  const validToken = (
    overrides: Partial<{
      key?: TestSigningKey;
      iss?: string;
      aud?: string | string[];
      sub?: string;
      email?: string;
      exp?: number;
      algorithm?: string;
    }> = {},
  ) =>
    signToken({
      key: keyA,
      iss: 'accounts.google.com',
      aud: SERVER_CLIENT_ID,
      sub: 'google-subject-1',
      email: 'user@example.com',
      ...overrides,
    });

  beforeAll(async () => {
    keyA = createTestSigningKey('google-key-a');
    keyB = createTestSigningKey('google-key-b');
    certsServer = await startGoogleCertsServer([keyA]);
  });

  afterAll(async () => {
    await certsServer.close();
  });

  beforeEach(() => {
    process.env.GOOGLE_SERVER_CLIENT_IDS = SERVER_CLIENT_ID;
    process.env.GOOGLE_JWKS_URL = certsServer.url;
    process.env.GOOGLE_JWKS_COOLDOWN_MS = '0';
    certsServer.setKeys([keyA]);
    provider = new GoogleProvider();
  });

  it('returns the verified identity for a valid ID token', async () => {
    const identity = await provider.verifyIdToken(validToken({}));

    expect(identity).toEqual({
      provider: 'google',
      subject: 'google-subject-1',
      email: 'user@example.com',
    });
  });

  it('accepts any of the configured server client IDs as audience', async () => {
    process.env.GOOGLE_SERVER_CLIENT_IDS = `${SERVER_CLIENT_ID},secondary-client-id`;
    provider = new GoogleProvider();

    const identity = await provider.verifyIdToken(
      validToken({ aud: 'secondary-client-id' }),
    );

    expect(identity.subject).toBe('google-subject-1');
  });

  it('rejects a token signed with an unknown/rotated-out key', async () => {
    await expect(
      provider.verifyIdToken(validToken({ key: keyB })),
    ).rejects.toThrow(OAuthCredentialError);
  });

  it('rejects a token with a tampered payload (signature mismatch)', async () => {
    const [header, payload, signature] = validToken({}).split('.');
    const claims = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8'),
    ) as { sub?: string };
    claims.sub = 'attacker-controlled-sub';
    const tamperedPayload = Buffer.from(JSON.stringify(claims)).toString(
      'base64url',
    );
    const tampered = `${header}.${tamperedPayload}.${signature}`;

    await expect(provider.verifyIdToken(tampered)).rejects.toThrow(
      OAuthCredentialError,
    );
  });

  it('rejects an expired token', async () => {
    // Expired beyond google-auth-library's 5-minute clock skew.
    const expired = validToken({ exp: Math.floor(Date.now() / 1000) - 3600 });

    await expect(provider.verifyIdToken(expired)).rejects.toThrow(
      OAuthCredentialError,
    );
  });

  it('rejects a token with an incorrect issuer', async () => {
    await expect(
      provider.verifyIdToken(validToken({ iss: 'https://evil.example.com' })),
    ).rejects.toThrow(OAuthCredentialError);
  });

  it('rejects a token with an incorrect audience', async () => {
    await expect(
      provider.verifyIdToken(validToken({ aud: 'some-other-client' })),
    ).rejects.toThrow(OAuthCredentialError);
  });

  it('rejects a token missing the sub claim', async () => {
    await expect(
      provider.verifyIdToken(validToken({ sub: undefined })),
    ).rejects.toThrow(OAuthCredentialError);
  });

  it('rejects an alg=none token', async () => {
    const unsigned = buildUnsignedToken({
      iss: 'accounts.google.com',
      aud: SERVER_CLIENT_ID,
      email: 'user@example.com',
      exp: Math.floor(Date.now() / 1000) + 3600,
    });

    await expect(provider.verifyIdToken(unsigned)).rejects.toThrow(
      OAuthCredentialError,
    );
  });

  it('rejects an alg=HS256 algorithm-confusion token', async () => {
    const token = jwt.sign(
      { email: 'user@example.com', sub: 'google-subject-1' },
      'some-hmac-secret',
      {
        algorithm: 'HS256',
        issuer: 'accounts.google.com',
        audience: SERVER_CLIENT_ID,
        expiresIn: '1h',
        header: { alg: 'HS256', kid: keyA.kid },
      },
    );

    await expect(provider.verifyIdToken(token)).rejects.toThrow(
      OAuthCredentialError,
    );
  });

  it('handles Google signing-key rotation', async () => {
    const tokenA = validToken({});
    await expect(provider.verifyIdToken(tokenA)).resolves.toMatchObject({
      subject: 'google-subject-1',
    });

    // Google now serves only keyB.
    certsServer.setKeys([keyB]);
    const tokenB = validToken({ key: keyB, sub: 'google-subject-2' });

    await expect(provider.verifyIdToken(tokenB)).resolves.toMatchObject({
      subject: 'google-subject-2',
    });

    // A token signed with the rotated-out keyA is rejected.
    await expect(provider.verifyIdToken(tokenA)).rejects.toThrow(
      OAuthCredentialError,
    );
  });

  it('does not leak the token in errors or logs', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const badToken = validToken({ iss: 'https://evil.example.com' });

    try {
      await expect(provider.verifyIdToken(badToken)).rejects.toThrow(
        OAuthCredentialError,
      );
    } finally {
      spy.mockRestore();
    }

    const logCalls = spy.mock.calls.map((call) => call.map(String).join(' '));
    expect(logCalls.join(' ')).not.toContain(badToken);
  });
});
