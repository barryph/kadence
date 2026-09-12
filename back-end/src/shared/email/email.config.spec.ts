import {
  DEFAULT_EMAIL_FROM,
  DEFAULT_EMAIL_PASSWORD_RESET_URL,
  loadEmailConfig,
} from './email.config';

const ENV_KEYS = [
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'EMAIL_REPLY_TO',
  'EMAIL_PASSWORD_RESET_URL',
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

  it('defaults to the Kadence sender and the app reset deep link', () => {
    for (const key of ENV_KEYS) {
      delete process.env[key];
    }

    const config = loadEmailConfig();

    expect(config).toEqual({
      resendApiKey: null,
      from: 'Kadence <kadence+codecompletelabs@gmail.com>',
      replyTo: null,
      passwordResetUrl: DEFAULT_EMAIL_PASSWORD_RESET_URL,
    });
    expect(config.from).toBe(DEFAULT_EMAIL_FROM);
  });

  it('reads overrides from the environment', () => {
    process.env.RESEND_API_KEY = '  re_test_key  ';
    process.env.EMAIL_FROM = 'Kadence <no-reply@kadence.app>';
    process.env.EMAIL_REPLY_TO = 'support@kadence.app';
    process.env.EMAIL_PASSWORD_RESET_URL = 'https://app.kadence.dev/reset';

    const config = loadEmailConfig();

    expect(config).toEqual({
      resendApiKey: 're_test_key',
      from: 'Kadence <no-reply@kadence.app>',
      replyTo: 'support@kadence.app',
      passwordResetUrl: 'https://app.kadence.dev/reset',
    });
  });

  it('treats blank values as unset and falls back to defaults', () => {
    process.env.RESEND_API_KEY = '   ';
    process.env.EMAIL_FROM = '';
    process.env.EMAIL_REPLY_TO = '  ';
    process.env.EMAIL_PASSWORD_RESET_URL = '';

    const config = loadEmailConfig();

    expect(config.resendApiKey).toBeNull();
    expect(config.from).toBe(DEFAULT_EMAIL_FROM);
    expect(config.replyTo).toBeNull();
    expect(config.passwordResetUrl).toBe(DEFAULT_EMAIL_PASSWORD_RESET_URL);
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
