import { renderPasswordResetLandingPage } from './password-reset-landing.page';

const NONCE = 'test-nonce';

describe('renderPasswordResetLandingPage', () => {
  it('embeds the deep link and the auto-open script when a token is present', () => {
    const html = renderPasswordResetLandingPage({
      deepLink: 'kadence://reset-password?token=abc123',
      nonce: NONCE,
    });

    expect(html).toContain('href="kadence://reset-password?token=abc123"');
    expect(html).toContain("document.getElementById('open-kadence')");
    // The visible label is sentence case, matching the email's CTA.
    expect(html).toContain('Open Kadence app');
  });

  it('escapes a hostile token so it cannot break out of the href', () => {
    const html = renderPasswordResetLandingPage({
      deepLink: 'kadence://reset-password?token="><script>alert(1)</script>',
      nonce: NONCE,
    });

    expect(html).not.toContain('<script>alert(1)</script>');
    expect(html).toContain('&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('renders an error state without a deep link or script when the token is missing', () => {
    const html = renderPasswordResetLandingPage({
      deepLink: null,
      nonce: NONCE,
    });

    expect(html).toContain('Reset link incomplete');
    expect(html).not.toContain('open-kadence');
    expect(html).not.toContain('kadence://');
  });

  it('puts the CSP nonce on the inline style and script', () => {
    const html = renderPasswordResetLandingPage({
      deepLink: 'kadence://reset-password?token=abc123',
      nonce: NONCE,
    });

    expect(html).toContain('<style nonce="test-nonce">');
    expect(html).toContain('<script nonce="test-nonce">');
  });
});
