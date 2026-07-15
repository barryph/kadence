import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/base/themed-text';

type LabelProps = {
  children: React.ReactNode;
};

export default function Label({ children }: LabelProps) {
  return (
    <ThemedText style={styles.label} type="defaultSemiBold">
      {children}
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  label: {
    marginBottom: 8,
    fontSize: 14,
    lineHeight: 22,
    color: '#fff',
  },
});
