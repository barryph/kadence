import { Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/base/themed-text';
import { Colors } from '@/constants/theme';

interface FloatingActionButtonProps {
  label: string;
  onPress: () => void;
}

export default function FloatingActionButton({
  label,
  onPress,
}: FloatingActionButtonProps) {
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <ThemedText style={styles.buttonText}>{label}</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    position: 'absolute',
    bottom: 30,
    right: 24,
    height: 48,
    paddingHorizontal: 20,
    backgroundColor: Colors.blue.new,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    boxShadow: '0 18px 38px rgba(0,90,255,.42), 0 8px 18px rgba(0,0,0,.36)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
