/**
 * The public handoff page behind the link in the password reset email.
 *
 * The email points at `https://<verified sending domain>/reset-password?token=`
 * because Resend treats a body link whose host/scheme does not match the From
 * domain as a spam signal. This page moves the user from that HTTPS URL into
 * the app through the `kadence://reset-password?token=` deep link.
 *
 * Two details drive the shape of this page:
 *
 * - iOS Safari and Android Chrome both allow a scheme change only while the
 *   page is a top-level navigation. The automatic `location.href` attempt runs
 *   on load, and the always-visible button is the user-gesture fallback that
 *   Chrome requires when the automatic attempt is ignored.
 * - The token is only ever moved from this page's query string into the deep
 *   link. It is not logged, persisted, or echoed into the inline script; the
 *   script reads the already-escaped `href` back off the anchor, so no
 *   request-controlled value is interpolated into executable code.
 *
 * The page is the last step of the password reset email flow, so it paints
 * itself from the same theme as that email (`email-theme.ts`) rather than
 * introducing a second copy of the brand palette.
 */

import {
  EmailColors,
  EmailFonts,
  withAlpha,
} from 'src/shared/email/email-theme';

export interface PasswordResetLandingPageOptions {
  /**
   * Absolute `kadence://reset-password?token=...` URL, or `null` when the
   * request carried no usable token (the page then explains the problem
   * instead of trying to open the app).
   */
  deepLink: string | null;
  /** Per-response CSP nonce for the inline style and script. */
  nonce: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Reads the deep link back off the anchor (already HTML-escaped), attempts it
 * once automatically, and reveals an install hint only if the page is still in
 * the foreground afterwards. Static: the CSP nonce is the sole per-request
 * variation in the document.
 */
const AUTO_OPEN_SCRIPT = `(function () {
  var button = document.getElementById('open-kadence');
  if (!button) return;
  var target = button.getAttribute('href');
  if (!target) return;

  var leftPage = false;
  var markLeft = function () { leftPage = true; };
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) markLeft();
  });
  window.addEventListener('pagehide', markLeft);
  window.addEventListener('blur', markLeft);

  // Best effort: a scheme change without a user gesture is ignored by some
  // in-app browsers, which is exactly why the button stays on screen.
  try { window.location.href = target; } catch (error) {}

  window.setTimeout(function () {
    if (leftPage || document.hidden) return;
    var hint = document.getElementById('install-hint');
    if (hint) hint.hidden = false;
  }, 2500);
})();`;

const PAGE_STYLES = `
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body { margin: 0; min-height: 100%; }
  body {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 28px 20px;
    background-color: ${EmailColors.canvas};
    background-image: radial-gradient(circle at 18% 12%, ${withAlpha(EmailColors.accentGlow, 0.28)}, transparent 46%), radial-gradient(circle at 84% 8%, ${withAlpha(EmailColors.cyan, 0.16)}, transparent 40%);
    color: ${EmailColors.textPrimary};
    font-family: ${EmailFonts.mono};
    -webkit-font-smoothing: antialiased;
  }
  main {
    width: 100%;
    max-width: 420px;
    background-color: ${EmailColors.card};
    border: 1px solid ${EmailColors.frame};
    border-radius: 16px;
    overflow: hidden;
    text-align: center;
  }
  .signal { height: 4px; background-image: linear-gradient(90deg, ${EmailColors.accentGlow} 0%, ${EmailColors.accentBright} 42%, ${EmailColors.cyan} 72%, ${EmailColors.success} 100%); }
  .inner { padding: 34px 28px 30px; }
  .wordmark { margin: 0 0 26px; font-size: 17px; font-weight: 700; letter-spacing: 3px; }
  .wordmark span { color: ${EmailColors.textFaint}; }
  h1 { margin: 0 0 14px; font-size: 23px; line-height: 1.35; letter-spacing: -0.2px; }
  p { margin: 0 0 22px; font-size: 14px; line-height: 1.65; color: ${EmailColors.textSecondary}; }
  .button {
    display: block;
    padding: 16px 20px;
    border-radius: 10px;
    background-image: linear-gradient(135deg, ${EmailColors.accent} 0%, ${EmailColors.accentBright} 48%, ${EmailColors.cyan} 100%);
    box-shadow: 0 16px 34px ${EmailColors.accentShadow};
    color: ${EmailColors.textPrimary};
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 1.6px;
    text-decoration: none;
  }
  .button:active { transform: translateY(1px); }
  .hint { margin: 20px 0 0; font-size: 12px; line-height: 1.6; color: ${EmailColors.textMuted}; }
  .hint a { color: ${EmailColors.link}; }
  .error { color: ${EmailColors.dangerText}; }
`;

function renderShell(inner: string): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="referrer" content="no-referrer" />
    <meta name="robots" content="noindex, nofollow, noarchive" />
    <meta name="theme-color" content="${EmailColors.canvas}" />
    <title>Reset your Kadence password</title>
    <style nonce="{NONCE}">{STYLES}</style>
  </head>
  <body>
    <main>
      <div class="signal"></div>
      <div class="inner">
        <p class="wordmark">KAD<span>ENCE</span></p>
${inner}
      </div>
    </main>
  </body>
</html>`;
}

/**
 * Renders the handoff document. `deepLink` is HTML-escaped before it reaches
 * the `href`, so a hostile token cannot break out of the attribute or inject
 * markup; the script never interpolates it at all.
 */
export function renderPasswordResetLandingPage({
  deepLink,
  nonce,
}: PasswordResetLandingPageOptions): string {
  const safeNonce = escapeHtml(nonce);

  const inner = deepLink
    ? `        <h1>Opening Kadence&hellip;</h1>
        <p>Your password reset is ready. We are opening the Kadence app to finish it.</p>
        <a id="open-kadence" class="button" href="${escapeHtml(deepLink)}" rel="noreferrer">OPEN KADENCE APP &rarr;</a>
        <p id="install-hint" class="hint" hidden>Nothing happened? Make sure the Kadence app is installed, then tap <strong>Open Kadence App</strong>.</p>
        <noscript>
          <p class="hint">JavaScript is disabled. Tap <strong>Open Kadence App</strong> above to continue.</p>
        </noscript>
        <script nonce="${safeNonce}">${AUTO_OPEN_SCRIPT}</script>`
    : `        <h1>Reset link incomplete</h1>
        <p class="error">This link is missing its reset token. Request a new password reset email from the Kadence app and use the freshest link.</p>`;

  return renderShell(inner)
    .replace('{NONCE}', () => safeNonce)
    .replace('{STYLES}', () => PAGE_STYLES);
}
