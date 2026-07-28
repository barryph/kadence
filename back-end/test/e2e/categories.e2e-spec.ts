import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, closeTestApp } from '../helpers/create-test-app';
import { registerAndLogin } from '../helpers/auth-helpers';

describe('Categories (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('requires authentication', async () => {
    await request(app.getHttpServer()).get('/categories').expect(401);
  });

  it('creates, lists, edits, and deletes a category', async () => {
    const { agent } = await registerAndLogin(app);

    const createResponse = await agent
      .post('/categories')
      .send({ name: 'Health', color: '#ff0000' })
      .expect(201);

    const categoryId = createResponse.body.data.category.id;

    const listResponse = await agent.get('/categories').expect(200);
    expect(listResponse.body.data.categories).toHaveLength(1);

    await agent
      .put(`/categories/edit/${categoryId}`)
      .send({ name: 'Fitness', color: '#00ff00' })
      .expect(200);

    const updatedList = await agent.get('/categories').expect(200);
    expect(updatedList.body.data.categories[0].name).toBe('Fitness');

    await agent.delete(`/categories/${categoryId}`).expect(200);

    const emptyList = await agent.get('/categories').expect(200);
    expect(emptyList.body.data.categories).toHaveLength(0);
  });
});
