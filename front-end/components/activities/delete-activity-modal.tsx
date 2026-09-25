import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Button from '@/components/base/button';
import { ThemedText } from '@/components/base/themed-text';
import ModalShell from '@/components/base/modal-shell';
import AlertError from '@/components/alerts/alert-error';
import { Colors, Spacing } from '@/constants/theme';
import { useDeleteActivityMutation } from '@/hooks/mutations/use-activity-mutations';
import { ApiError } from '@/lib/query/unwrap';

interface DeleteActivityModalProps {
  visible: boolean;
  activityId: string;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteActivityModal({
  visible,
  activityId,
  onClose,
  onDeleted,
}: DeleteActivityModalProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteActivity = useDeleteActivityMutation();

  useEffect(() => {
    if (!visible) {
      setErrorMessage(null);
    }
  }, [visible]);

  function handleClose() {
    if (deleteActivity.isPending) return;
    setErrorMessage(null);
    onClose();
  }

  async function handleDelete() {
    if (deleteActivity.isPending) return;

    setErrorMessage(null);

    try {
      await deleteActivity.mutateAsync(activityId);
      onDeleted();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
        return;
      }
      setErrorMessage('Something went wrong, please try again.');
    }
  }

  return (
    <ModalShell
      visible={visible}
      onRequestClose={handleClose}
      dismissDisabled={deleteActivity.isPending}
    >
      <ThemedText variant="subheading" style={styles.title}>
        Delete Activity
      </ThemedText>
      <ThemedText lineHeight={22} style={styles.message}>
        Deleting this activity is permanent and cannot be undone.
      </ThemedText>

      {errorMessage ? (
        <View style={styles.errorMessage}>
          <AlertError>{errorMessage}</AlertError>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          disabled={deleteActivity.isPending}
          onPress={handleClose}
          style={styles.actionButton}
        >
          Cancel
        </Button>
        <Button
          isLoading={deleteActivity.isPending}
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
