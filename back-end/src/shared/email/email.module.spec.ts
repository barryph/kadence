import { Test } from '@nestjs/testing';
import { EMAIL_SENDER } from './email-sender.port';
import { EmailModule } from './email.module';
import { ResendEmailSender } from './resend-email-sender';

describe('EmailModule', () => {
  const originalKey = process.env.RESEND_API_KEY;

  afterEach(() => {
    if (originalKey === undefined) {
      delete process.env.RESEND_API_KEY;
    } else {
      process.env.RESEND_API_KEY = originalKey;
    }
  });

  it('binds EMAIL_SENDER to the Resend-backed sender', async () => {
    process.env.RESEND_API_KEY = 're_test_key';

    const moduleRef = await Test.createTestingModule({
      imports: [EmailModule],
    }).compile();

    expect(moduleRef.get(EMAIL_SENDER)).toBeInstanceOf(ResendEmailSender);

    await moduleRef.close();
  });
});
