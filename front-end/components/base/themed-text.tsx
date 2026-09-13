import { StyleSheet, Text, type TextProps } from 'react-native';

import { Colors } from '@/constants/theme';
import {
  resolveTypography,
  type Font,
  type Size,
  type TextVariant,
  type Weight,
} from '@/constants/typography';

export type ThemedTextProps = TextProps & {
  /** Named typography preset. Defaults to `body`. */
  variant?: TextVariant;
  /** Override the preset's typeface. */
  font?: Font;
  /** Override the preset's size step. */
  size?: Size;
  /** Override the preset's weight. */
  weight?: Weight;
  /** Extra tracking; overrides the preset's letter spacing. */
  letterSpacing?: number;
  /** Explicit line height; otherwise derived from the final font and size. */
  lineHeight?: number;
};

/**
 * The only text primitive in the app.
 *
 * Typography comes from the `variant` presets in `constants/typography.ts`;
 * `font`, `size`, `weight`, `letterSpacing` and `lineHeight` override the
 * preset axes individually. Colour defaults to the theme's primary text colour
 * and can be overridden through `style`, which is applied last.
 */
export function ThemedText({
  style,
  variant = 'body',
  font,
  size,
  weight,
  letterSpacing,
  lineHeight,
  ...rest
}: ThemedTextProps) {
  return (
    <Text
      style={[
        styles.base,
        resolveTypography({
          variant,
          font,
          size,
          weight,
          letterSpacing,
          lineHeight,
        }),
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    color: Colors.textPrimary,
  },
});
