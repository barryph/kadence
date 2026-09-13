import {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
  IBMPlexMono_700Bold,
} from '@expo-google-fonts/ibm-plex-mono';
import { Platform, type TextStyle } from 'react-native';

import { Colors } from '@/constants/theme';

/**
 * Typography tokens.
 *
 * Typography here is a small set of independent axes — family, size, weight,
 * line height and letter spacing — plus named `variants` that preset those
 * axes for the styles the app actually uses. A caller picks a variant and only
 * overrides the axis that differs:
 *
 * ```tsx
 * <ThemedText variant="body" weight="600" />       // bolder body copy
 * <ThemedText variant="heading" font="system" />   // system-font heading
 * ```
 *
 * Family and weight are independent. The mono face ships one file per weight,
 * so a `font` + `weight` pair is resolved to the matching family internally
 * (see {@link resolveTypography}); the system face uses a real `fontWeight`.
 *
 * Line height is intentionally *not* derived from the font size by one ratio:
 * the two faces have different vertical metrics, so {@link LINE_HEIGHT} maps
 * every (family, size) pair to its own value and a size change re-resolves it.
 */

/** The two typefaces the app ships. */
export type Font = 'mono' | 'system';

/** Weights the app supports; every one is loaded for both faces. */
export type Weight = '400' | '500' | '600' | '700';

/** Named steps of the type scale (relative, not absolute sizes). */
export type Size =
  '2xs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';

/** Font size, in points, for each step of the scale. */
export const FONT_SIZE: Record<Size, number> = {
  '2xs': 11,
  xs: 12,
  sm: 13,
  md: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
};

/**
 * Family string for the platform UI font.
 *
 * `web` needs the full fallback stack because browsers do not all understand
 * `system-ui`; native platforms resolve it to San Francisco / Roboto. Exported
 * for non-`ThemedText` consumers such as chart themes.
 */
export const SYSTEM_FONT_FAMILY = Platform.select({
  web: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  default: 'system-ui',
}) as string;

/** IBM Plex Mono ships one registered family per weight. */
const MONO_FAMILY: Record<Weight, string> = {
  '400': 'IBMPlexMono_400Regular',
  '500': 'IBMPlexMono_500Medium',
  '600': 'IBMPlexMono_600SemiBold',
  '700': 'IBMPlexMono_700Bold',
};

/**
 * Font sources to hand to `useFonts` at app startup.
 *
 * Kept beside {@link MONO_FAMILY} on purpose: every weight the system can
 * request must also be loaded, and the registered family name is the key used
 * here. Adding a weight means updating both, in this one file.
 */
export const MONO_FONTS = {
  IBMPlexMono_400Regular,
  IBMPlexMono_500Medium,
  IBMPlexMono_600SemiBold,
  IBMPlexMono_700Bold,
};

/**
 * Canonical line height for every (family, size) pair.
 *
 * The system face is optically taller than the mono face at the same size, so
 * it takes a tighter line height; changing only a variant's `font` therefore
 * changes its line height too, as it should.
 */
export const LINE_HEIGHT: Record<Font, Record<Size, number>> = {
  mono: {
    '2xs': 14,
    xs: 16,
    sm: 18,
    md: 20,
    lg: 24,
    xl: 24,
    '2xl': 28,
    '3xl': 29,
    '4xl': 33,
    '5xl': 37,
  },
  system: {
    '2xs': 14,
    xs: 16,
    sm: 18,
    md: 18,
    lg: 20,
    xl: 22,
    '2xl': 25,
    '3xl': 29,
    '4xl': 33,
    '5xl': 38,
  },
};

/** A named combination of typography axes. */
export interface TypographyPreset {
  font: Font;
  size: Size;
  weight: Weight;
  letterSpacing?: number;
  textTransform?: TextStyle['textTransform'];
  /** Set only when the colour is intrinsic to the style, e.g. a link. */
  color?: string;
}

/**
 * The typography variants.
 *
 * `display`/`title`/`heading`/`subheading` are the heading ramp; `body` and
 * `bodySmall` the reading ramp (`bodyStrong`/`bodyBold` are its emphases);
 * `label`, `caption` and `eyebrow` cover UI chrome; `link` is the one variant
 * with an intrinsic colour.
 */
export const TEXT_VARIANTS = {
  display: { font: 'mono', size: '5xl', weight: '700' },
  title: { font: 'mono', size: '4xl', weight: '700' },
  heading: { font: 'mono', size: '3xl', weight: '700' },
  subheading: { font: 'mono', size: '2xl', weight: '700' },
  body: { font: 'mono', size: 'lg', weight: '400' },
  bodyStrong: { font: 'mono', size: 'lg', weight: '600' },
  bodyBold: { font: 'mono', size: 'lg', weight: '700' },
  bodySmall: { font: 'mono', size: 'md', weight: '400' },
  label: { font: 'mono', size: 'md', weight: '600' },
  caption: { font: 'mono', size: 'xs', weight: '400' },
  eyebrow: {
    font: 'mono',
    size: 'sm',
    weight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  link: { font: 'mono', size: 'lg', weight: '400', color: Colors.accent },
} as const satisfies Record<string, TypographyPreset>;

export type TextVariant = keyof typeof TEXT_VARIANTS;

/** Overrides accepted alongside a variant; unset axes fall back to the preset. */
export interface TypographyOptions {
  variant?: TextVariant;
  font?: Font;
  size?: Size;
  weight?: Weight;
  letterSpacing?: number;
  lineHeight?: number;
}

/**
 * Resolves a variant plus overrides into a React Native text style.
 *
 * `lineHeight` is resolved last from the final family and size, so overriding
 * either keeps the line height correct; an explicit `lineHeight` always wins.
 */
export function resolveTypography({
  variant = 'body',
  font,
  size,
  weight,
  letterSpacing,
  lineHeight,
}: TypographyOptions): TextStyle {
  const preset: TypographyPreset = TEXT_VARIANTS[variant];
  const resolvedFont = font ?? preset.font;
  const resolvedSize = size ?? preset.size;
  const resolvedWeight = weight ?? preset.weight;

  const style: TextStyle = {
    fontSize: FONT_SIZE[resolvedSize],
    lineHeight: lineHeight ?? LINE_HEIGHT[resolvedFont][resolvedSize],
  };

  if (resolvedFont === 'mono') {
    style.fontFamily = MONO_FAMILY[resolvedWeight];
  } else {
    style.fontFamily = SYSTEM_FONT_FAMILY;
    style.fontWeight = resolvedWeight;
  }

  const resolvedLetterSpacing = letterSpacing ?? preset.letterSpacing;
  if (resolvedLetterSpacing !== undefined) {
    style.letterSpacing = resolvedLetterSpacing;
  }
  if (preset.textTransform) {
    style.textTransform = preset.textTransform;
  }
  if (preset.color) {
    style.color = preset.color;
  }

  return style;
}
