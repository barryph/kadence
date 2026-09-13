/**
 * Kadence colour tokens.
 *
 * The app is dark-only (see `userInterfaceStyle` in `app.json`), so there is a
 * single palette rather than a light/dark pair. Every name describes the role
 * the colour plays, not the hue itself, so a component asks for the job it
 * needs ("what colour is a border?") instead of a literal value.
 *
 * The transactional email theme lives in
 * `back-end/src/shared/email/email-theme.ts` and deliberately mirrors this file
 * group for group, so the two can be compared side by side. Keep the section
 * order and the shared token names in sync when either changes.
 *
 * Prefer these tokens over literals in components. A one-off colour that is not
 * part of the brand or a semantic state belongs next to its component instead.
 */
export const Colors = {
  // --- Canvas -------------------------------------------------------------
  /** Deepest background; the base of the app gradient and the email canvas. */
  canvas: '#050711',
  /** Midpoint of the vertical canvas gradient. */
  canvasMid: '#0b1020',

  // --- Surfaces -----------------------------------------------------------
  /** Opaque screen background used where no gradient is drawn. */
  background: '#151718',
  /** Opaque panel sitting above the canvas. */
  surface: '#181d23',
  /** Raised panel (e.g. destructive settings rows). */
  surfaceElevated: '#193b5c',
  /** Translucent raised surface: inputs, pills, list rows. */
  surfaceTranslucent: 'rgba(255, 255, 255, 0.055)',
  /** Slightly stronger translucent surface for larger rows. */
  surfaceTranslucentStrong: 'rgba(255, 255, 255, 0.08)',
  /** Background of the selected option in pickers and sheets. */
  surfaceSelected: 'rgb(22, 50, 81)',
  /** Background of timeline headers and other sticky chrome. */
  surfaceHeader: 'rgba(26, 65, 99, 0.3)',
  /** Background of disabled / empty cells. */
  surfaceDisabled: 'rgba(155, 155, 155, 0.1)',
  /** Light overlay used for transient status messages on dark screens. */
  surfaceInverse: 'rgba(255, 255, 255, 0.9)',
  /** Tab bar background. */
  navbar: 'rgb(8, 7, 11)',
  /** Toast background. */
  toast: 'rgb(4, 5, 17)',
  /** Skeleton placeholder fill. */
  skeleton: '#E1E9EE',

  // --- Borders & dividers -------------------------------------------------
  /** Default hairline border around cards, inputs and cells. */
  border: 'rgba(255, 255, 255, 0.1)',
  /** Fainter border for chart grids and inset tracks. */
  borderFaint: 'rgba(255, 255, 255, 0.06)',
  /** Dark divider drawn over an accent fill. */
  divider: 'rgba(0, 0, 0, 0.53)',

  // --- Text ---------------------------------------------------------------
  /** Default body and heading colour. */
  textPrimary: '#ffffff',
  /** De-emphasised copy: modal bodies, secondary links. */
  textSecondary: '#cccccc',
  /** Placeholders and disabled labels. */
  textMuted: '#999999',
  /** Metadata that reads blue-grey against the canvas. */
  textSubtle: '#7e91b6',
  /** Translucent text for chart axes and inactive controls. */
  textFaint: 'rgba(245, 247, 251, 0.65)',
  /** Partially transparent wordmark / display text. */
  textDimmed: 'rgba(255, 255, 255, 0.51)',

  // --- Icons --------------------------------------------------------------
  /** Muted icon strokes. */
  icon: '#9ba1a6',
  /** Brand-tinted icon used in empty and error states. */
  iconAccent: '#d8ecff',

  // --- Accent -------------------------------------------------------------
  /** Primary action colour: buttons, links, default activity colour. */
  accent: '#0072ff',
  /** Brand gradient start and canvas bloom anchor. */
  accentGlow: '#087cff',
  /** Mid stop of accent gradients. */
  accentBright: '#0096ff',
  /** Disabled / low-emphasis accent (disabled buttons). */
  accentSoft: '#80b9ff',

  /** Secondary brand hue used across gradients and highlights. */
  cyan: '#08d8ff',

  // --- Status -------------------------------------------------------------
  /** Success accent: "goal met", completed states. */
  success: '#52f2a8',
  /** Border of a success alert. */
  successBorder: 'rgb(20, 203, 109)',
  /** Fill of a success alert. */
  successSurface: 'rgb(2, 121, 76)',

  /** Pending / "in progress" accent. */
  warning: 'rgb(236, 232, 30)',
  /** Accent for values that beat their target (e.g. "above goal" heatmap cells). */
  exceeded: '#ff9f43',

  /** Destructive brand accent: overdue bars, danger CTAs. */
  danger: '#ff3d54',
  /** Error text and invalid field borders. */
  dangerText: '#ff3333',
  /** Fill of an error alert. */
  dangerSurface: '#861d28',
  /** Fill of a destructive button. */
  dangerStrong: '#c62828',

  // --- Objects ------------------------------------------------------------
  /** Unfilled portion of progress bars and sliders. */
  track: '#4b4b5c',
  /** Native shadow colour. */
  shadow: '#000000',
  /** Dimming layer behind a modal. */
  scrim: 'rgba(0, 0, 0, 0.45)',
  /** Heavier dimming layer, e.g. a full-screen loading overlay. */
  scrimStrong: 'rgba(0, 0, 0, 0.55)',
} as const;

/**
 * Curated swatches offered when picking a category colour.
 *
 * These are user-chosen data colours rather than UI chrome, so they stay a
 * separate palette from {@link Colors}. The first swatch matches the default
 * activity accent.
 */
export const CategoryColors = [
  Colors.accent, // Electric blue
  '#00C2FF', // Cyan
  '#00D4A8', // Teal
  '#20C997', // Emerald
  '#A3E635', // Lime
  '#FACC15', // Yellow
  '#FF8A1F', // Orange
  '#EF4444', // Red
  '#FB7185', // Coral
  '#F472B6', // Pink
  '#A855F7', // Purple
  '#6366F1', // Indigo
] as const;

/**
 * Brand gradients shared by more than one component.
 *
 * Values are plain arrays so they can be spread into `expo-linear-gradient`
 * (`colors={[...Gradients.goalMet]}`) where a mutable array is expected.
 */
export const Gradients = {
  /** Progress / completion bar when the target has been reached. */
  goalMet: [Colors.accentGlow, Colors.cyan, Colors.success],
  /** Progress bar while the target is still being worked towards. */
  goalInProgress: [Colors.accentGlow, Colors.accentBright, Colors.cyan],
  /** Progress bar once an activity is overdue. */
  overdue: [Colors.accentGlow, Colors.cyan, Colors.danger],
  /** Backdrop of the tab bar. */
  blueBackdrop: ['#087cfb', '#0290ee', '#09b0d4'],
} as const;

/**
 * Composites a hex token into an `rgba()` string at the given opacity.
 *
 * Useful where only a fragment of a colour is needed (a shadow or glow built
 * from a brand token) without introducing a second token for that one alpha.
 */
export function withAlpha(hex: string, opacity: number): string {
  const value = hex.replace('#', '');
  const r = parseInt(value.slice(0, 2), 16);
  const g = parseInt(value.slice(2, 4), 16);
  const b = parseInt(value.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
