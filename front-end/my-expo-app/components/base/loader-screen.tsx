import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/base/themed-text';
import { ThemedView } from '@/components/base/themed-view';
import Background from '@/components/backgrounds/background';

interface IProps {
  text: string;
}

export default function LoaderScreen({ text }: IProps) {
  return (
    <ThemedView style={styles.container}>
      <Background />
      <ActivityIndicator color="#fff" />
      <ThemedText style={{ marginTop: 10 }}>{text}</ThemedText>
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
});
