import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import Background from '@/components/backgrounds/background';
import Container from '@/components/base/container';
import Button from '@/components/base/button';
import { ThemedText } from '@/components/base/themed-text';
import AlertError from '@/components/alerts/alert-error';
import DeleteAccountModal from '@/components/auth/delete-account-modal';
import { Colors } from '@/constants/theme';
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
      await logout();
      // Clearing auth state makes the navigation guard redirect to /login.
    } catch {
      setLogoutError('Something went wrong, please try again.');
      setIsLoggingOut(false);
    }
  }

  return (
    <View style={styles.container}>
      <Background showRed={false} />
      <Container style={styles.content}>
        <View style={styles.detailsContainer}>
          <ThemedText style={styles.title} variant="title">
            Profile
          </ThemedText>
          <View style={styles.card}>
            <ThemedText variant="eyebrow" style={styles.label}>
              Email
            </ThemedText>
            <ThemedText variant="bodyBold">{user.email}</ThemedText>
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
  content: {
    paddingBottom: 32,
    minHeight: '100%',
    justifyContent: 'space-between',
  },
  detailsContainer: {
    paddingBottom: 25,
  },
  title: {
    marginTop: 10,
    marginBottom: 20,
  },
  card: {
    paddingTop: 14,
    paddingBottom: 12,
    gap: 2,
  },
  label: {
    opacity: 0.6,
  },
  error: {
    marginTop: 8,
  },
  logoutButton: {
    backgroundColor: Colors.surfaceTranslucentStrong,
  },
  logoutButtonText: {
    color: Colors.textPrimary,
  },
  dangerZone: {
    marginTop: 24,
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
