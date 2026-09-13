import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/base/themed-text';
import { Colors, Spacing, withAlpha } from '@/constants/theme';

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
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    boxShadow: `0 18px 38px ${withAlpha(Colors.accent, 0.42)}, 0 8px 18px ${withAlpha(Colors.shadow, 0.36)}`,
  },
});
