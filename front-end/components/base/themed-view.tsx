import { StyleSheet, View, type ViewProps } from 'react-native';

import { Colors } from '@/constants/theme';

/**
 * A view on the app's opaque screen background.
 *
 * The app is dark-only, so there is no light/dark resolution here; use
 * `@/components/backgrounds/background` instead when the gradient canvas is
 * wanted.
 */
export function ThemedView({ style, ...otherProps }: ViewProps) {
  return <View style={[styles.view, style]} {...otherProps} />;
}

const styles = StyleSheet.create({
  view: {
    backgroundColor: Colors.background,
  },
});
