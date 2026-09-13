import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
  type ModalProps,
} from 'react-native';

import Background from '@/components/backgrounds/background';
import { Colors, Spacing } from '@/constants/theme';

export interface ModalShellProps {
  /** Defaults to visible; pass `false` to keep the modal mounted but hidden. */
  visible?: boolean;
  onRequestClose: () => void;
  animationType?: ModalProps['animationType'];
  /** Blocks backdrop taps, e.g. while a destructive action is in flight. */
  dismissDisabled?: boolean;
  children: ReactNode;
}

/**
 * Shared frame for the app's dialogs: a scrim, and a brand card (gradient
 * background, rounded, clipped) centred above it. Callers supply only their own
 * content, so a dialog does not re-implement the backdrop or the card.
 */
export default function ModalShell({
  visible = true,
  onRequestClose,
  animationType = 'fade',
  dismissDisabled = false,
  children,
}: ModalShellProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType={animationType}
      onRequestClose={onRequestClose}
    >
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onRequestClose}
          disabled={dismissDisabled}
        />
        <View style={styles.card}>
          <Background />
          {children}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing['4xl'],
    backgroundColor: Colors.scrim,
  },
  card: {
    borderRadius: 12,
    padding: Spacing['3xl'],
    zIndex: 1,
    overflow: 'hidden',
  },
});
