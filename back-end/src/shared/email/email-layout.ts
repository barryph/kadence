/**
 * The single Kadence email shell.
 *
 * Every transactional email renders through {@link renderEmailHtml}, so the
 * brand (canvas gradient, cyan/blue bloom, signal bar, wordmark, CTA, footer)
 * is defined exactly once and templates supply only their own copy. The visual
 * language mirrors the app: `email-theme.ts` holds the palette (structured like
 * `front-end/constants/theme.ts`) and `components/backgrounds/background.tsx`
 * is the reference for the bloom.
 *
 * Email-client constraints that shaped this file:
 * - Table layout, every declaration inline; no JS, no images, no <style>
 *   dependency (the only one is MSO-conditional), so it survives Gmail,
 *   Apple Mail, Outlook and Yahoo.
 * - Every translucent fill carries a solid `bgcolor` equivalent, because
 *   Outlook's engine ignores rgba and gradients. The solid tokens in
 *   `email-theme.ts` are those rgba fills composited over the card colour, so
 *   both paths look the same.
 * - Text colours are tuned to clear WCAG AA (4.5:1) on that card colour.
 */

import { EmailColors, EmailFonts, withAlpha } from './email-theme';

/** Fully-rendered email, ready for `emails.send()`. */
export interface EmailContent {
  subject: string;
  html: string;
  /** Plain-text alternative; always sent alongside the HTML. */
  text: string;
}

/**
 * A highlighted aside in the body. `variant` selects the accent so the tone
 * matches the message: cyan for neutral/expiry facts, green for a resolved
 * outcome, red for a destructive one.
 */
export interface EmailCallout {
  variant: 'expiry' | 'success' | 'danger';
  label: string;
  /** Optional second line, rendered in the muted sub-colour. */
  detail?: string;
}

/** The call to action. `variant` colours the button gradient and glow. */
export interface EmailCallToAction {
  label: string;
  url: string;
  variant?: 'primary' | 'danger';
}

/** Everything a template controls; the shell supplies the rest. */
export interface EmailBody {
  /** Inbox preview line; hidden in the body. */
  preheader: string;
  /** Small mono label above the heading, e.g. `PASSWORD RESET`. */
  eyebrow: string;
  heading: string;
  /** Plain-text paragraphs; escaped when rendered to HTML. */
  paragraphs: string[];
  callout?: EmailCallout;
  cta?: EmailCallToAction;
  footnote?: string;
}

interface Accent {
  /** Accent colour used for the callout rule, border and label text. */
  accent: string;
  /** Card-composited equivalent of `accent` at 6%, for clients without rgba. */
  surface: string;
}

const CALLOUT_ACCENTS: Record<EmailCallout['variant'], Accent> = {
  expiry: {
    accent: EmailColors.cyan,
    surface: EmailColors.calloutExpirySurface,
  },
  success: {
    accent: EmailColors.success,
    surface: EmailColors.calloutSuccessSurface,
  },
  danger: {
    accent: EmailColors.danger,
    surface: EmailColors.calloutDangerSurface,
  },
};

interface CtaStyle {
  /** Solid fill for Outlook's VML button (no gradient support). */
  fill: string;
  gradient: string;
  /** Card-composited equivalent of the glow at 10%. */
  ring: string;
  boxShadow: string;
}

const CTA_STYLES: Record<
  NonNullable<EmailCallToAction['variant']>,
  CtaStyle
> = {
  primary: {
    fill: EmailColors.accent,
    gradient: `linear-gradient(135deg,${EmailColors.accent} 0%,${EmailColors.accentBright} 48%,${EmailColors.cyan} 100%)`,
    ring: EmailColors.ctaRing,
    boxShadow: `box-shadow:0 18px 38px ${EmailColors.accentShadow},0 8px 18px ${EmailColors.shadow}`,
  },
  danger: {
    fill: EmailColors.dangerStrong,
    gradient: `linear-gradient(135deg,${EmailColors.dangerStrong} 0%,${EmailColors.danger} 55%,${EmailColors.dangerBright} 100%)`,
    ring: EmailColors.ctaDangerRing,
    boxShadow: `0 18px 38px ${EmailColors.dangerShadow},0 8px 18px ${EmailColors.shadow}`,
  },
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderParagraphs(paragraphs: string[]): string {
  return paragraphs
    .map(
      (paragraph) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:25px;color:${EmailColors.textSecondary};">${escapeHtml(paragraph)}</p>`,
    )
    .join('\n');
}

function renderCallout(callout: EmailCallout): string {
  const { accent, surface } = CALLOUT_ACCENTS[callout.variant];
  const detail = callout.detail
    ? `
      <br />
      <span style="font-weight:400;letter-spacing:0.6px;color:${EmailColors.textMuted};">${escapeHtml(callout.detail)}</span>`
    : '';

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:22px 0 28px;">
      <tr>
        <td bgcolor="${surface}" style="background-color:${surface};border-left:2px solid ${accent};border-radius:0 8px 8px 0;padding:13px 16px;font-family:${EmailFonts.mono};font-size:12px;line-height:18px;font-weight:600;letter-spacing:1.6px;color:${EmailColors.textSecondary};">
          ${escapeHtml(callout.label)}${detail}
        </td>
      </tr>
    </table>`;
}

function renderCta(cta: EmailCallToAction): string {
  const { fill, gradient, ring, boxShadow } =
    CTA_STYLES[cta.variant ?? 'primary'];
  const url = escapeHtml(cta.url);
  const label = escapeHtml(cta.label).replace(/ /g, '&nbsp;');
  const arrow = `${label}&nbsp;&#8594;`;

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
      <tr>
        <td style="padding:0 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
            <tr>
              <td align="center" bgcolor="${ring}" style="background-color:${ring};border-radius:12px;padding:3px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr>
                    <td align="center" bgcolor="${fill}" style="background-color:${fill};background-image:${gradient};border-radius:9px;">
                      <!--[if mso]>
                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:52px;v-text-anchor:middle;width:528px;" arcsize="18%" strokecolor="${fill}" fillcolor="${fill}">
                          <w:anchorlock />
                          <center style="color:${EmailColors.textPrimary};font-family:${EmailFonts.fallback};font-size:13px;font-weight:bold;letter-spacing:2px;">${arrow}</center>
                        </v:roundrect>
                      <![endif]-->
                      <!--[if !mso]><!-- -->
                      <a href="${url}" style="display:block;padding:17px 24px;font-family:${EmailFonts.mono};font-size:13px;line-height:18px;font-weight:700;letter-spacing:2px;color:${EmailColors.textPrimary};text-decoration:none;border-radius:9px;box-shadow:${boxShadow};">${arrow}</a>
                      <!--<![endif]-->
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

function renderFallbackUrl(url: string): string {
  const escaped = escapeHtml(url);

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
      <tr>
        <td style="padding:20px 32px 34px;">
          <p style="margin:0 0 12px;font-size:12px;line-height:19px;color:${EmailColors.textMuted};">
            Button not working? Copy the link below into your browser.
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
            <tr>
              <td bgcolor="${EmailColors.surface}" style="background-color:${EmailColors.surface};border:1px solid ${EmailColors.border};border-radius:8px;padding:12px 14px;font-family:${EmailFonts.monoSystem};font-size:11px;line-height:18px;word-break:break-all;word-wrap:break-word;color:${EmailColors.link};">
                <a href="${escaped}" style="color:${EmailColors.link};text-decoration:none;word-break:break-all;word-wrap:break-word;">${escaped}</a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;
}

/**
 * Builds the brand shell around a template's copy. All template strings are
 * escaped here, so callers pass plain text and never HTML.
 */
export function renderEmailHtml(body: EmailBody): string {
  const { preheader, eyebrow, heading, paragraphs, callout, cta, footnote } =
    body;

  // Without a URL block the body is shorter, so the footnote takes over the
  // bottom padding instead of leaving the shell with a dangling gap.
  const bodyTail = cta
    ? `${renderCta(cta)}

      ${renderFallbackUrl(cta.url)}

      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
        <tr>
          <td style="padding:0 32px;">
            ${renderFootnote(footnote, '0')}
          </td>
        </tr>
      </table>`
    : `
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
        <tr>
          <td style="padding:0 32px;">
            ${renderFootnote(footnote, '34px')}
          </td>
        </tr>
      </table>`;

  return `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <meta name="color-scheme" content="dark light" />
    <meta name="supported-color-schemes" content="dark light" />
    <meta name="theme-color" content="${EmailColors.canvas}" />
    <title>${escapeHtml(heading)}</title>
    <!-- Progressive enhancement: the app's real typeface where remote fonts load. -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;600;700&display=swap" rel="stylesheet" />
    <!--[if mso]>
      <style>
        /* Word's engine ignores web fonts; pin the closest available monospace. */
        * { font-family: ${EmailFonts.fallback} !important; }
      </style>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
    <![endif]-->
  </head>

  <body style="margin:0;padding:0;width:100%;background-color:${EmailColors.canvas};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

    <!-- Preheader: shown in the inbox preview, never in the body. -->
    <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${EmailColors.canvas};opacity:0;">
      ${escapeHtml(preheader)}
      &#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;
    </div>

    <!-- Outer canvas: the app's base gradient. -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${EmailColors.canvas}" style="background-color:${EmailColors.canvas};background-image:linear-gradient(180deg,${EmailColors.canvas} 0%,${EmailColors.canvasMid} 52%,${EmailColors.canvas} 100%);width:100%;">
      <tr>
        <td align="center" style="padding:40px 16px;">

          <!-- Card frame: 1px gradient hairline, degrading to the flat border. -->
          <!--[if mso]>
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td width="600">
          <![endif]-->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${EmailColors.frame}" style="width:100%;max-width:600px;background-color:${EmailColors.frame};background-image:linear-gradient(135deg,${withAlpha(EmailColors.accentGlow, 0.55)} 0%,${withAlpha(EmailColors.frame, 0.35)} 46%,${withAlpha(EmailColors.textPrimary, 0.1)} 100%);border-radius:16px;">
            <tr>
              <td style="padding:1px;">

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${EmailColors.card}" style="width:100%;background-color:${EmailColors.card};border-radius:15px;">

                  <!-- Top signal bar: the app's "goal met" gradient. -->
                  <tr>
                    <td bgcolor="${EmailColors.accentGlow}" height="4" style="height:4px;line-height:4px;font-size:0;background-color:${EmailColors.accentGlow};background-image:linear-gradient(90deg,${EmailColors.accentGlow} 0%,${EmailColors.accentBright} 42%,${EmailColors.cyan} 72%,${EmailColors.success} 100%);border-radius:15px 15px 0 0;">&nbsp;</td>
                  </tr>

                  <!--
                    Header + body share one gradient cell: the app paints radial
                    blooms over its base gradient, so this fakes the top-left blue
                    and top-right cyan bloom with corner linear gradients.
                  -->
                  <tr>
                    <td bgcolor="${EmailColors.card}" style="background-color:${EmailColors.card};background-image:linear-gradient(135deg,${withAlpha(EmailColors.accentGlow, 0.3)} 0%,${withAlpha(EmailColors.accentGlow, 0.05)} 30%,${withAlpha(EmailColors.accentGlow, 0)} 52%),linear-gradient(225deg,${withAlpha(EmailColors.cyan, 0.15)} 0%,${withAlpha(EmailColors.cyan, 0)} 38%);font-family:${EmailFonts.mono};">

                      <!-- Header -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                        <tr>
                          <td style="padding:28px 32px;border-bottom:1px solid ${EmailColors.border};">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                              <tr>
                                <td align="left" style="font-family:${EmailFonts.mono};font-size:19px;line-height:24px;font-weight:700;letter-spacing:3px;color:${EmailColors.textPrimary};">
                                  KAD<span style="color:${EmailColors.textFaint};">ENCE</span>
                                </td>
                                <td align="right" style="font-family:${EmailFonts.mono};font-size:10px;line-height:14px;font-weight:600;letter-spacing:2px;color:${EmailColors.eyebrow};white-space:nowrap;">
                                  <span style="color:${EmailColors.cyan};">&#9679;</span>&nbsp;SECURITY
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>

                      <!-- Body -->
                      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                        <tr>
                          <td style="padding:34px 32px 0;">

                            <p style="margin:0 0 16px;font-size:11px;line-height:16px;font-weight:600;letter-spacing:2.5px;color:${EmailColors.eyebrow};">
                              <span style="color:${EmailColors.accentGlow};">&#9646;</span>&nbsp;${escapeHtml(eyebrow).replace(/ /g, '&nbsp;')}
                            </p>

                            <h1 style="margin:0 0 18px;font-size:29px;line-height:37px;font-weight:700;letter-spacing:-0.3px;color:${EmailColors.textPrimary};">
                              ${escapeHtml(heading)}
                            </h1>

                            ${renderParagraphs(paragraphs)}
                            ${callout ? `\n${renderCallout(callout)}\n` : ''}
                          </td>
                        </tr>
                      </table>

                    ${bodyTail}

                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td bgcolor="${EmailColors.card}" style="background-color:${EmailColors.card};padding:22px 32px 28px;border-top:1px solid ${EmailColors.border};">
                      <p style="margin:0;font-family:${EmailFonts.mono};font-size:10px;line-height:16px;letter-spacing:1.4px;color:${EmailColors.textSubtle};">
                        KADENCE &middot; EXERCISE TRACKING, ON YOUR SCHEDULE
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
          <!--[if mso]>
          </td></tr></table>
          <![endif]-->

          <!-- Postscript -->
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
            <tr>
              <td align="center" style="padding:18px 8px 0;font-family:${EmailFonts.mono};font-size:10px;line-height:16px;letter-spacing:1.2px;color:${EmailColors.textSubtle};">
                SENT BY KADENCE
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function renderFootnote(
  footnote: string | undefined,
  bottomPadding: string,
): string {
  if (!footnote) {
    return '';
  }

  return `
    <p style="margin:0 0 ${bottomPadding};font-family:${EmailFonts.mono};font-size:12px;line-height:19px;color:${EmailColors.textMuted};">
      ${escapeHtml(footnote)}
    </p>`;
}

/** Plain-text alternative, built from the same body model. */
export function renderEmailText(body: EmailBody): string {
  const parts = [body.heading, '', ...body.paragraphs];

  if (body.callout) {
    parts.push(
      '',
      body.callout.label,
      ...(body.callout.detail ? [body.callout.detail] : []),
    );
  }

  if (body.cta) {
    // The HTML paints this as a button; plain text has no button, so keep the
    // label beside the URL and the link still says what it does.
    parts.push('', `${body.cta.label}: ${body.cta.url}`);
  }

  if (body.footnote) {
    parts.push('', body.footnote);
  }

  return parts.join('\n');
}

/** Pairs a subject with both renderings of one body. */
export function buildEmail(subject: string, body: EmailBody): EmailContent {
  return {
    subject,
    html: renderEmailHtml(body),
    text: renderEmailText(body),
  };
}
