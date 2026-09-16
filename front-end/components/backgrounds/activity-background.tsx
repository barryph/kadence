import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, withAlpha } from '@/constants/theme';

/** Subtle raised-surface wash used by list item shells. */
export default function ActivityBackground() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[
          withAlpha(Colors.textPrimary, 0.075),
          withAlpha(Colors.textPrimary, 0.034),
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <LinearGradient
        colors={[
          withAlpha(Colors.accentGlow, 0.08),
          'transparent',
          'transparent',
        ]}
        locations={[0, 0.42, 1]}
        start={{ x: 0, y: 1 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
