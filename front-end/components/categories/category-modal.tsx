import React, { useState } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { FormProvider, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import Button from '@/components/base/button';
import Background from '@/components/backgrounds/background';
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
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable style={styles.backdropFill} onPress={onClose} />
        <View style={styles.card}>
          <Background />
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
  colorPickerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
