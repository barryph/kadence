import { buildEmail, type EmailContent } from './email-layout';

export type { EmailContent };

/**
 * One function per transactional email. The shell (brand, layout, escaping,
 * plain-text fallback) belongs to `email-layout.ts`; these only describe the
 * copy that differs. Adding an email is a new function here plus a port method,
 * not a new HTML document.
 */

export function renderPasswordResetEmail(resetUrl: string): EmailContent {
  return buildEmail('Reset your Kadence password', {
    preheader: 'Reset your Kadence password - this link expires in 20 minutes.',
    eyebrow: 'Password reset',
    heading: 'Reset your password',
    paragraphs: [
      'We got a request to reset the password on your Kadence account. Choose a new one with the button below.',
    ],
    callout: {
      variant: 'expiry',
      label: 'Expires in 20 minutes',
      detail: 'Single use · then it stops working',
    },
    cta: { label: 'Reset password', url: resetUrl },
    footnote:
      "If you didn't request this, you can ignore this email - your password stays the same and nobody can sign in with this link.",
  });
}

export function renderAccountDeletionEmail(
  deletionUrl: string,
  expiresInMinutes: number,
): EmailContent {
  return buildEmail('Confirm your Kadence account deletion', {
    preheader: `Confirm your account deletion - this link expires in ${expiresInMinutes} minutes.`,
    eyebrow: 'Account deletion',
    heading: 'Confirm account deletion',
    paragraphs: [
      'We got a request to permanently delete your Kadence account and all of its data. This cannot be undone.',
    ],
    callout: {
      variant: 'danger',
      label: 'Permanent & irreversible',
      detail: `Link expires in ${expiresInMinutes} minutes · single use`,
    },
    cta: { label: 'Confirm deletion', url: deletionUrl, variant: 'danger' },
    footnote:
      "If you didn't request this, ignore this email - your account won't be deleted.",
  });
}

export function renderAccountDeletedEmail(): EmailContent {
  return buildEmail('Your Kadence account has been deleted', {
    preheader: 'Your Kadence account and all of its data have been deleted.',
    eyebrow: 'Account deletion',
    heading: 'Your account has been deleted',
    paragraphs: [
      'Your Kadence account and all of its data have been permanently deleted.',
      'Thanks for tracking with Kadence. You can create a new account at any time.',
    ],
    callout: {
      variant: 'success',
      label: 'Deletion complete',
    },
    footnote:
      "If you didn't request this, contact support as soon as possible.",
  });
}
