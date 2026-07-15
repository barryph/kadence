import { useEffect, useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Button from '@/components/base/button';
import { ThemedText } from '@/components/base/themed-text';
import Background from '@/components/backgrounds/background';
import AlertError from '@/components/alerts/alert-error';
import { activitiesAPI } from '@/api/api.activity';

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
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) {
      setErrorMessage(null);
      setIsDeleting(false);
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

    const response = await activitiesAPI.deleteActivity(activityId);

    if (response.error) {
      setErrorMessage(response.error.message);
      setIsDeleting(false);
      return;
    }

    setIsDeleting(false);
    onDeleted();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={styles.backdropFill}
          onPress={handleClose}
          disabled={isDeleting}
        />
        <View style={styles.card}>
          <Background />
          <ThemedText type="subtitle" style={styles.title}>
            Delete Activity
          </ThemedText>
          <ThemedText style={styles.message}>
            Deleting this activity is permanent and cannot be undone.
          </ThemedText>

          {errorMessage ? (
            <View style={{ marginTop: 10 }}>
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
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  backdropFill: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 20,
    zIndex: 1,
    overflow: 'hidden',
  },
  title: {
    marginTop: 8,
    marginBottom: 12,
  },
  message: {
    lineHeight: 22,
    color: '#ccc',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    backgroundColor: '#c62828',
  },
  deleteButtonText: {
    color: '#fff',
  },
});
