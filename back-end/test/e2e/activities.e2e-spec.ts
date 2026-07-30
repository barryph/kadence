import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { createTestApp, closeTestApp } from '../helpers/create-test-app';
import { registerAndLogin } from '../helpers/auth-helpers';

describe('Activities (e2e)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await closeTestApp(app);
  });

  it('requires authentication', async () => {
    await request(app.getHttpServer()).get('/activities').expect(401);
  });

  it('runs the full habit lifecycle', async () => {
    const { agent } = await registerAndLogin(app);

    const categoryResponse = await agent
      .post('/categories')
      .send({ name: 'Health', color: '#ff0000' })
      .expect(201);
    const categoryId = categoryResponse.body.data.category.id;

    const createResponse = await agent
      .post('/activities')
      .send({
        name: 'Back Squat',
        ticker: 'SQUT',
        interval: 3,
        categoryId: Number(categoryId),
        lastDone: '2026-01-10',
      })
      .expect(201);

    const activityId = createResponse.body.data.activity.id;

    const listResponse = await agent.get('/activities').expect(200);
    expect(listResponse.body.data.activities).toHaveLength(1);
    expect(listResponse.body.data.activities[0].category.name).toBe('Health');

    await agent
      .post(`/activities/${activityId}/complete`)
      .send({ date: '2026-03-01' })
      .expect(201);

    await agent
      .post(`/activities/${activityId}/complete`)
      .send({ date: '2026-03-01' })
      .expect(409);

    const timelineResponse = await agent
      .get('/activities/timeline')
      .query({ month: '2026-03' })
      .expect(200);
    expect(timelineResponse.body.data.timeline[activityId]).toContain(
      '2026-03-01',
    );

    await agent
      .post(`/activities/${activityId}/undo`)
      .send({ date: '2026-03-01' })
      .expect(201);

    await agent
      .put(`/activities/edit/${activityId}`)
      .send({ name: 'Front Squat', ticker: 'FSQT' })
      .expect(200);

    const detailResponse = await agent
      .get(`/activities/${activityId}`)
      .expect(200);
    expect(detailResponse.body.data.activity.name).toBe('Front Squat');

    await agent.delete(`/activities/${activityId}`).expect(200);

    const emptyList = await agent.get('/activities').expect(200);
    expect(emptyList.body.data.activities).toHaveLength(0);
  });

  it('prevents another user from accessing the activity', async () => {
    const owner = await registerAndLogin(app);
    const createResponse = await owner.agent
      .post('/activities')
      .send({ name: 'Private Activity', interval: 3 })
      .expect(201);
    const activityId = createResponse.body.data.activity.id;

    const intruder = await registerAndLogin(app, {
      email: `intruder-${Date.now()}@example.com`,
    });

    await intruder.agent.get(`/activities/${activityId}`).expect(401);
    await intruder.agent
      .post(`/activities/${activityId}/complete`)
      .send({ date: '2026-03-01' })
      .expect(401);

    expect(owner.user.id).not.toBe(intruder.user.id);
  });

  it('rejects invalid activity payloads', async () => {
    const { agent } = await registerAndLogin(app);

    await agent.post('/activities').send({ interval: 3 }).expect(400);
  });
});
