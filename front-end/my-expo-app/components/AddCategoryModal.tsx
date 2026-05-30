import { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Input from './Input';
import Button from './Button';
import { ThemedText } from './themed-text';
import type { ICategory } from '@/api/api.activity';

interface AddCategoryModalProps {
  onSave: (category: ICategory) => void;
  onClose: () => void;
}

export default function AddCategoryModal({ onSave, onClose }: AddCategoryModalProps) {
  const [name, setName] = useState('');
  const [color, setColor] = useState('');

  function save() {
    if (!name.trim() || !color.trim()) return;
    onSave({ name: name.trim(), color: color.trim() });
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity style={styles.backdropFill} activeOpacity={1} onPress={onClose} />
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          <ThemedText type="subtitle" style={styles.title}>
            Create A Category
          </ThemedText>
          <Input
            label="Name"
            placeholder="Legs..."
            value={name}
            onChangeText={setName}
          />
          <Input
            label="Color"
            placeholder="Color"
            value={color}
            onChangeText={setColor}
            autoCapitalize="none"
          />
          <View style={styles.actions}>
            <Button onPress={onClose} style={styles.actionButton}>
              Cancel
            </Button>
            <Button onPress={save} style={styles.actionButton}>
              Save
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
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    zIndex: 1,
  },
  title: {
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
});
