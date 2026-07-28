import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import CreateUserDTO from '../../src/modules/authentication/dtos/createUser.dto';

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface AuthSession {
  user: AuthenticatedUser;
  agent: ReturnType<typeof request.agent>;
}

export function createUserPayload(
  overrides: Partial<CreateUserDTO> = {},
): CreateUserDTO {
  const unique = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  return {
    email: `user-${unique}@example.com`,
    password: 'password123',
    passwordConfirm: 'password123',
    ...overrides,
  };
}

export async function registerUser(
  app: INestApplication<App>,
  overrides: Partial<CreateUserDTO> = {},
): Promise<AuthSession> {
  const payload = createUserPayload(overrides);
  const agent = request.agent(app.getHttpServer());

  const response = await agent.post('/auth/register').send(payload).expect(201);

  return {
    user: response.body.data.user,
    agent,
  };
}

export async function loginUser(
  app: INestApplication<App>,
  email: string,
  password: string,
): Promise<AuthSession> {
  const agent = request.agent(app.getHttpServer());

  const response = await agent
    .post('/auth/login')
    .send({ email, password })
    .expect(200);

  return {
    user: response.body.data.user,
    agent,
  };
}

export async function registerAndLogin(
  app: INestApplication<App>,
  overrides: Partial<CreateUserDTO> = {},
): Promise<AuthSession> {
  return registerUser(app, overrides);
}
