import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import ColorPicker, {
  Panel1,
  Swatches,
  Preview,
  OpacitySlider,
  HueSlider,
  ColorFormatsObject,
} from 'reanimated-color-picker';
import Input from './input';
import Button from './button';
import { ThemedText } from './themed-text';
import type { ICategory } from '@/api/api.activity';
import Background from './backgrounds/background';
import { categoriesAPI } from '@/api/api.categories';
import AlertError from './alerts/alert-error';

interface AddCategoryModalProps {
  onSave: (category: ICategory) => void;
  onClose: () => void;
}

// TODO: Make both inputs required
export default function AddCategoryModal({
  onSave,
  onClose,
}: AddCategoryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState('#fff');

  // Note: use `onCompleteJS` and `onChangeJS` for non-worklet functions
  function handleSelectColor({ hex }: ColorFormatsObject) {
    setColor(hex);
  }

  async function handleSubmit() {
    setIsLoading(true);
    setErrorMessage(null);

    const response = await categoriesAPI.createCategory({
      name,
      color,
    });

    if (response.error) {
      setErrorMessage(response.error.message);
      setIsLoading(false);
      return;
    }

    onSave(response.data?.category);
  }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableOpacity
          style={styles.backdropFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.card}>
          <Background />
          <ThemedText type="subtitle" style={styles.title}>
            Create A Category
          </ThemedText>
          <Input
            label="Name"
            placeholder="Legs..."
            value={name}
            onChangeText={setName}
          />

          {/* TODO: replace with reusable label component? */}
          <ThemedText style={styles.label} type="defaultSemiBold">
            Color
          </ThemedText>
          {/** Color picker **/}
          <ColorPicker onCompleteJS={handleSelectColor} value={color}>
            <Preview
              style={{ marginBottom: 12, height: 30 }}
              hideInitialColor={true}
            />

            <View>
              <Panel1 style={{ height: 150 }} />
              <HueSlider
                style={{ marginTop: 12 }}
                sliderThickness={20}
                thumbSize={25}
              />
            </View>

            <View style={{ marginTop: 15, marginBottom: 15 }}>
              <OpacitySlider sliderThickness={20} thumbSize={25} />
            </View>

            {/* <Swatches style={{ marginTop: 14 }} /> */}
          </ColorPicker>

          {errorMessage ? (
            <View style={{ marginTop: 10 }}>
              <AlertError>{errorMessage}</AlertError>
            </View>
          ) : null}

          <View style={styles.actions}>
            <Button
              isLoading={isLoading}
              onPress={onClose}
              style={styles.actionButton}
            >
              Cancel
            </Button>
            <Button
              isLoading={isLoading}
              onPress={handleSubmit}
              style={styles.actionButton}
            >
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
    borderRadius: 12,
    padding: 20,
    zIndex: 1,
    overflow: 'hidden',
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
  label: {
    marginBottom: 8,
    fontSize: 14,
    lineHeight: 22,
    color: '#fff',
  },
  colorPickerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
