import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/base/themed-text';

type InputErrorMessageProper = {
  children: React.ReactNode;
};

export default function InputErrorMessage({
  children,
}: InputErrorMessageProper) {
  return <ThemedText style={styles.errorText}>{children}</ThemedText>;
}

const styles = StyleSheet.create({
  errorText: {
    color: '#ff3333',
    fontSize: 12,
    marginTop: 4,
    lineHeight: 14,
  },
});
