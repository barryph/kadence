import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/base/themed-text';
import { Colors, Shadows, Spacing } from '@/constants/theme';

interface FloatingActionButtonProps {
  label: string;
  onPress: () => void;
}

export default function FloatingActionButton({
  label,
  onPress,
}: FloatingActionButtonProps) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <ThemedText variant="bodyStrong">{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    height: 48,
    paddingHorizontal: Spacing['3xl'],
    backgroundColor: Colors.accent,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.floatingAction,
  },
});
