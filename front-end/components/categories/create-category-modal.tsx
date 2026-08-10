import React from 'react';
import { StyleSheet } from 'react-native';
import { ThemedText } from '@/components/base/themed-text';
import type { ICategory } from '@/api/api.categories';
import CategoryModal, { CategoryFormValues } from './category-modal';
import { useCreateCategoryMutation } from '@/hooks/mutations/use-category-mutations';
import { ApiError } from '@/lib/query/unwrap';
import type { ApiResponse } from '@/api/api.types';

interface CreateCategoryModalProps {
  onSave: (category: ICategory) => void;
  onClose: () => void;
}

export default function CreateCategoryModal({
  onSave,
  onClose,
}: CreateCategoryModalProps) {
  const createCategory = useCreateCategoryMutation();

  async function handleSubmit(
    values: CategoryFormValues,
  ): Promise<ApiResponse<{ category: ICategory }>> {
    try {
      const category = await createCategory.mutateAsync({
        name: values.name,
        color: values.color,
      });
      return { data: { category } };
    } catch (error) {
      if (error instanceof ApiError) {
        return { error: error.appError };
      }
      throw error;
    }
  }

  return (
    <CategoryModal
      title={() => (
        <ThemedText size="medium" style={styles.title}>
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
  title: {
    marginBottom: 16,
    fontWeight: 700,
  },
});
