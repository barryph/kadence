import type {
  AccountDeletedEmailPayload,
  AccountDeletionEmailPayload,
  IEmailSender,
  PasswordResetEmailPayload,
} from '../../src/shared/email/email-sender.port';

/** One entry in {@link FakeEmailSender}'s in-memory outbox. */
export type SentEmail =
  | ({ kind: 'password-reset' } & PasswordResetEmailPayload)
  | ({ kind: 'account-deletion' } & AccountDeletionEmailPayload)
  | ({ kind: 'account-deleted' } & AccountDeletedEmailPayload);

/**
 * Test double for the `EMAIL_SENDER` port.
 *
 * E2E suites boot the real `AppModule`, so `createTestApp` overrides the
 * provider with this class: no Resend credentials are required, no network
 * request is made, and specs can read the token/link that would have reached
 * the user from `sentEmails`.
 */
export class FakeEmailSender implements IEmailSender {
  readonly sentEmails: SentEmail[] = [];

  sendPasswordResetEmail(payload: PasswordResetEmailPayload): Promise<void> {
    this.sentEmails.push({ kind: 'password-reset', ...payload });
    return Promise.resolve();
  }

  sendAccountDeletionEmail(
    payload: AccountDeletionEmailPayload,
  ): Promise<void> {
    this.sentEmails.push({ kind: 'account-deletion', ...payload });
    return Promise.resolve();
  }

  sendAccountDeletedEmail(payload: AccountDeletedEmailPayload): Promise<void> {
    this.sentEmails.push({ kind: 'account-deleted', ...payload });
    return Promise.resolve();
  }
}
