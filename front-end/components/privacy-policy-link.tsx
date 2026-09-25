import {
  Linking,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { ThemedText } from '@/components/base/themed-text';
import { Spacing } from '@/constants/theme';
import { PRIVACY_POLICY_URL } from '@/constants/urls';

interface PrivacyPolicyLinkProps {
  style?: StyleProp<ViewStyle>;
}

/**
 * Link to the public Privacy Policy.
 *
 * Opens the URL outside the app with the platform's standard browser
 * handling. The address, label and touch target live here so callers only
 * choose where the link sits.
 */
export default function PrivacyPolicyLink({ style }: PrivacyPolicyLinkProps) {
  async function openPolicy() {
    try {
      await Linking.openURL(PRIVACY_POLICY_URL);
    } catch (error) {
      // No browser can handle the URL. The promise used to be dropped, so
      // tapping the link did nothing at all with no explanation.
      console.error('Failed to open the privacy policy', error);
      Toast.show({
        type: 'error',
        text1: "Couldn't open the Privacy Policy",
      });
    }
  }

  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Privacy Policy"
      hitSlop={8}
      onPress={() => {
        void openPolicy();
      }}
      style={({ pressed }) => [styles.link, pressed && styles.pressed, style]}
    >
      <ThemedText variant="link" weight="600" style={styles.linkLabel}>
        Privacy Policy
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  link: {
    minHeight: 44,
    minWidth: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
  },
  pressed: {
    opacity: 0.6,
  },
  linkLabel: {
    textDecorationLine: 'underline',
  },
});
