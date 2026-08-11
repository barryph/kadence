import { View, StyleSheet, Platform } from 'react-native';
import { GoogleSigninButton } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { ThemedText } from '@/components/base/themed-text';

interface SocialSignInButtonsProps {
  onGooglePress: () => void;
  onApplePress: () => void;
  isLoading?: boolean;
}

/**
 * Sign in with Google / Apple buttons. Apple is only rendered on iOS. Google is only rendered on Android.
 * While a sign-in is in flight, all buttons are disabled.
 */
export default function SocialSignInButtons({
  onGooglePress,
  onApplePress,
  isLoading = false,
}: SocialSignInButtonsProps) {
  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={styles.divider} />
        <ThemedText size="small" style={styles.dividerText}>
          or continue with
        </ThemedText>
        <View style={styles.divider} />
      </View>

      <View style={styles.buttons} pointerEvents={isLoading ? 'none' : 'auto'}>
        <GoogleSigninButton
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Dark}
          onPress={onGooglePress}
          disabled={isLoading}
          style={styles.googleButton}
        />

        {Platform.OS === 'ios' && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={
              AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
            }
            buttonStyle={
              AppleAuthentication.AppleAuthenticationButtonStyle.BLACK
            }
            onPress={onApplePress}
            style={[styles.appleButton, isLoading && styles.disabled]}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    gap: 16,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  dividerText: {
    opacity: 0.6,
  },
  buttons: {
    gap: 12,
  },
  googleButton: {
    width: '100%',
    height: 48,
  },
  appleButton: {
    width: '100%',
    height: 48,
  },
  disabled: {
    opacity: 0.5,
  },
});
