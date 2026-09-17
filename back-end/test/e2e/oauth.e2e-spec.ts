import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, closeTestApp } from '../helpers/create-test-app';
import { getTestKnex } from '../helpers/test-database';
import {
  createTestSigningKey,
  sha256Hex,
  signToken,
  startGoogleCertsServer,
  startJwksServer,
  type GoogleCertsServer,
  type JwksServer,
  type TestSigningKey,
} from '../helpers/test-jwks';

const GOOGLE_CLIENT_ID = 'test-server-client-id.apps.googleusercontent.com';
const APPLE_BUNDLE_ID = 'com.codecompletelabs.kadence';

function extractSid(setCookie: string | string[] | undefined): string | null {
  if (!setCookie) return null;
  const raw = Array.isArray(setCookie) ? setCookie[0] : setCookie;
  const match = /connect\.sid=([^;]+)/.exec(raw);
  return match ? match[1] : null;
}

describe('OAuth sign-in (e2e)', () => {
  let app: INestApplication<App>;
  let googleCerts: GoogleCertsServer;
  let appleJwks: JwksServer;
  let googleKey: TestSigningKey;
  let appleKey: TestSigningKey;

  beforeAll(async () => {
    googleKey = createTestSigningKey('e2e-google-key');
    googleCerts = await startGoogleCertsServer([googleKey]);
    appleKey = createTestSigningKey('e2e-apple-key');
    appleJwks = await startJwksServer([appleKey]);

    process.env.GOOGLE_SERVER_CLIENT_IDS = GOOGLE_CLIENT_ID;
    process.env.GOOGLE_JWKS_URL = googleCerts.url;
    process.env.GOOGLE_JWKS_COOLDOWN_MS = '0';
    process.env.APPLE_CLIENT_IDS = APPLE_BUNDLE_ID;
    process.env.APPLE_JWKS_URL = appleJwks.url;
    process.env.APPLE_JWKS_COOLDOWN_MS = '0';

    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
    await googleCerts.close();
    await appleJwks.close();
  });

  const googleToken = (
    overrides: Partial<Parameters<typeof signToken>[0]> = {},
  ) =>
    signToken({
      key: googleKey,
      iss: 'accounts.google.com',
      aud: GOOGLE_CLIENT_ID,
      sub: 'e2e-google-subject',
      email: 'google-user@example.com',
      ...overrides,
    });

  const appleToken = (
    overrides: Partial<Parameters<typeof signToken>[0]> = {},
  ) =>
    signToken({
      key: appleKey,
      iss: 'https://appleid.apple.com',
      aud: APPLE_BUNDLE_ID,
      sub: 'e2e-apple-subject',
      email: 'apple-user@example.com',
      nonce: sha256Hex('e2e-nonce'),
      ...overrides,
    });

  it('signs in a new Google user and establishes an authenticated session', async () => {
    const agent = request.agent(app.getHttpServer());
    const token = googleToken();

    const response = await agent
      .post('/auth/google')
      .send({ idToken: token })
      .expect(200);

    expect(response.body.data.user.email).toBe('google-user@example.com');

    await agent
      .get('/users/current')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.user.id).toBe(response.body.data.user.id);
      });

    const db = getTestKnex();
    const identity = await db('external_identities')
      .where({ provider: 'google', provider_subject: 'e2e-google-subject' })
      .first();
    expect(identity.user_id).toBe(String(response.body.data.user.id));
    expect(identity.provider_email).toBe('google-user@example.com');

    const sessions = await db('user_sessions').select('sess');
    const serialized = JSON.stringify(sessions);
    expect(serialized).not.toContain('e2e-google-subject');
    expect(serialized).not.toContain(token);
  });

  it('reuses the same user for an existing Google identity', async () => {
    const first = request.agent(app.getHttpServer());
    const second = request.agent(app.getHttpServer());

    const res1 = await first
      .post('/auth/google')
      .send({ idToken: googleToken() })
      .expect(200);
    const res2 = await second
      .post('/auth/google')
      .send({ idToken: googleToken() })
      .expect(200);

    expect(res1.body.data.user.id).toBe(res2.body.data.user.id);

    const db = getTestKnex();
    const count = await db('users').where({ email: 'google-user@example.com' });
    expect(count).toHaveLength(1);
  });

  it('signs in a new Apple user with a validated nonce', async () => {
    const agent = request.agent(app.getHttpServer());

    const response = await agent
      .post('/auth/apple')
      .send({
        idToken: appleToken(),
        nonce: 'e2e-nonce',
        authorizationCode: 'e2e-authorization-code',
      })
      .expect(200);

    expect(response.body.data.user.email).toBe('apple-user@example.com');

    await agent
      .get('/users/current')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.user.id).toBe(response.body.data.user.id);
      });
  });

  it('rejects an Apple token whose nonce does not match', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/auth/apple')
      .send({
        idToken: appleToken(),
        nonce: 'different-nonce',
        authorizationCode: 'e2e-authorization-code',
      })
      .expect(401)
      .expect((res) => {
        expect(res.body.error.code).toBe('OAUTH_AUTH_FAILED');
      });

    await agent
      .get('/users/current')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.user).toBeUndefined();
      });
  });

  it('rejects an expired Google token without creating a session', async () => {
    const agent = request.agent(app.getHttpServer());
    const expired = googleToken({
      sub: 'expired-google-subject',
      exp: Math.floor(Date.now() / 1000) - 3600,
    });

    await agent.post('/auth/google').send({ idToken: expired }).expect(401);

    await agent
      .get('/users/current')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.user).toBeUndefined();
      });

    const db = getTestKnex();
    const identity = await db('external_identities')
      .where({ provider_subject: 'expired-google-subject' })
      .first();
    expect(identity).toBeUndefined();
  });

  it('rejects an invalid-signature Google token', async () => {
    const attackerKey = createTestSigningKey('e2e-attacker-key');
    const forged = signToken({
      key: attackerKey,
      iss: 'accounts.google.com',
      aud: GOOGLE_CLIENT_ID,
      sub: 'forged-subject',
      email: 'forged@example.com',
    });

    await request(app.getHttpServer())
      .post('/auth/google')
      .send({ idToken: forged })
      .expect(401);
  });

  it('rejects a Google token with an incorrect issuer and audience', async () => {
    await request(app.getHttpServer())
      .post('/auth/google')
      .send({ idToken: googleToken({ iss: 'https://evil.example.com' }) })
      .expect(401);

    await request(app.getHttpServer())
      .post('/auth/google')
      .send({ idToken: googleToken({ aud: 'some-other-client' }) })
      .expect(401);
  });

  it('ignores client-supplied identity fields (validation rejects them)', async () => {
    const agent = request.agent(app.getHttpServer());

    await agent
      .post('/auth/google')
      .send({
        idToken: googleToken(),
        email: 'attacker@example.com',
        userId: '1',
        name: 'Attacker',
      })
      .expect(400);

    await agent
      .get('/users/current')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.user).toBeUndefined();
      });
  });

  it('does not merge accounts when provider emails match', async () => {
    const db = getTestKnex();
    const registerAgent = request.agent(app.getHttpServer());
    const registerRes = await registerAgent
      .post('/auth/register')
      .send({
        email: 'same-email@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
      })
      .expect(201);

    // New Google identity reporting the same email as the password account.
    const oauthAgent = request.agent(app.getHttpServer());
    const oauthRes = await oauthAgent
      .post('/auth/google')
      .send({
        idToken: googleToken({
          sub: 'new-google-subject',
          email: 'same-email@example.com',
        }),
      })
      .expect(200);

    // A distinct account was created (no auto-merge), with a synthetic email
    // because the real one is taken.
    expect(oauthRes.body.data.user.id).not.toBe(registerRes.body.data.user.id);
    expect(oauthRes.body.data.user.email).toBe(
      'google-new-google-subject@local.kadence',
    );

    // The password account is untouched and still exists.
    const passwordUser = await db('users')
      .whereRaw('email = :email AND password IS NOT NULL', {
        email: 'same-email@example.com',
      })
      .first();
    expect(passwordUser).toBeTruthy();
  });

  it('prevents a provider identity from being linked to two users', async () => {
    const db = getTestKnex();
    const userRow = await db('users')
      .insert({ email: 'victim@example.com', password: null })
      .returning('id');

    await expect(
      db('external_identities').insert({
        provider: 'google',
        provider_subject: 'stolen-subject',
        user_id: userRow[0].id,
      }),
    ).resolves.toBeDefined();

    await expect(
      db('external_identities').insert({
        provider: 'google',
        provider_subject: 'stolen-subject',
        user_id: userRow[0].id,
      }),
    ).rejects.toThrow();
  });

  it('regenerates the session ID after OAuth sign-in', async () => {
    const agent = request.agent(app.getHttpServer());

    const preAuth = await agent
      .post('/auth/register')
      .send({
        email: 'pre-auth@example.com',
        password: 'password123',
        passwordConfirm: 'password123',
      })
      .expect(201);
    const preSid = extractSid(preAuth.headers['set-cookie']);

    const oauth = await agent
      .post('/auth/google')
      .send({ idToken: googleToken({ sub: 'session-regen-subject' }) })
      .expect(200);
    const postSid = extractSid(oauth.headers['set-cookie']);

    expect(preSid).toBeTruthy();
    expect(postSid).toBeTruthy();
    expect(postSid).not.toBe(preSid);

    await agent
      .get('/users/current')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.user.id).toBe(oauth.body.data.user.id);
      });
  });

  it('does not send a permissive CORS origin header', async () => {
    await request(app.getHttpServer())
      .get('/users/current')
      .set('Origin', 'http://evil.example.com')
      .expect(200)
      .expect((res) => {
        expect(res.headers['access-control-allow-origin']).toBeUndefined();
      });
  });

  it('logs out of the application session after OAuth sign-in', async () => {
    const agent = request.agent(app.getHttpServer());
    await agent
      .post('/auth/google')
      .send({ idToken: googleToken({ sub: 'logout-subject' }) })
      .expect(200);

    await agent
      .get('/users/current')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.user).toBeDefined();
      });

    await agent.delete('/auth/logout').expect(200);

    await agent
      .get('/users/current')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.user).toBeUndefined();
      });
  });

  /**
   * A user can revoke Kadence's access from their Google Account at any time.
   * Because no Google tokens are stored and no per-user Google authorization is
   * checked, revocation is not observable server-side (there is deliberately no
   * RISC). These tests pin down the required consequences: the existing app
   * session keeps working, a credential Google no longer honours is a normal
   * `401 OAUTH_AUTH_FAILED`, and signing in again resolves to the same account.
   */
  describe('Google access revoked', () => {
    const expiredTokenFor = (sub: string) =>
      googleToken({
        sub,
        exp: Math.floor(Date.now() / 1000) - 3600,
      });

    it('keeps an existing application session working after Google access is revoked', async () => {
      const agent = request.agent(app.getHttpServer());
      const signIn = await agent
        .post('/auth/google')
        .send({ idToken: googleToken({ sub: 'revoked-session-subject' }) })
        .expect(200);
      const userId = signIn.body.data.user.id;

      // The user revokes access and returns to the app. The session is a
      // server-side cookie credential and does not depend on Google, so it
      // continues under the normal session rules.
      await agent
        .get('/users/protec')
        .expect(200)
        .expect((res) => {
          expect(res.body.myData).toBe('this is a secret');
        });

      await agent
        .get('/users/current')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.user.id).toBe(userId);
          // Revocation is invisible without RISC: the Google identity record is
          // untouched, so the account stays linked and resolves to the same
          // user on the next successful sign-in.
          expect(res.body.data.authProviders).toContain('google');
        });
    });

    it('rejects a credential Google no longer honours without changing account state', async () => {
      const agent = request.agent(app.getHttpServer());
      const signIn = await agent
        .post('/auth/google')
        .send({ idToken: googleToken({ sub: 'revoked-reject-subject' }) })
        .expect(200);
      const userId = String(signIn.body.data.user.id);

      const db = getTestKnex();
      const identityBefore = await db('external_identities')
        .where({
          provider: 'google',
          provider_subject: 'revoked-reject-subject',
        })
        .first();

      // The user returns and tries again. Google now rejects the stale grant
      // (modelled as an ID token that expired while they were away), so the
      // backend must answer a normal authentication failure.
      const returning = request.agent(app.getHttpServer());
      await returning
        .post('/auth/google')
        .send({ idToken: expiredTokenFor('revoked-reject-subject') })
        .expect(401)
        .expect((res) => {
          expect(res.body.error.code).toBe('OAUTH_AUTH_FAILED');
        });

      // No session was established for the failed attempt...
      await returning
        .get('/users/current')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.user).toBeUndefined();
        });

      // ...and nothing was created, deleted, or reassigned.
      const users = await db('users').select('id');
      expect(users.map((row) => String(row.id))).toEqual([userId]);

      const identityAfter = await db('external_identities')
        .where({
          provider: 'google',
          provider_subject: 'revoked-reject-subject',
        })
        .first();
      expect(identityAfter).toBeDefined();
      expect(identityAfter.user_id).toBe(identityBefore.user_id);
    });

    it('does not end an existing session when another device attempts a revoked sign-in', async () => {
      const signedIn = request.agent(app.getHttpServer());
      await signedIn
        .post('/auth/google')
        .send({ idToken: googleToken({ sub: 'revoked-other-device-subject' }) })
        .expect(200);

      const otherDevice = request.agent(app.getHttpServer());
      await otherDevice
        .post('/auth/google')
        .send({ idToken: expiredTokenFor('revoked-other-device-subject') })
        .expect(401);

      // The endpoint is public and unauthenticated, so a rejected sign-in on
      // one device must not revoke sessions elsewhere.
      await signedIn
        .get('/users/current')
        .expect(200)
        .expect((res) => {
          expect(res.body.data.user).toBeDefined();
        });
      await signedIn.get('/users/protec').expect(200);
    });

    it('reuses the same account when the user signs in with Google again after revocation', async () => {
      const subject = 'revoked-return-subject';

      const first = request.agent(app.getHttpServer());
      const firstSignIn = await first
        .post('/auth/google')
        .send({ idToken: googleToken({ sub: subject }) })
        .expect(200);

      // A rejected attempt in between (Google no longer honours the old grant).
      await request(app.getHttpServer())
        .post('/auth/google')
        .send({ idToken: expiredTokenFor(subject) })
        .expect(401);

      // The user grants access again; Google issues a fresh ID token carrying
      // the same stable `sub`, so the existing identity is found, not a second
      // account created.
      const second = request.agent(app.getHttpServer());
      const secondSignIn = await second
        .post('/auth/google')
        .send({ idToken: googleToken({ sub: subject }) })
        .expect(200);

      expect(secondSignIn.body.data.user.id).toBe(
        firstSignIn.body.data.user.id,
      );

      const db = getTestKnex();
      expect(await db('users')).toHaveLength(1);
      expect(
        await db('external_identities').where({
          provider: 'google',
          provider_subject: subject,
        }),
      ).toHaveLength(1);
    });
  });
});
