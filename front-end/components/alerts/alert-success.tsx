import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/base/themed-text';
import { Colors, Spacing } from '@/constants/theme';

interface IProps {
  children: React.ReactNode;
}

export default function AlertSuccess({ children }: IProps) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.message} variant="bodySmall" weight="600">
        {children}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.xl,
    borderRadius: 8,
    marginBottom: Spacing['2xl'],
    borderWidth: 1,
    borderColor: Colors.successBorder,
    backgroundColor: Colors.successSurface,
  },
  message: {
    textAlign: 'center',
  },
});
