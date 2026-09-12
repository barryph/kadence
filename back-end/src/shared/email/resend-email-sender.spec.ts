import { Logger } from '@nestjs/common';
import { Resend } from 'resend';
import { EmailDeliveryError } from './email.errors';
import { ResendEmailSender } from './resend-email-sender';

// The Resend SDK is the only provider-specific dependency, so it is mocked at
// the module boundary: these tests assert on the request we hand it without
// ever making a network call.
const mockEmails = { send: jest.fn() };
jest.mock('resend', () => ({
  Resend: jest.fn(() => ({ emails: mockEmails })),
}));

const ResendMock = Resend as unknown as jest.Mock;

const ENV_KEYS = [
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'EMAIL_REPLY_TO',
  'EMAIL_PASSWORD_RESET_URL',
] as const;

interface SentEmail {
  from: string;
  to: string;
  replyTo?: string;
  subject: string;
  html: string;
  text: string;
}

function lastSentEmail(): SentEmail {
  return mockEmails.send.mock.calls[0][0] as SentEmail;
}

describe('ResendEmailSender', () => {
  const originalEnv = { ...process.env };
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.RESEND_API_KEY = 're_test_key';
    process.env.EMAIL_FROM = 'Kadence <kadence+codecompletelabs@gmail.com>';
    process.env.EMAIL_PASSWORD_RESET_URL = 'kadence://reset-password';
    delete process.env.EMAIL_REPLY_TO;

    loggerErrorSpy = jest
      .spyOn(Logger.prototype, 'error')
      .mockImplementation(() => undefined);
    mockEmails.send.mockResolvedValue({
      data: { id: 'email-1' },
      error: null,
      headers: null,
    });
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
    for (const key of ENV_KEYS) {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    }
  });

  it('requires a Resend API key', () => {
    delete process.env.RESEND_API_KEY;

    expect(() => new ResendEmailSender()).toThrow(
      'env.RESEND_API_KEY must be set',
    );
  });

  it('sends the password reset email through the Resend Email API', async () => {
    const sender = new ResendEmailSender();

    await sender.sendPasswordResetEmail({
      recipientEmail: 'user@example.com',
      resetToken: 'abc123',
    });

    expect(ResendMock).toHaveBeenCalledWith('re_test_key');
    expect(mockEmails.send).toHaveBeenCalledTimes(1);

    const sent = lastSentEmail();
    expect(sent.from).toBe('Kadence <kadence+codecompletelabs@gmail.com>');
    expect(sent.to).toBe('user@example.com');
    expect(sent.subject).toBe('Reset your Kadence password');
    expect(sent.replyTo).toBeUndefined();
    expect(sent.html).toContain('kadence://reset-password?token=abc123');
    expect(sent.text).toContain('kadence://reset-password?token=abc123');
  });

  it('URL-encodes the reset token in the deep link', async () => {
    const sender = new ResendEmailSender();

    await sender.sendPasswordResetEmail({
      recipientEmail: 'user@example.com',
      resetToken: 'a b&c',
    });

    expect(lastSentEmail().text).toContain('token=a%20b%26c');
    expect(lastSentEmail().html).toContain('token=a%20b%26c');
  });

  it('appends the token correctly when the reset URL already has a query', async () => {
    process.env.EMAIL_PASSWORD_RESET_URL = 'kadence://reset-password?env=dev';
    const sender = new ResendEmailSender();

    await sender.sendPasswordResetEmail({
      recipientEmail: 'user@example.com',
      resetToken: 'abc123',
    });

    expect(lastSentEmail().text).toContain(
      'kadence://reset-password?env=dev&token=abc123',
    );
  });

  it('honours sender and reply-to overrides', async () => {
    process.env.EMAIL_FROM = 'Kadence <no-reply@kadence.app>';
    process.env.EMAIL_REPLY_TO = 'support@kadence.app';
    const sender = new ResendEmailSender();

    await sender.sendPasswordResetEmail({
      recipientEmail: 'user@example.com',
      resetToken: 'abc123',
    });

    const sent = lastSentEmail();
    expect(sent.from).toBe('Kadence <no-reply@kadence.app>');
    expect(sent.replyTo).toBe('support@kadence.app');
  });

  it('sends the account deletion link with its expiry', async () => {
    const sender = new ResendEmailSender();
    const deletionUrl = 'https://delete.kadence.app/delete?token=xyz';

    await sender.sendAccountDeletionEmail({
      recipientEmail: 'user@example.com',
      deletionUrl,
      expiresInMinutes: 30,
    });

    const sent = lastSentEmail();
    expect(sent.to).toBe('user@example.com');
    expect(sent.subject).toBe('Confirm your Kadence account deletion');
    expect(sent.html).toContain(deletionUrl);
    expect(sent.text).toContain(deletionUrl);
    expect(sent.text).toContain('30 minutes');
  });

  it('sends the post-deletion confirmation', async () => {
    const sender = new ResendEmailSender();

    await sender.sendAccountDeletedEmail({
      recipientEmail: 'user@example.com',
    });

    const sent = lastSentEmail();
    expect(sent.to).toBe('user@example.com');
    expect(sent.subject).toBe('Your Kadence account has been deleted');
    expect(sent.text).toContain('deleted');
  });

  it('translates an API-level Resend error without leaking it to the caller', async () => {
    mockEmails.send.mockResolvedValue({
      data: null,
      error: {
        message: 'The gmail.com domain is not verified',
        name: 'validation_error',
        statusCode: 403,
      },
      headers: null,
    });
    const sender = new ResendEmailSender();

    await expect(
      sender.sendPasswordResetEmail({
        recipientEmail: 'user@example.com',
        resetToken: 'abc123',
      }),
    ).rejects.toMatchObject({
      code: 'EMAIL_DELIVERY_FAILED',
      message: 'Could not send the email. Please try again.',
      httpStatus: 502,
    });

    // The provider detail is logged for operators, never surfaced.
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('validation_error'),
    );
  });

  it('translates a transport failure into the same domain error', async () => {
    mockEmails.send.mockRejectedValue(new Error('socket hang up'));
    const sender = new ResendEmailSender();

    await expect(
      sender.sendAccountDeletedEmail({ recipientEmail: 'user@example.com' }),
    ).rejects.toBeInstanceOf(EmailDeliveryError);
  });
});
