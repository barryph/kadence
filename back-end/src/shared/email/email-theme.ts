/**
 * Kadence email theme.
 *
 * Security email is read by people who are worried about being phished, so the
 * palette follows the public account site (`kadence-static/src/styles/global.css`)
 * rather than the dark in-app theme: a white card, near-black text, one
 * accessible blue for links and primary actions, and red reserved for
 * destructive ones. The static site is the light end of the same product, which
 * is why its values are copied here token for token instead of invented.
 *
 * Deliberate differences from the site:
 * - Every value is a solid hex. Gradients and translucent fills are the most
 *   common cause of a broken render in Outlook, and a flat colour is also the
 *   honest one for a message whose job is to look trustworthy.
 * - Text sits on the card, so the WCAG AA (4.5:1) pairings are checked against
 *   `card` and the callout surfaces, not against the page canvas.
 *
 * The in-app palette (`front-end/constants/theme.ts`) is dark-only and shares
 * no values with this file, so the two no longer mirror each other.
 */

export const EmailColors = {
  // --- Canvas -------------------------------------------------------------
  /** Page behind the card; the site's subtle grey. */
  canvas: '#f8fafc',

  // --- Surfaces -----------------------------------------------------------
  /** The message card itself; all text is tuned against this colour. */
  card: '#ffffff',
  /** Neutral inset fill, e.g. the fallback URL box. */
  surface: '#f1f5f9',
  /** Fill behind the expiry callout. */
  warningSurface: '#fffbeb',
  /** Fill behind a resolved-outcome callout. */
  successSurface: '#f0fdf4',
  /** Fill behind a destructive callout. */
  dangerSurface: '#fef2f2',

  // --- Borders & dividers -------------------------------------------------
  /** Default hairline around the card, the inset box and the footer rule. */
  border: '#e5e7eb',
  /** Stronger border for controls that need to read as interactive. */
  borderStrong: '#d1d5db',

  // --- Text ---------------------------------------------------------------
  /** Headings and the wordmark. */
  textPrimary: '#111111',
  /** Body paragraphs. */
  textSecondary: '#334155',
  /** Callout detail lines and secondary notes. */
  textMuted: '#4b5563',
  /** Footnotes, the badge and the wordmark suffix. */
  textSubtle: '#6b7280',

  // --- Brand --------------------------------------------------------------
  /** Primary action fill, links and the accent bar. */
  brand: '#0a4d9c',
  /** Tinted badge fill. */
  brandSoft: '#e8effa',
  /** Badge border. */
  brandBorder: '#a9c4e6',
  /** Thin accent bar at the top of the card. */
  brandBar: '#0a4d9c',
  /** Inline links. */
  link: '#0a4d9c',

  // --- Status -------------------------------------------------------------
  /** Success accent: resolved-outcome callouts. */
  success: '#15803d',
  /** Destructive accent: danger callouts and the destructive button. */
  danger: '#c62828',
  /** Error and destructive copy that must clear 4.5:1 on white. */
  dangerText: '#b3261e',
  /** Expiry accent. */
  warning: '#92400e',

  // --- Objects ------------------------------------------------------------
  /**
   * The card's shadow, matching the site's `--shadow-card`. A client that
   * flattens it loses decoration, not hierarchy: the border still bounds the
   * card, so nothing else is allowed to depend on this.
   */
  cardShadow:
    '0 1px 2px rgba(16, 24, 40, 0.08), 0 16px 40px -28px rgba(16, 24, 40, 0.35)',
} as const;

/**
 * Type stacks.
 *
 * The site and the app both use the platform UI face, so the email does too:
 * one stack, no web font. A remote font is an extra network request that some
 * clients strip and some spam filters weigh, and it buys nothing a security
 * email needs.
 *
 * `mono` is only for the wordmark, which mirrors the app logotype's letterform
 * treatment, and it resolves to an installed face everywhere.
 */
export const EmailFonts = {
  sans: "ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif",
  mono: "ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace",
} as const;
