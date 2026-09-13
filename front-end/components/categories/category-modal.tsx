import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/base/button';
import ModalShell from '@/components/base/modal-shell';
import AlertError from '@/components/alerts/alert-error';
import type { ICategory } from '@/api/api.categories';
import CategoryNameField from '@/components/categories/fields/category-name-field';
import CategoryColorPickerField from '@/components/categories/fields/category-color-picker-field';
import { ApiResponse } from '@/api/api.types';

export const categorySchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(30, 'Name must be <= 30 characters'),
  color: z.string().min(1, 'Color is required'),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;

interface CategoryModalProps {
  initialValues?: Partial<CategoryFormValues>;
  onSubmit: (values: CategoryFormValues) => Promise<ApiResponse<any>>;
  onSave: (category: ICategory) => void;
  onClose: () => void;
  title?: () => React.JSX.Element;
}

function useCategoryForm(initialValues?: Partial<CategoryFormValues>) {
  return useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: '',
      // Data default for the colour picker, not a design token.
      color: '#000',
      ...initialValues,
    },
  });
}

export default function CategoryModal({
  initialValues = {},
  onSubmit,
  onSave,
  onClose,
  title,
}: CategoryModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useCategoryForm(initialValues);

  async function handleSubmit(values: CategoryFormValues) {
    setIsLoading(true);
    setErrorMessage(null);

    const response = await onSubmit(values);

    if (response.error) {
      setErrorMessage(response.error.message);
      setIsLoading(false);
      return;
    }

    onSave(response.data?.category);
  }

  return (
    <ModalShell onRequestClose={onClose} animationType="none">
      {title && title()}
      <FormProvider {...form}>
        <CategoryNameField />
        <CategoryColorPickerField />
      </FormProvider>

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
          onPress={form.handleSubmit(handleSubmit)}
          style={styles.actionButton}
        >
          Save
        </Button>
      </View>
    </ModalShell>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
  },
});
