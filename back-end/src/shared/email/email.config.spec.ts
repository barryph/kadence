import {
  DEFAULT_EMAIL_FROM,
  DEFAULT_EMAIL_PASSWORD_RESET_DEEP_LINK,
  DEFAULT_EMAIL_PASSWORD_RESET_URL,
  loadEmailConfig,
  SUPPORT_EMAIL,
} from './email.config';

const ENV_KEYS = [
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'EMAIL_REPLY_TO',
  'EMAIL_PASSWORD_RESET_URL',
  'EMAIL_PASSWORD_RESET_DEEP_LINK',
] as const;

describe('loadEmailConfig', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (originalEnv[key] === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = originalEnv[key];
      }
    }
  });

  it('defaults to the Kadence sender, HTTPS reset link and app deep link', () => {
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }

    const config = loadEmailConfig();

    expect(config).toEqual({
      resendApiKey: null,
      from: 'Kadence <notifications@mail.kadence.barryph.com>',
      replyTo: SUPPORT_EMAIL,
      passwordResetUrl: DEFAULT_EMAIL_PASSWORD_RESET_URL,
      passwordResetDeepLink: DEFAULT_EMAIL_PASSWORD_RESET_DEEP_LINK,
    });
    expect(config.from).toBe(DEFAULT_EMAIL_FROM);
    expect(config.replyTo).toBe('support+codecompletelabs@gmail.com');
    // The emailed link must live on the verified sending domain; a custom
    // `kadence://` scheme in the body is what triggered the spam filtering.
    expect(config.passwordResetUrl).toBe(
      'https://kadence.barryph.com/reset-password',
    );
    expect(config.passwordResetDeepLink).toBe('kadence://reset-password');
  });

  it('reads overrides from the environment', () => {
    process.env.RESEND_API_KEY = '  re_test_key  ';
    process.env.EMAIL_FROM = 'Kadence <no-reply@kadence.app>';
    process.env.EMAIL_PASSWORD_RESET_URL = 'https://app.kadence.dev/reset';
    process.env.EMAIL_PASSWORD_RESET_DEEP_LINK = 'kadence-dev://reset-password';

    const config = loadEmailConfig();

    expect(config).toEqual({
      resendApiKey: 're_test_key',
      from: 'Kadence <no-reply@kadence.app>',
      replyTo: SUPPORT_EMAIL,
      passwordResetUrl: 'https://app.kadence.dev/reset',
      passwordResetDeepLink: 'kadence-dev://reset-password',
    });
  });

  it('keeps Reply-To pinned to the support address', () => {
    // Every email replies to the support inbox, so a stale EMAIL_REPLY_TO
    // override must not be able to point replies somewhere else.
    process.env.EMAIL_REPLY_TO = 'support@kadence.app';

    expect(loadEmailConfig().replyTo).toBe(SUPPORT_EMAIL);
  });

  it('treats blank values as unset and falls back to defaults', () => {
    process.env.RESEND_API_KEY = '   ';
    process.env.EMAIL_FROM = '';
    process.env.EMAIL_REPLY_TO = '  ';
    process.env.EMAIL_PASSWORD_RESET_URL = '';
    process.env.EMAIL_PASSWORD_RESET_DEEP_LINK = '   ';

    const config = loadEmailConfig();

    expect(config.resendApiKey).toBeNull();
    expect(config.from).toBe(DEFAULT_EMAIL_FROM);
    expect(config.replyTo).toBe(SUPPORT_EMAIL);
    expect(config.passwordResetUrl).toBe(DEFAULT_EMAIL_PASSWORD_RESET_URL);
    expect(config.passwordResetDeepLink).toBe(
      DEFAULT_EMAIL_PASSWORD_RESET_DEEP_LINK,
    );
  });

  it('accepts an explicit environment object', () => {
    const config = loadEmailConfig({
      RESEND_API_KEY: 're_from_argument',
      EMAIL_FROM: 'Kadence <test@kadence.app>',
    });

    expect(config.resendApiKey).toBe('re_from_argument');
    expect(config.from).toBe('Kadence <test@kadence.app>');
  });
});
