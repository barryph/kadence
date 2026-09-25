import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

import Background from '@/components/backgrounds/background';
import Container from '@/components/base/container';
import Button from '@/components/base/button';
import { ThemedText } from '@/components/base/themed-text';
import AlertError from '@/components/alerts/alert-error';
import DeleteAccountModal from '@/components/auth/delete-account-modal';
import PrivacyPolicyLink from '@/components/privacy-policy-link';
import { Colors, Spacing } from '@/constants/theme';
import { useAuth } from '@/context/auth-context';

function Profile() {
  const { user, logout } = useAuth();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  if (!user) return null;

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    setLogoutError(null);

    try {
      const { serverSignOutFailed } = await logout();
      // Clearing auth state makes the navigation guard redirect to /login. The
      // device is signed out either way; only say so when the server could not
      // be told, since the session there may outlive this sign-out.
      if (serverSignOutFailed) {
        Toast.show({
          type: 'error',
          text1: 'Signed out on this device',
          text2:
            "We couldn't reach the server, but you have been signed out on this device.",
        });
      }
    } catch {
      setLogoutError('Something went wrong, please try again.');
      setIsLoggingOut(false);
    }
  }

  return (
    <View style={styles.container}>
      <Background showRed={false} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <Container style={styles.scrollContent}>
          <View style={styles.detailsContainer}>
            <ThemedText style={styles.title} variant="title">
              Profile
            </ThemedText>
            <View>
              <View style={styles.card}>
                <ThemedText variant="eyebrow" style={styles.label}>
                  Email
                </ThemedText>
                <ThemedText variant="bodyBold">{user.email}</ThemedText>
              </View>

              <PrivacyPolicyLink style={styles.privacyLink} />
            </View>
          </View>

          <View>
            {logoutError ? (
              <View style={styles.error}>
                <AlertError>{logoutError}</AlertError>
              </View>
            ) : null}

            <Button
              onPress={handleLogout}
              isLoading={isLoggingOut}
              style={styles.logoutButton}
              textStyle={styles.logoutButtonText}
            >
              Logout
            </Button>

            <View style={styles.dangerZone}>
              <Button
                onPress={() => setIsDeleteModalOpen(true)}
                style={styles.deleteButton}
                textStyle={styles.deleteButtonText}
              >
                Delete Account
              </Button>
            </View>
          </View>
        </Container>
      </ScrollView>

      <DeleteAccountModal
        visible={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  detailsContainer: {
    gap: Spacing['4xl'],
  },
  title: {
    marginTop: Spacing['3xl'],
  },
  card: {
    paddingTop: 14,
    paddingBottom: Spacing.xl,
    gap: Spacing.xxs,
  },
  privacyLink: {
    marginTop: Spacing.lg,
    alignSelf: 'flex-start',
    paddingHorizontal: 0,
  },
  label: {
    opacity: 0.6,
  },
  error: {
    marginTop: Spacing.md,
  },
  logoutButton: {
    backgroundColor: Colors.surfaceTranslucentStrong,
  },
  logoutButtonText: {
    color: Colors.textPrimary,
  },
  dangerZone: {
    marginTop: Spacing['4xl'],
  },
  deleteButton: {
    backgroundColor: Colors.dangerStrong,
  },
  deleteButtonText: {
    color: Colors.textPrimary,
  },
});

export default function wrapper() {
  return <Profile />;
}
