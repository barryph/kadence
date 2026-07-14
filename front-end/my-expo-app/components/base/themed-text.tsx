import { StyleSheet, Text, type TextProps } from 'react-native';
// import { useThemeColor } from '@/hooks/use-theme-color';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?:
  | 'default'
  | 'defaultSmall'
  | 'title'
  | 'defaultSemiBold'
  | 'defaultBold'
  | 'subtitle'
  | 'link';
  weight?: '400' | '600' | '700';
  size?: 'small' | 'regular' | 'large' | 'title';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  weight,
  size,
  ...rest
}: ThemedTextProps) {
  // const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  const color = '#fff';

  return (
    <Text
      style={[
        { color },
        type === 'default' ? styles.default : undefined,
        type === 'defaultSmall' ? styles.defaultSmall : undefined,
        type === 'title' ? styles.title : undefined,
        type === 'defaultSemiBold' ? styles.defaultSemiBold : undefined,
        type === 'defaultBold' ? styles.defaultBold : undefined,
        type === 'subtitle' ? styles.subtitle : undefined,
        type === 'link' ? styles.link : undefined,
        weight === '400' ? styles.weightRegular : undefined,
        weight === '600' ? styles.weightSemiBold : undefined,
        weight === '700' ? styles.weightBold : undefined,
        size === 'small' ? styles.sizeSmall : undefined,
        size === 'regular' ? styles.sizeRegular : undefined,
        size === 'large' ? styles.sizeLarge : undefined,
        size === 'title' ? styles.sizeTitle : undefined,
        style,
      ]}
      {...rest}
    />
  );
}

const baseStyles = {
  fontFamily: 'IBMPlexMono_400Regular',
};

const styles = StyleSheet.create({
  default: {
    ...baseStyles,
    fontSize: 16,
    lineHeight: 24,
  },
  defaultSmall: {
    ...baseStyles,
    fontSize: 14,
    lineHeight: 20,
  },
  defaultSemiBold: {
    ...baseStyles,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'IBMPlexMono_600SemiBold',
  },
  defaultBold: {
    ...baseStyles,
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'IBMPlexMono_700Bold',
  },
  title: {
    ...baseStyles,
    fontSize: 32,
    fontFamily: 'IBMPlexMono_700Bold',
    lineHeight: 38,
  },
  subtitle: {
    ...baseStyles,
    fontSize: 20,
    fontWeight: 'bold',
  },
  link: {
    ...baseStyles,
    lineHeight: 30,
    fontSize: 16,
    color: '#0a7ea4',
  },
  weightRegular: {
    fontFamily: 'IBMPlexMono_400Regular',
  },
  weightSemiBold: {
    fontFamily: 'IBMPlexMono_600SemiBold',
  },
  weightBold: {
    fontFamily: 'IBMPlexMono_700Bold',
  },
  sizeSmall: {
    fontSize: 14,
  },
  sizeRegular: {
    fontSize: 16,
  },
  sizeLarge: {
    fontSize: 28,
  },
  sizeTitle: {
    fontSize: 32,
  },
});
