import { View, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/base/themed-text';

interface IProps {
  children: React.ReactNode;
}

export default function AlertSuccess({ children }: IProps) {
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
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderWidth: 1,
    // borderColor: 'rgb(14, 179, 117)',
    borderColor: 'rgb(20, 203, 109)',
    // backgroundColor: 'rgb(14, 179, 117)',
    backgroundColor: 'rgb(2, 121, 76)',
  },
  errorText: {
    color: '#fff',
    textAlign: 'center',
  },
});
