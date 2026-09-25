import { View, StyleSheet } from 'react-native';
import { ThemedText } from './base/themed-text';
import { Spacing } from '@/constants/theme';

interface IProgressBadgeProps {
  icon: React.ReactNode;
  color: string;
  children: React.ReactNode;
}

export default function ProgressBadge({
  icon,
  color,
  children,
}: IProgressBadgeProps) {
  return (
    <View style={styles.badge}>
      {icon}
      <ThemedText
        variant="caption"
        weight="700"
        letterSpacing={-0.45}
        style={{ color }}
      >
        {children}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
});
