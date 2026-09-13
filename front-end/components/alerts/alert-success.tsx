import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/base/themed-text';
import { Colors } from '@/constants/theme';

interface IProps {
  children: React.ReactNode;
}

export default function AlertSuccess({ children }: IProps) {
  return (
    <View style={styles.container}>
      <ThemedText style={styles.text} variant="bodySmall" weight="600">
        {children}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: Colors.successBorder,
    backgroundColor: Colors.successSurface,
  },
  text: {
    textAlign: 'center',
  },
});
