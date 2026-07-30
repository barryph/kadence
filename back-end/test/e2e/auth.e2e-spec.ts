import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, closeTestApp } from '../helpers/create-test-app';
import {
  createUserPayload,
  registerAndLogin,
  registerUser,
} from '../helpers/auth-helpers';
import { expectErrorBody } from '../helpers/assertions';
import { getTestKnex } from '../helpers/test-database';
import { hashPasswordResetToken } from '../../src/modules/authentication/utils/password-reset-token';

describe('Auth (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('registers, logs in, returns current user, and logs out', async () => {
    const payload = createUserPayload();
    const registerAgent = request.agent(app.getHttpServer());

    const registerResponse = await registerAgent
      .post('/auth/register')
      .send(payload)
      .expect(201);

    expect(registerResponse.body.data.user.email).toBe(payload.email);

    await registerAgent
      .get('/users/current')
      .expect(200)
      .expect((res) => {
        expect(res.body.data.user.id).toBe(registerResponse.body.data.user.id);
      });

    await registerAgent.delete('/auth/logout').expect(200);

    const currentAfterLogout = await registerAgent.get('/users/current');
    expect(currentAfterLogout.body.data.user).toBeUndefined();
  });

  it('rejects login with invalid credentials', async () => {
    const { user } = await registerUser(app);
    const payload = createUserPayload({ email: user.email });

    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: payload.email, password: 'wrong-password' })
      .expect(401);

    expectErrorBody(response.body, {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid Credentials',
    });
  });

  it('resets password and clears existing sessions', async () => {
    const payload = createUserPayload();
    const session = await registerAndLogin(app, payload);

    await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: payload.email })
      .expect(200);

    const db = getTestKnex();
    const userRow = await db('users').where({ email: payload.email }).first();
    expect(userRow.password_reset_token).toBeTruthy();

    const rawToken = 'known-reset-token-for-test';
    await db('users')
      .where({ email: payload.email })
      .update({
        password_reset_token: hashPasswordResetToken(rawToken),
        password_reset_expires: new Date(Date.now() + 60_000),
      });

    await request(app.getHttpServer())
      .post('/auth/reset-password')
      .send({ token: rawToken, password: 'newpassword123' })
      .expect(200);

    await session.agent.get('/users/protec').expect(401);

    const loginAgent = request.agent(app.getHttpServer());
    await loginAgent
      .post('/auth/login')
      .send({ email: payload.email, password: 'newpassword123' })
      .expect(200);
  });

  it('returns generic message for forgot-password regardless of email existence', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/forgot-password')
      .send({ email: 'missing@example.com' })
      .expect(200);

    expect(response.body.data.message).toContain(
      'If an account with that email exists',
    );
  });
});
