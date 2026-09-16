/**
 * Kadence email theme.
 *
 * Mirrors `front-end/constants/theme.ts` group for group and, where a concept
 * is shared, token for token, so the app and the transactional emails can be
 * compared and evolved together. The two files are intentionally independent
 * copies rather than a shared package: the frontend is React Native and this is
 * inline HTML, and the coupling would cost more than it saves until more tokens
 * genuinely overlap. When you change a shared colour, change both.
 *
 * Email-client constraints worth remembering while reading this file:
 * - Outlook ignores rgba and gradients, so every translucent fill that matters
 *   has a solid counterpart below (the colour composited over the card).
 * - Text colours are tuned to clear WCAG AA (4.5:1) on the card colour.
 */

export const EmailColors = {
  // --- Canvas -------------------------------------------------------------
  /** Deepest background; base of the email's vertical gradient. */
  canvas: '#050711',
  /** Midpoint of the vertical canvas gradient. */
  canvasMid: '#0b1020',

  // --- Surfaces -----------------------------------------------------------
  /** The message card itself; all text is tuned against this colour. */
  card: '#080d1c',
  /** 1px gradient hairline around the card (flat fallback). */
  frame: '#1a4163',
  /** Inset surface for the fallback URL box. */
  surface: '#101524',
  /** Composited fills behind each callout variant, for clients without rgba. */
  calloutExpirySurface: '#08192a',
  calloutSuccessSurface: '#0c1b24',
  calloutDangerSurface: '#17101f',
  /** Composited glow rings behind the CTA button, for clients without rgba. */
  ctaRing: '#081833',
  ctaDangerRing: '#211222',

  // --- Borders & dividers -------------------------------------------------
  /** Default hairline: card header/footer rules and inset borders. */
  border: 'rgba(255, 255, 255, 0.07)',

  // --- Text ---------------------------------------------------------------
  /** Headings and the wordmark. */
  textPrimary: '#ffffff',
  /** Body paragraphs. */
  textSecondary: 'rgba(255, 255, 255, 0.72)',
  /** Dimmed wordmark suffix. */
  textFaint: 'rgba(255, 255, 255, 0.60)',
  /** Footnotes and callout detail lines. */
  textMuted: 'rgba(255, 255, 255, 0.50)',
  /** Footer and postscript copy. */
  textSubtle: 'rgba(255, 255, 255, 0.46)',

  // --- Accent -------------------------------------------------------------
  /** Primary action colour; CTA fill and gradient start. */
  accent: '#0072ff',
  /** Brand gradient start and bloom anchor. */
  accentGlow: '#087cff',
  /** Mid stop of accent gradients. */
  accentBright: '#0096ff',
  /** Secondary brand hue used in gradients and the header status dot. */
  cyan: '#08d8ff',
  /** Eyebrow labels and links. */
  eyebrow: '#8fd4ff',
  link: '#8fd4ff',

  // --- Status -------------------------------------------------------------
  /** Success accent: resolved-outcome callouts. */
  success: '#52f2a8',
  /** Destructive brand accent: danger callouts and CTA gradient end. */
  danger: '#ff3d54',
  /**
   * Error copy on the dark card, lighter than {@link danger} so it clears
   * WCAG AA. Mirrors the app's `Colors.dangerText` role; the app tunes its own
   * value against its lighter surfaces.
   */
  dangerText: '#ff8a9b',
  /** Danger CTA fill and gradient start. */
  dangerStrong: '#e02040',
  /** Warm end of the danger CTA gradient. */
  dangerBright: '#ff7a5c',

  // --- Objects ------------------------------------------------------------
  /** CTA glow, tinted for the primary button. */
  accentShadow: 'rgba(0, 90, 255, 0.42)',
  /** CTA glow, tinted for the destructive button. */
  dangerShadow: 'rgba(255, 0, 0, 0.42)',
  /** Neutral drop shadow beneath a CTA. */
  shadow: 'rgba(0, 0, 0, 0.36)',
} as const;

/**
 * Font stacks used by the email shell.
 *
 * `mono` is the real brand face where a client loads the Google font; the other
 * two are the fallbacks used in plain-monospace contexts and in Word/Outlook,
 * which ignores web fonts entirely.
 */
export const EmailFonts = {
  mono: "'IBM Plex Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace",
  monoSystem:
    "ui-monospace,SFMono-Regular,Menlo,Consolas,'Liberation Mono',monospace",
  fallback: "'Courier New', Courier, monospace",
} as const;

/**
 * Composites a hex colour into an `rgba()` string at the given opacity.
 *
 * Kept byte-for-byte in step with the frontend helper of the same name so a
 * token can be described identically on both sides.
 */
export function withAlpha(hex: string, opacity: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
