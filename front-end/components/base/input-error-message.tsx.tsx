import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/base/themed-text';
import { Colors } from '@/constants/theme';

type InputErrorMessageProper = {
  children: React.ReactNode;
};

export default function InputErrorMessage({
  children,
}: InputErrorMessageProper) {
  return (
    <ThemedText style={styles.errorText} variant="caption">
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  errorText: {
    color: Colors.dangerText,
    marginTop: 4,
  },
});
