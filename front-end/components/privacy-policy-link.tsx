import {
  Linking,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
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
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel="Privacy Policy"
      hitSlop={8}
      onPress={() => {
        void Linking.openURL(PRIVACY_POLICY_URL);
      }}
      style={({ pressed }) => [styles.link, pressed && styles.pressed, style]}
    >
      <ThemedText variant="link" weight="600" style={styles.text}>
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
  text: {
    textDecorationLine: 'underline',
  },
});
