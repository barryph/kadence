export interface EmailContent {
  subject: string;
  html: string;
  /** Plain-text alternative; always sent alongside the HTML. */
  text: string;
}

interface EmailBody {
  heading: string;
  /** Plain-text paragraphs; escaped when rendered to HTML. */
  paragraphs: string[];
  cta?: { label: string; url: string };
  footnote?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Minimal inline-styled layout: email clients strip stylesheets and many block
 * `<style>`, so every rule lives on the element.
 */
function renderHtml(body: EmailBody): string {
  const { heading, paragraphs, cta, footnote } = body;
  const paragraphsHtml = paragraphs
    .map(
      (paragraph) =>
        `      <p style="margin:0 0 16px;font-size:15px;line-height:24px;">${escapeHtml(
          paragraph,
        )}</p>`,
    )
    .join('\n');

  const ctaHtml = cta
    ? `      <p style="margin:0 0 24px;">
        <a href="${escapeHtml(cta.url)}" style="display:inline-block;padding:12px 20px;background-color:#18181b;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;border-radius:8px;">${escapeHtml(
          cta.label,
        )}</a>
      </p>
      <p style="margin:0 0 8px;font-size:13px;line-height:20px;color:#52525b;">If the button doesn't work, copy and paste this link into your browser:</p>
      <p style="margin:0 0 24px;font-size:13px;line-height:20px;word-break:break-all;"><a href="${escapeHtml(
        cta.url,
      )}" style="color:#2563eb;">${escapeHtml(cta.url)}</a></p>`
    : '';

  const footnoteHtml = footnote
    ? `      <p style="margin:0;font-size:13px;line-height:20px;color:#52525b;">${escapeHtml(
        footnote,
      )}</p>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
  <body style="margin:0;padding:24px;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#18181b;">
    <div style="max-width:480px;margin:0 auto;padding:32px;background-color:#ffffff;border-radius:12px;">
      <h1 style="margin:0 0 16px;font-size:20px;line-height:28px;">${escapeHtml(
        heading,
      )}</h1>
${paragraphsHtml}
${ctaHtml}
${footnoteHtml}
    </div>
  </body>
</html>`;
}

function renderText(body: EmailBody): string {
  const parts = [body.heading, '', ...body.paragraphs];
  if (body.cta) {
    parts.push('', body.cta.url);
  }
  if (body.footnote) {
    parts.push('', body.footnote);
  }
  return parts.join('\n');
}

function buildEmail(subject: string, body: EmailBody): EmailContent {
  return { subject, html: renderHtml(body), text: renderText(body) };
}

export function renderPasswordResetEmail(resetUrl: string): EmailContent {
  return buildEmail('Reset your Kadence password', {
    heading: 'Reset your password',
    paragraphs: [
      'We received a request to reset your Kadence password. Open the link below to choose a new one. The link can only be used once.',
    ],
    cta: { label: 'Reset password', url: resetUrl },
    footnote:
      "If you didn't request this, you can safely ignore this email — your password won't change.",
  });
}

export function renderAccountDeletionEmail(
  deletionUrl: string,
  expiresInMinutes: number,
): EmailContent {
  return buildEmail('Confirm your Kadence account deletion', {
    heading: 'Confirm account deletion',
    paragraphs: [
      `We received a request to permanently delete your Kadence account. Open the link below to confirm. It expires in ${expiresInMinutes} minutes and can only be used once — if it expires, you can request a new one.`,
    ],
    cta: { label: 'Confirm deletion', url: deletionUrl },
    footnote:
      "If you didn't request this, you can ignore this email — your account won't be deleted.",
  });
}

export function renderAccountDeletedEmail(): EmailContent {
  return buildEmail('Your Kadence account has been deleted', {
    heading: 'Your account has been deleted',
    paragraphs: [
      'Your Kadence account and all of its data have been permanently deleted.',
    ],
    footnote:
      "If you didn't request this, contact support as soon as possible.",
  });
}
