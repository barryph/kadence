import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/base/themed-text';
import { Spacing } from '@/constants/theme';

type LabelProps = {
  children: React.ReactNode;
};

export default function Label({ children }: LabelProps) {
  return (
    <ThemedText style={styles.label} variant="label">
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: Spacing.md,
  },
});
