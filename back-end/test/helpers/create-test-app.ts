import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/configure-app';
import { EMAIL_SENDER } from '../../src/shared/email/email-sender.port';
import { FakeEmailSender } from './fake-email-sender';
import { destroyTestKnex } from './test-database';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  })
    // Never reach the real Resend API from tests: no credentials are needed and
    // the suite stays hermetic. Specs read the outbox via `app.get(EMAIL_SENDER)`.
    .overrideProvider(EMAIL_SENDER)
    .useValue(new FakeEmailSender())
    .compile();

  const app = moduleFixture.createNestApplication();
  configureApp(app);
  await app.init();
  return app;
}

export async function closeTestApp(app: INestApplication): Promise<void> {
  await app.close();
  await destroyTestKnex();
}
