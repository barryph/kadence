import { View, StyleSheet } from 'react-native';
import { ThemedText } from './base/themed-text';

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
    <View style={styles.doneBadge}>
      {icon}
      <ThemedText style={[styles.doneText, { color }]}>{children}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  doneText: {
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: -0.45,
  },
});
