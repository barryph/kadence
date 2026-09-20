/**
 * Sender identity used for all transactional email. Resend only accepts a
 * `from` on a verified sending domain (or a Resend-managed onboarding sender),
 * so this is environment-specific configuration rather than a hard-coded
 * constant; the default is the project's Kadence sender.
 */
export const DEFAULT_EMAIL_FROM =
  'Kadence <notifications@mail.kadence.barryph.com>';

/**
 * The one support address. It is the `Reply-To` on every email.
 */
export const SUPPORT_EMAIL = 'support+codecompletelabs@gmail.com';

/**
 * Password Reset url used in emails.
 * Its a handioff web page deeplinking to the apps password reset page, a redirect of kinds.
 * The email must link to the web domain to avoid spam filters, which is why we
 * don't include the deeplink directly in the email.
 */
export const DEFAULT_EMAIL_PASSWORD_RESET_URL =
  'https://kadence.barryph.com/reset-password';

/**
 * Deeplink for the above reset password handoff page.
 */
export const DEFAULT_EMAIL_PASSWORD_RESET_DEEP_LINK =
  'kadence://reset-password';

export interface EmailConfig {
  /** Resend API key; `null` when the environment does not configure one. */
  resendApiKey: string | null;
  /** `from` identity for every transactional email. */
  from: string;
  /** Always {@link SUPPORT_EMAIL}; present so callers read one config object. */
  replyTo: string;
  /** Public HTTPS base the reset token is appended to as `?token=`. */
  passwordResetUrl: string;
  /** Custom-scheme base the handoff endpoint redirects into as `?token=`. */
  passwordResetDeepLink: string;
}

function readOptional(raw: string | undefined): string | null {
  const value = raw?.trim();
  return value ? value : null;
}

/**
 * Reads transactional-email configuration from the environment. Kept as a
 * plain loader (like `loadOAuthConfig`) so it can be unit tested and so the
 * Resend SDK is never imported outside the email infrastructure.
 */
export function loadEmailConfig(
  env: NodeJS.ProcessEnv = process.env,
): EmailConfig {
  return {
    resendApiKey: readOptional(env.RESEND_API_KEY),
    from: readOptional(env.EMAIL_FROM) ?? DEFAULT_EMAIL_FROM,
    replyTo: SUPPORT_EMAIL,
    passwordResetUrl:
      readOptional(env.EMAIL_PASSWORD_RESET_URL) ??
      DEFAULT_EMAIL_PASSWORD_RESET_URL,
    passwordResetDeepLink:
      readOptional(env.EMAIL_PASSWORD_RESET_DEEP_LINK) ??
      DEFAULT_EMAIL_PASSWORD_RESET_DEEP_LINK,
  };
}
