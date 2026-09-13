/**
 * Writes every transactional email to `emails/.preview/*.html` (gitignored) by
 * calling the real renderers — so the preview can never drift from what Resend
 * actually receives.
 *
 *   pnpm run email:preview
 *
 * Then open a file in a browser, or feed it to Resend's "send test email" /
 * a real send. Change the sample values below when a template gains a slot.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import {
  renderAccountDeletedEmail,
  renderAccountDeletionEmail,
  renderPasswordResetEmail,
} from '../src/shared/email/email-templates';

const OUT = 'emails/.preview';

const emails = [
  [
    'password-reset',
    renderPasswordResetEmail(
      'kadence://reset-password?token=7f3a9c1e5b8d2a406f1c9e7b3d5a8204c6e1f9a2',
    ),
  ],
  [
    'account-deletion',
    renderAccountDeletionEmail(
      'https://kadence.app/delete?token=8c1d4e7a2b9f3c6d0e5a8b1f4c7d2e9a',
      30,
    ),
  ],
  ['account-deleted', renderAccountDeletedEmail()],
] as const;

mkdirSync(OUT, { recursive: true });

for (const [name, content] of emails) {
  writeFileSync(`${OUT}/${name}.html`, content.html);
  console.log(
    `${name}: "${content.subject}" (html ${content.html.length}b, text ${content.text.length}b)`,
  );
}

// A single page with all of them side by side, for one screenshot.
const sheets = emails
  .map(
    ([name]) =>
      `<div><div style="padding:0 0 8px 4px;font-size:12px;letter-spacing:2px">${name.toUpperCase()}</div><iframe src="./${name}.html" width="680" height="1200" style="border:1px solid #1a4163;border-radius:8px;background:#050711"></iframe></div>`,
  )
  .join('');

writeFileSync(
  `${OUT}/all.html`,
  `<html><body style="margin:0;background:#02030a;display:flex;gap:18px;padding:24px;align-items:flex-start;font-family:monospace;color:#8fd4ff">${sheets}</body></html>`,
);
