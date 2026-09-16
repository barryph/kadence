import { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import Button from '@/components/base/button';
import { ThemedText } from '@/components/base/themed-text';
import ModalShell from '@/components/base/modal-shell';
import AlertError from '@/components/alerts/alert-error';
import { useDeleteCategoryMutation } from '@/hooks/mutations/use-category-mutations';
import { ApiError } from '@/lib/query/unwrap';
import { Colors, Spacing } from '@/constants/theme';

interface DeleteCategoryModalProps {
  visible: boolean;
  categoryId: number | string;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteCategoryModal({
  visible,
  categoryId,
  onClose,
  onDeleted,
}: DeleteCategoryModalProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const deleteCategory = useDeleteCategoryMutation();

  useEffect(() => {
    if (!visible) {
      setErrorMessage(null);
    }
  }, [visible]);

  function handleClose() {
    if (deleteCategory.isPending) return;
    setErrorMessage(null);
    onClose();
  }

  async function handleDelete() {
    if (deleteCategory.isPending) return;

    setErrorMessage(null);

    try {
      await deleteCategory.mutateAsync(categoryId);
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
      dismissDisabled={deleteCategory.isPending}
    >
      <ThemedText variant="subheading" style={styles.title}>
        Delete Category
      </ThemedText>
      <ThemedText style={styles.message}>
        Deleting is permanent and cannot be undone.
      </ThemedText>
      <ThemedText style={styles.messageTwo}>
        This category will be removed from activities it&apos;s currently
        attached to.
      </ThemedText>

      {errorMessage ? (
        <View style={{ marginTop: Spacing.lg }}>
          <AlertError>{errorMessage}</AlertError>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          disabled={deleteCategory.isPending}
          onPress={handleClose}
          style={styles.actionButton}
        >
          Cancel
        </Button>
        <Button
          isLoading={deleteCategory.isPending}
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
  messageTwo: {
    paddingTop: Spacing.sm,
    color: Colors.textSecondary,
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
