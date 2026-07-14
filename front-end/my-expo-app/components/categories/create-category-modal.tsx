import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/base/themed-text';
import type { ICategory } from '@/api/api.categories';
import { categoriesAPI } from '@/api/api.categories';
import CategoryModal, { CategoryFormValues } from './category-modal';

interface CreateCategoryModalProps {
  onSave: (category: ICategory) => void;
  onClose: () => void;
}

export default function CreateCategoryModal({
  onSave,
  onClose,
}: CreateCategoryModalProps) {
  async function handleSubmit(values: CategoryFormValues) {
    const response = await categoriesAPI.createCategory({
      name: values.name,
      color: values.color,
    });
    return response;
  }

  return (
    <CategoryModal
      title={() => (
        <ThemedText type="subtitle" style={styles.title}>
          Create A Category
        </ThemedText>
      )}
      onClose={onClose}
      onSubmit={handleSubmit}
      onSave={onSave}
    />
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
  colorPickerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
