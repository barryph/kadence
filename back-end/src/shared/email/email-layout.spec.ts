import { SUPPORT_EMAIL } from './email.config';
import { renderEmailHtml, type EmailBody } from './email-layout';

const BODY: EmailBody = {
  preheader: 'Reset your Kadence password - this link expires in 20 minutes.',
  eyebrow: 'Password reset',
  heading: 'Reset your password',
  paragraphs: [
    'We got a request to reset the password on your Kadence account.',
  ],
  callout: { variant: 'expiry', label: 'Expires in 20 minutes' },
  cta: {
    label: 'Reset password',
    url: 'https://kadence.barryph.com/reset-password?token=abc123',
  },
  footnote: "If you didn't request this, you can ignore this email.",
};

/**
 * The shell's job is to stay boring: the HTML is plain, self-contained and
 * readable by a client that understands only tables and inline styles. These
 * tests pin the properties that made it that way, because each one is easy to
 * reintroduce with a single "nicer" edit.
 */
describe('email shell', () => {
  it('declares a light colour scheme so clients do not invert the card', () => {
    const html = renderEmailHtml(BODY);

    expect(html).toContain('<meta name="color-scheme" content="light"');
    expect(html).toContain(
      '<meta name="supported-color-schemes" content="light"',
    );
  });

  it('loads nothing: no font, image, stylesheet or tracking request', () => {
    const html = renderEmailHtml(BODY);
    const external = [
      /<link\b/i,
      /<img\b/i,
      /<script\b/i,
      /@import/i,
      /@font-face/i,
      /background-image/i,
      /\bsrc=/i,
      /fonts\.(googleapis|gstatic)\.com/i,
    ];

    for (const pattern of external) {
      expect({ pattern: String(pattern), found: pattern.test(html) }).toEqual({
        pattern: String(pattern),
        found: false,
      });
    }
  });

  it('links only to the CTA target and the support address', () => {
    const html = renderEmailHtml(BODY);
    const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map(
      (match) => match[1],
    );

    expect(new Set(hrefs)).toEqual(
      new Set([BODY.cta?.url, `mailto:${SUPPORT_EMAIL}`]),
    );
  });

  it('shows the same support address it links to', () => {
    const html = renderEmailHtml(BODY);

    // The footer used to link the support mailbox but print a different
    // address, which invites replies to somewhere nobody reads.
    expect(html).toContain(`<a href="mailto:${SUPPORT_EMAIL}"`);
    expect(html).toContain(`>${SUPPORT_EMAIL}</a>`);
  });

  it('stays table-based and inline-styled for old rendering engines', () => {
    const html = renderEmailHtml(BODY);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('role="presentation"');
    expect(html).toContain('cellpadding="0"');
    expect(html).toContain('bgcolor=');
    // No gradient survives into a client that ignores it anyway.
    expect(html).not.toMatch(/linear-gradient|radial-gradient/);
    // Existing client quirks are handled by conditional comments, not a
    // stylesheet: every <style> element sits inside an Outlook-only block.
    expect(html.match(/<style>/g)).toHaveLength(1);
    expect(html).toContain('<!--[if mso]>');
  });

  it('keeps the card a real CSS box so its radius and shadow clip', () => {
    const html = renderEmailHtml(BODY);

    // A display:table card loses border-radius in Chromium-based clients and
    // the accent bar spills past square corners, so the card is a block-level
    // div with the layout table inside it.
    const card = html.match(/<div class="kadence-card" style="([^"]+)"/)?.[1];
    expect(card).toBeDefined();
    expect(card).toContain('box-sizing:border-box');
    expect(card).toContain('border-radius:');
    expect(card).toContain('box-shadow:');
    expect(html).toMatch(/<div class="kadence-card"[^>]*>\s*<table/);
    // Outlook gets a fixed width instead of the max-width it ignores.
    expect(html).toContain('width:600px');
  });

  it('renders the badge, body, callout, CTA and both fallbacks', () => {
    const html = renderEmailHtml(BODY);

    expect(html).toContain('KAD<span');
    expect(html).toContain('Password reset');
    expect(html).toContain('<h1');
    expect(html).toContain('Expires in 20 minutes');
    expect(html).toContain(`href="${BODY.cta?.url}"`);
    expect(html).toContain(BODY.cta?.url);
    expect(html).toContain('If the button does not work');
    expect(html).toContain(BODY.footnote);
  });

  it('previews the preheader in the inbox and hides it in the body', () => {
    const html = renderEmailHtml(BODY);

    expect(html).toContain(BODY.preheader);
    expect(html).toMatch(
      /display:none;max-height:0;overflow:hidden;mso-hide:all/,
    );
  });

  it('escapes template copy instead of interpolating markup', () => {
    const html = renderEmailHtml({
      ...BODY,
      heading: '<script>alert(1)</script>',
      paragraphs: ['A & B <b>bold</b>'],
      callout: { variant: 'danger', label: 'Permanent & irreversible' },
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).toContain('A &amp; B &lt;b&gt;bold&lt;/b&gt;');
    expect(html).toContain('Permanent &amp; irreversible');
  });

  it('omits the CTA block entirely when a template has no link', () => {
    const html = renderEmailHtml({
      preheader: 'Your account is gone.',
      eyebrow: 'Account deletion',
      heading: 'Your account has been deleted',
      paragraphs: ['Your Kadence account has been permanently deleted.'],
    });

    expect(html).not.toContain('If the button does not work');
    // Only the support address remains; nothing invites a click-through.
    expect([...html.matchAll(/href="([^"]+)"/g)]).toHaveLength(1);
  });
});
