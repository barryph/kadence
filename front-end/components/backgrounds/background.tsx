import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { Colors, withAlpha } from '@/constants/theme';

interface IProps {
  showRed?: boolean;
}

export default function Background({ showRed = true }: IProps) {
  return (
    <View style={StyleSheet.absoluteFill}>
      {/* Base background */}
      <LinearGradient
        colors={[Colors.canvas, Colors.canvasMid, Colors.canvas]}
        locations={[0, 0.46, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Blue top-left glow */}
      <LinearGradient
        colors={[withAlpha(Colors.accentGlow, 0.28), 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.blueGlow]}
      />

      {/* Cyan top-right glow */}
      <LinearGradient
        colors={[withAlpha(Colors.cyan, 0.16), 'transparent']}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, styles.cyanGlow]}
      />

      {/* Red bottom glow */}
      <LinearGradient
        colors={['transparent', withAlpha(Colors.danger, 0.12)]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          StyleSheet.absoluteFill,
          styles.redGlow,
          !showRed && { opacity: 0 },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  blueGlow: {
    opacity: 0.9,
  },
  cyanGlow: {
    opacity: 0.8,
  },
  redGlow: {
    opacity: 0.8,
  },
});
