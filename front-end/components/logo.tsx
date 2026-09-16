import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/base/themed-text';
import { Colors } from '@/constants/theme';

export default function Logo() {
  return (
    <ThemedText variant="heading" style={styles.wordmark}>
      Kad
      <ThemedText variant="heading" style={styles.wordmarkDimmed}>
        ence
      </ThemedText>
    </ThemedText>
  );
}

const styles = StyleSheet.create({
  wordmark: {
    color: Colors.textPrimary,
  },
  wordmarkDimmed: {
    color: Colors.textDimmed,
  },
});
