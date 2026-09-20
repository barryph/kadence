import {
  renderAccountDeletedEmail,
  renderAccountDeletionEmail,
  renderPasswordResetEmail,
} from './email-templates';

// Every template renders a plain-text alternative from the same body model as
// its HTML. These tests guard the parts a reader actually relies on: the copy,
// the labelled link, and the absence of HTML that a text-only client would show
// as markup.
describe('transactional email plain-text alternatives', () => {
  const containsHtml = /<[^>]+>/;
  const containsMarkup = /style=|font-family|background-color|&nbsp;|&#/;

  it('renders the password reset copy and the labelled reset link', () => {
    const resetUrl = 'https://kadence.barryph.com/reset-password?token=abc123';
    const email = renderPasswordResetEmail(resetUrl);

    expect(email.text).toContain('Reset your password');
    expect(email.text).toContain('Expires in 20 minutes');
    expect(email.text).toContain(`Reset password: ${resetUrl}`);
    expect(email.text).not.toMatch(containsHtml);
    expect(email.text).not.toMatch(containsMarkup);
  });

  it('renders the deletion link with its expiry and confirmation prompt', () => {
    const deletionUrl = 'https://delete.kadence.app/delete?token=xyz';
    const email = renderAccountDeletionEmail(deletionUrl, 30);

    expect(email.text).toContain('Confirm account deletion');
    expect(email.text).toContain('Permanent and irreversible');
    expect(email.text).toContain('Link expires in 30 minutes');
    expect(email.text).toContain(`Confirm deletion: ${deletionUrl}`);
    expect(email.text).not.toMatch(containsHtml);
  });

  it('renders the post-deletion confirmation without a link', () => {
    const email = renderAccountDeletedEmail();

    expect(email.text).toContain('Your account has been deleted');
    expect(email.text).toContain('Thanks for tracking with Kadence');
    expect(email.text).not.toMatch(containsHtml);
  });

  it('separates the heading, body and footnote into readable blocks', () => {
    const email = renderPasswordResetEmail('https://example.com/reset');

    expect(email.text.startsWith('Reset your password\n\n')).toBe(true);
    // No leading or trailing whitespace for a text-only client to collapse.
    expect(email.text).toBe(email.text.trim());
    expect(email.text).toContain('\n\n');
  });
});
