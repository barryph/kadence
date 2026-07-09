import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/base/themed-text';

interface IProps {
  children: React.ReactNode;
}

export default function AlertError({ children }: IProps) {
  return (
    <View style={styles.errorContainer}>
      <ThemedText style={styles.errorText} type="defaultSmall" weight="600">
        {children}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    // backgroundColor: '#ffebeb',
    backgroundColor: '#861d28',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgb(211, 40, 40)',
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
  },
});
