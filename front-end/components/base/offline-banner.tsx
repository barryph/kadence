import { StyleSheet, View } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/base/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useIsOffline } from '@/hooks/use-is-offline';

/**
 * Persistent notice shown while the device has no usable connection.
 *
 * Kadence is server-backed and does not queue writes: offline, a screen cannot
 * load and an action cannot be saved. Saying so where the user can always see
 * it is clearer than letting each swipe or tap fail on its own.
 *
 * Rendered under the app header (see `app/(tabs)/_layout.tsx`) and collapses to
 * nothing when online, so it costs no space in the normal case.
 */
export default function OfflineBanner() {
  const isOffline = useIsOffline();

  if (!isOffline) return null;

  return (
    <View
      style={styles.banner}
      accessibilityRole="alert"
      accessibilityLabel="You are offline"
    >
      <MaterialIcons name="cloud-off" size={16} color={Colors.textPrimary} />
      <ThemedText variant="caption" weight="600" style={styles.text}>
        You&apos;re offline. Changes can&apos;t be saved until you reconnect.
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: 15,
    backgroundColor: Colors.dangerSurface,
  },
  text: {
    flexShrink: 1,
    color: Colors.textPrimary,
  },
});
