import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { useThemeColor } from '@/hooks/use-theme-color';
import { ThemedText } from './themed-text';
import { ThemedView } from './themed-view';

interface IProps {
  text: string;
}

export default function LoaderScreen({ text }: IProps) {
  const color = useThemeColor({ light: '#000', dark: '#fff' }, 'text');

  return (
    <ThemedView style={styles.container}>
      <ActivityIndicator color={color} />
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
  }
})
