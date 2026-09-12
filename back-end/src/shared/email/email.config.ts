/**
 * Sender identity used for all transactional email. Resend only accepts a
 * `from` on a verified sending domain (or a Resend-managed onboarding sender),
 * so this is environment-specific configuration rather than a hard-coded
 * constant; the default is the project's Kadence sender.
 */
export const DEFAULT_EMAIL_FROM =
  'Kadence <kadence+codecompletelabs@gmail.com>';

/**
 * Deep link embedded in password reset emails. It must match the app's URL
 * scheme (`scheme` in `front-end/app.json`) and the `reset-password` route,
 * which reads the `token` query parameter. (Account-deletion links are built by
 * the account-management module and arrive in the payload fully formed.)
 */
export const DEFAULT_EMAIL_PASSWORD_RESET_URL = 'kadence://reset-password';

export interface EmailConfig {
  /** Resend API key; `null` when the environment does not configure one. */
  resendApiKey: string | null;
  /** `from` identity for every transactional email. */
  from: string;
  /** Optional `Reply-To`; omitted from the message when `null`. */
  replyTo: string | null;
  /** Base deep link the reset token is appended to as `?token=`. */
  passwordResetUrl: string;
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
    replyTo: readOptional(env.EMAIL_REPLY_TO),
    passwordResetUrl:
      readOptional(env.EMAIL_PASSWORD_RESET_URL) ??
      DEFAULT_EMAIL_PASSWORD_RESET_URL,
  };
}
