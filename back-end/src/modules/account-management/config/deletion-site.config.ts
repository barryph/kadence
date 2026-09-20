import { SUPPORT_EMAIL } from '../../../shared/email/email.config';

/**
 * The account-deletion site: a static page, outside the app, that satisfies
 * Google Play's requirement that an account can be deleted from the web. This
 * backend does not serve it; it only links to it.
 *
 * When it is not configured the verification email carries a `mailto:` link to
 * the shared support address instead, so the flow still completes on every
 * environment (including local development and CI).
 */
export interface DeleteAccountLink {
  /** `web` when the static site is configured, `mailto` otherwise. */
  kind: 'web' | 'mailto';
  url: string;
}

/**
 * Builds the single-use link that finishes the flow. The token is the only
 * credential in it, so the URL must never be logged.
 */
export function buildDeleteAccountLink(
  recipientEmail: string,
  token: string,
): DeleteAccountLink {
  const siteUrl = resolveAccountDeletionSiteUrl();
  if (siteUrl) {
    return {
      kind: 'web',
      url: `${siteUrl}/delete-account/confirm/?token=${encodeURIComponent(token)}`,
    };
  }

  const subject = 'Delete my Kadence account';
  const body = [
    'I want to permanently delete my Kadence account.',
    '',
    `Verification token: ${token}`,
  ].join('\n');
  return {
    kind: 'mailto',
    url: `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`,
  };
}

/**
 * Configuration check run at startup. The site URL is optional, but a
 * *malformed* one must fail loudly rather than be emailed to users: it would
 * produce a link that goes nowhere and a deletion request nobody can complete.
 *
 * @returns the configured site URL, or `null` when the mailto fallback is in use.
 */
export function resolveAccountDeletionSiteUrl(
  env: NodeJS.ProcessEnv = process.env,
): string | null {
  const raw = env.ACCOUNT_DELETION_SITE_URL?.trim();
  if (!raw || raw === '') {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    throw new Error(
      'env.ACCOUNT_DELETION_SITE_URL must be an absolute http(s) URL',
    );
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error(
      'env.ACCOUNT_DELETION_SITE_URL must be an absolute http(s) URL',
    );
  }

  return raw.replace(/\/+$/, '');
}
