import { StyleSheet, View } from 'react-native';
import Button from '@/components/base/button';
import { ThemedText } from '@/components/base/themed-text';
import ModalShell from '@/components/base/modal-shell';
import { Colors, Spacing } from '@/constants/theme';

interface DiscardChangesModalProps {
  visible: boolean;
  /** Dismisses the dialog and keeps the edits. */
  onKeepEditing: () => void;
  /** Discards the edits and leaves the form. */
  onDiscard: () => void;
}

/**
 * Confirmation shown when leaving an activity form with unsaved edits, so a
 * half-finished activity is never dropped silently.
 */
export default function DiscardChangesModal({
  visible,
  onKeepEditing,
  onDiscard,
}: DiscardChangesModalProps) {
  return (
    <ModalShell visible={visible} onRequestClose={onKeepEditing}>
      <ThemedText variant="subheading" style={styles.title}>
        Discard changes?
      </ThemedText>
      <ThemedText lineHeight={22} style={styles.message}>
        Your edits to this activity have not been saved.
      </ThemedText>

      <View style={styles.actions}>
        <Button onPress={onKeepEditing} style={styles.actionButton}>
          Keep editing
        </Button>
        <Button
          onPress={onDiscard}
          style={[styles.actionButton, styles.discardButton]}
          textStyle={styles.discardButtonText}
        >
          Discard
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
  actions: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing['3xl'],
  },
  actionButton: {
    flex: 1,
  },
  discardButton: {
    backgroundColor: Colors.dangerStrong,
  },
  discardButtonText: {
    color: Colors.textPrimary,
  },
});
