import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Button from '@/components/base/button';
import { ThemedText } from '@/components/base/themed-text';
import ModalShell from '@/components/base/modal-shell';
import AlertError from '@/components/alerts/alert-error';
import { useAuth } from '@/context/auth-context';
import { ApiError } from '@/lib/query/unwrap';
import { Colors, Spacing } from '@/constants/theme';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
}

/**
 * Confirmation step for account deletion. Deletion is destructive and
 * irreversible, so the user must explicitly confirm; the warning makes the
 * consequences unambiguous. The backend derives the account to delete from the
 * session alone — this screen never sends (or knows) an account identifier.
 */
export default function DeleteAccountModal({
  visible,
  onClose,
}: DeleteAccountModalProps) {
  const { deleteAccount } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setIsDeleting(false);
      setErrorMessage(null);
    }
  }, [visible]);

  function handleClose() {
    if (isDeleting) return;
    setErrorMessage(null);
    onClose();
  }

  async function handleDelete() {
    if (isDeleting) return;

    setIsDeleting(true);
    setErrorMessage(null);

    try {
      await deleteAccount();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Something went wrong, please try again.');
      }
      setIsDeleting(false);
    }
  }

  return (
    <ModalShell
      visible={visible}
      onRequestClose={handleClose}
      dismissDisabled={isDeleting}
    >
      <ThemedText variant="subheading" style={styles.title}>
        Delete Account
      </ThemedText>
      <ThemedText style={styles.message}>
        Deleting your account will permanently remove your account, your
        activities, your history and all of your data. This cannot be undone.
      </ThemedText>

      {errorMessage ? (
        <View style={styles.errorMessage}>
          <AlertError>{errorMessage}</AlertError>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          disabled={isDeleting}
          onPress={handleClose}
          style={styles.actionButton}
        >
          Cancel
        </Button>
        <Button
          isLoading={isDeleting}
          onPress={handleDelete}
          style={[styles.actionButton, styles.deleteButton]}
          textStyle={styles.deleteButtonText}
        >
          Delete
        </Button>
      </View>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: Spacing.md,
    marginBottom: Spacing.xl,
  },
  message: {
    color: Colors.textSecondary,
  },
  errorMessage: {
    marginTop: Spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing['3xl'],
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: Colors.dangerStrong,
  },
  deleteButtonText: {
    color: Colors.textPrimary,
  },
});
