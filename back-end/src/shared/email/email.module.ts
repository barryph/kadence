import { Module } from '@nestjs/common';
import { EMAIL_SENDER } from './email-sender.port';
import { ResendEmailSender } from './resend-email-sender';

/**
 * Owns the single `IEmailSender` binding for the whole app.
 *
 * It lives in `shared/` rather than inside a feature module because two
 * bounded contexts depend on it: `authentication` (password reset) and
 * `account-management` (deletion links and the post-deletion confirmation).
 *
 * The binding is the Resend-backed sender; configuration (and the API key)
 * comes from the environment. E2E suites override `EMAIL_SENDER` with the
 * recording fake in `test/helpers/fake-email-sender.ts`, so they need no
 * credentials and see every email the app produced.
 */
@Module({
  providers: [
    {
      provide: EMAIL_SENDER,
      useClass: ResendEmailSender,
    },
  ],
  exports: [EMAIL_SENDER],
})
export class EmailModule {}
