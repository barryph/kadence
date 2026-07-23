import { Colors } from '@/constants/theme';
import { ThemedText } from '@/components/base/themed-text';

export default function Logo() {
  return (
    <ThemedText
      type="defaultBold"
      style={{
        color: '#fff',
        fontSize: 32,
      }}
    >
      Kad
      <ThemedText
        type="defaultBold"
        style={{
          color: Colors.light.faint,
          fontSize: 32,
        }}
      >
        ence
      </ThemedText>
    </ThemedText>
  );
}
