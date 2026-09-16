import { ActivityIndicator, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/base/themed-text';
import { ThemedView } from '@/components/base/themed-view';
import Background from '@/components/backgrounds/background';
import { Colors, Spacing } from '@/constants/theme';

interface IProps {
  text: string;
}

export default function LoaderScreen({ text }: IProps) {
  return (
    <ThemedView style={styles.container}>
      <Background />
      <ActivityIndicator color={Colors.textPrimary} />
      <ThemedText style={styles.text}>{text}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    height: '100%',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    marginTop: Spacing.lg,
  },
});
