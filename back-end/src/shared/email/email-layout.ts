/**
 * The single Kadence email shell.
 *
 * Every transactional email renders through {@link renderEmailHtml}, so the
 * brand (wordmark, accent bar, badge, CTA, footer) is defined once and templates
 * supply only their own copy. The look follows the public account site
 * (`kadence-static/src/styles/global.css`): a white card on a light page, one
 * system typeface, a single blue for actions and a flat red for destructive
 * ones. `email-theme.ts` holds the palette.
 *
 * Security email has to survive three audiences at once - the recipient, the
 * spam filter, and a mail client written before CSS was - so the shell is
 * deliberately plain:
 * - Table layout, every declaration inline, no web font, no image, no external
 *   request of any kind. The only conditional markup is the Outlook VML button.
 * - Solid colours only: no gradient and no translucency. The one rgba value,
 *   the card shadow, is decoration a client may drop without losing meaning.
 * - Text clears WCAG AA (4.5:1) against the surface it sits on.
 * - One obvious primary action, plus a plain-text URL for clients that strip
 *   the button, and a preheader that previews the message instead of repeating
 *   the subject.
 */

import { SUPPORT_EMAIL } from './email.config';
import { EmailColors, EmailFonts } from './email-theme';

/** Fully-rendered email, ready for `emails.send()`. */
export interface EmailContent {
  subject: string;
  html: string;
  /** Plain-text alternative; always sent alongside the HTML. */
  text: string;
}

/**
 * A highlighted aside in the body. `variant` selects the accent so the tone
 * matches the message: amber for neutral/expiry facts, green for a resolved
 * outcome, red for a destructive one.
 */
export interface EmailCallout {
  variant: 'expiry' | 'success' | 'danger';
  label: string;
  /** Optional second line, rendered in the muted sub-colour. */
  detail?: string;
}

/** The call to action. `variant` picks the accessible fill for the button. */
export interface EmailCallToAction {
  label: string;
  url: string;
  variant?: 'primary' | 'danger';
}

/** Everything a template controls; the shell supplies the rest. */
export interface EmailBody {
  /** Inbox preview line; hidden in the body. */
  preheader: string;
  /** Short context label shown as the badge, e.g. `Password reset`. */
  eyebrow: string;
  heading: string;
  /** Plain-text paragraphs; escaped when rendered to HTML. */
  paragraphs: string[];
  callout?: EmailCallout;
  cta?: EmailCallToAction;
  footnote?: string;
}

/** Card geometry, shared by the shell and the conditional Outlook rules. */
const CARD_WIDTH = 600;
const CARD_GUTTER = 28;
const CARD_RADIUS = 12;

/** Callout accents: rule and label colour, plus the flat fill. */
const CALLOUT_ACCENTS: Record<
  EmailCallout['variant'],
  { accent: string; surface: string }
> = {
  expiry: { accent: EmailColors.warning, surface: EmailColors.warningSurface },
  success: { accent: EmailColors.success, surface: EmailColors.successSurface },
  danger: { accent: EmailColors.danger, surface: EmailColors.dangerSurface },
};

/** Button fills: the border and the VML fill use the same accessible colour. */
const CTA_FILLS: Record<NonNullable<EmailCallToAction['variant']>, string> = {
  primary: EmailColors.brand,
  danger: EmailColors.danger,
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
        `<p style="margin:0 0 16px;font-size:15px;line-height:24px;color:${EmailColors.textSecondary};">${escapeHtml(paragraph)}</p>`,
    )
    .join('\n');
}

/**
 * The context pill beside the wordmark, matching the site's `.badge`. Its
 * label is always the template's eyebrow, so nothing here is per-email.
 */
function renderBadge(eyebrow: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" align="right">
                    <tr>
                      <td bgcolor="${EmailColors.brandSoft}" style="background-color:${EmailColors.brandSoft};border:1px solid ${EmailColors.brandBorder};border-radius:999px;padding:5px 12px;font-family:${EmailFonts.sans};font-size:12px;line-height:16px;font-weight:600;color:${EmailColors.brand};white-space:nowrap;">
                        ${escapeHtml(eyebrow)}
                      </td>
                    </tr>
                  </table>`;
}

function renderCallout(callout: EmailCallout): string {
  const { accent, surface } = CALLOUT_ACCENTS[callout.variant];
  const detail = callout.detail
    ? `<br /><span style="font-weight:400;color:${EmailColors.textMuted};">${escapeHtml(callout.detail)}</span>`
    : '';

  return `
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${surface}" style="width:100%;background-color:${surface};border:1px solid ${accent};border-left-width:3px;border-radius:8px;margin:4px 0 24px;">
                  <tr>
                    <td style="padding:13px 16px;font-family:${EmailFonts.sans};font-size:14px;line-height:22px;font-weight:600;color:${accent};">
                      ${escapeHtml(callout.label)}${detail}
                    </td>
                  </tr>
                </table>`;
}

/**
 * The one primary action. Width is pinned for Outlook (which does not honour
 * `max-width`) and left fluid elsewhere so the target stays comfortable on a
 * phone. VML replaces the padding-based anchor only in Word's engine.
 */
function renderCta(cta: EmailCallToAction): string {
  const fill = CTA_FILLS[cta.variant ?? 'primary'];
  const url = escapeHtml(cta.url);
  const label = escapeHtml(cta.label);

  return `
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;margin:0 0 24px;">
                  <tr>
                    <td align="center" bgcolor="${fill}" style="background-color:${fill};border:1px solid ${fill};border-radius:8px;">
                      <!--[if mso]>
                        <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:48px;v-text-anchor:middle;width:${CARD_WIDTH - CARD_GUTTER * 2}px;" arcsize="17%" strokecolor="${fill}" fillcolor="${fill}">
                          <w:anchorlock />
                          <center style="color:#ffffff;font-family:${EmailFonts.sans};font-size:16px;font-weight:bold;">${label}</center>
                        </v:roundrect>
                      <![endif]-->
                      <!--[if !mso]><!-- -->
                      <a href="${url}" style="display:block;padding:14px 24px;font-family:${EmailFonts.sans};font-size:16px;line-height:20px;font-weight:600;color:#ffffff;text-decoration:none;">${label}</a>
                      <!--<![endif]-->
                    </td>
                  </tr>
                </table>`;
}

/**
 * The URL for clients that block or flatten the button. Kept visible rather
 * than hidden behind a disclosure: a reader who cannot see where a security
 * link goes should not be asked to click it, and a plain fallback is one less
 * thing for a filter to find suspicious.
 */
function renderFallbackUrl(url: string): string {
  const escaped = escapeHtml(url);

  return `
                <p style="margin:0 0 8px;font-size:13px;line-height:20px;color:${EmailColors.textMuted};">
                  If the button does not work, copy this link into your browser:
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${EmailColors.surface}" style="width:100%;background-color:${EmailColors.surface};border:1px solid ${EmailColors.border};border-radius:8px;margin:0 0 24px;">
                  <tr>
                    <td style="padding:12px 14px;font-family:${EmailFonts.mono};font-size:12px;line-height:19px;color:${EmailColors.link};word-break:break-all;word-wrap:break-word;">
                      <a href="${escaped}" style="color:${EmailColors.link};text-decoration:none;word-break:break-all;word-wrap:break-word;">${escaped}</a>
                    </td>
                  </tr>
                </table>`;
}

function renderFootnote(
  footnote: string | undefined,
  bottomPadding: string,
): string {
  if (!footnote) {
    return '';
  }

  return `
                <p style="margin:0 0 ${bottomPadding};font-size:13px;line-height:21px;color:${EmailColors.textMuted};">
                  ${escapeHtml(footnote)}
                </p>`;
}

/**
 * Builds the shell around a template's copy. All template strings are escaped
 * here, so callers pass plain text and never HTML.
 */
export function renderEmailHtml(body: EmailBody): string {
  const { preheader, eyebrow, heading, paragraphs, callout, cta, footnote } =
    body;

  // Without a CTA the footnote takes over the bottom gap the URL block leaves.
  const action = cta
    ? `${renderCta(cta)}
${renderFallbackUrl(cta.url)}
${renderFootnote(footnote, '28px')}`
    : renderFootnote(footnote, '28px');

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="x-apple-disable-message-reformatting" />
    <!-- Light-only on purpose: there is no dark variant to half-support. -->
    <meta name="color-scheme" content="light" />
    <meta name="supported-color-schemes" content="light" />
    <meta name="theme-color" content="${EmailColors.canvas}" />
    <title>${escapeHtml(heading)}</title>
    <!--[if mso]>
      <noscript>
        <xml>
          <o:OfficeDocumentSettings>
            <o:PixelsPerInch>96</o:PixelsPerInch>
          </o:OfficeDocumentSettings>
        </xml>
      </noscript>
    <![endif]-->
    <!-- Outlook needs the width pinned; every other client reads the table. -->
    <!--[if mso]>
      <style>
        .kadence-card { width: ${CARD_WIDTH}px; }
      </style>
    <![endif]-->
  </head>

  <body style="margin:0;padding:0;width:100%;background-color:${EmailColors.canvas};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

    <!-- Preheader: shown in the inbox preview, never in the body. -->
    <div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${EmailColors.canvas};opacity:0;">
      ${escapeHtml(preheader)}
      &#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;&#8203;
    </div>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${EmailColors.canvas}" style="width:100%;background-color:${EmailColors.canvas};">
      <tr>
        <td align="center" style="padding:32px 16px;">

          <!--
            The card is a plain block box, not a table: Chromium (and every
            client built on it) ignores border-radius on a display:table, which
            would leave the accent bar and the shadow spilling past square
            corners. The table inside supplies the layout. The conditional
            table pins the width for Outlook, which has no max-width.
          -->
          <!--[if mso]>
          <table role="presentation" width="${CARD_WIDTH}" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td width="${CARD_WIDTH}">
          <![endif]-->
          <div class="kadence-card" style="box-sizing:border-box;width:100%;max-width:${CARD_WIDTH}px;margin:0 auto;background-color:${EmailColors.card};border:1px solid ${EmailColors.border};border-radius:${CARD_RADIUS}px;box-shadow:${EmailColors.cardShadow};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${EmailColors.card}" style="width:100%;background-color:${EmailColors.card};border-radius:${CARD_RADIUS}px;">

            <!-- Accent bar: the one brand flourish, and it is a flat colour. -->
            <tr>
              <td bgcolor="${EmailColors.brandBar}" height="3" style="height:3px;line-height:3px;font-size:0;background-color:${EmailColors.brandBar};border-radius:${CARD_RADIUS}px ${CARD_RADIUS}px 0 0;">&nbsp;</td>
            </tr>

            <!-- Header: the app wordmark, plus the message's own context. -->
            <tr>
              <td style="padding:20px ${CARD_GUTTER}px;border-bottom:1px solid ${EmailColors.border};">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                  <tr>
                    <td align="left" valign="middle" style="font-family:${EmailFonts.mono};font-size:17px;line-height:22px;font-weight:700;letter-spacing:2px;color:${EmailColors.textPrimary};">
                      KAD<span style="color:${EmailColors.textSubtle};">ENCE</span>
                    </td>
                    <td align="right" valign="middle" style="font-size:0;line-height:0;">
                      ${renderBadge(eyebrow)}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>

            <!-- Body -->
            <tr>
              <td style="padding:28px ${CARD_GUTTER}px 0;">
                <h1 style="margin:0 0 16px;font-family:${EmailFonts.sans};font-size:22px;line-height:30px;font-weight:700;letter-spacing:-0.2px;color:${EmailColors.textPrimary};">
                  ${escapeHtml(heading)}
                </h1>
                ${renderParagraphs(paragraphs)}
                ${callout ? `${renderCallout(callout)}\n` : ''}${action}
              </td>
            </tr>

            <!-- Footer -->
            <tr>
              <td bgcolor="${EmailColors.surface}" style="background-color:${EmailColors.surface};padding:18px ${CARD_GUTTER}px;border-top:1px solid ${EmailColors.border};border-radius:0 0 ${CARD_RADIUS}px ${CARD_RADIUS}px;font-family:${EmailFonts.sans};font-size:12px;line-height:19px;color:${EmailColors.textMuted};">
                <strong style="color:${EmailColors.textSecondary};">Kadence</strong> account management &middot; <a href="mailto:${SUPPORT_EMAIL}" style="color:${EmailColors.link};text-decoration:underline;">${SUPPORT_EMAIL}</a>
              </td>
            </tr>

          </table>
          </div>
          <!--[if mso]>
          </td></tr></table>
          <![endif]-->

          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:${CARD_WIDTH}px;margin:0 auto;">
            <tr>
              <td align="center" style="padding:16px 8px 0;font-family:${EmailFonts.sans};font-size:12px;line-height:19px;color:${EmailColors.textSubtle};">
                Sent by Kadence, a product of Code Complete Labs. Kadence will never ask for your password by email.
              </td>
            </tr>
          </table>

        </td>
      </tr>
    </table>
  </body>
</html>`;
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
