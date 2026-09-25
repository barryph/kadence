import React, { useRef, useState } from 'react';
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
import { Spacing } from '@/constants/theme';

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
  // Mirrors `isLoading` synchronously: two taps can arrive before React has
  // re-rendered the Save button as disabled, and the state value read from the
  // first render's closure would still be `false` for the second.
  const submitInFlight = useRef(false);
  const form = useCategoryForm(initialValues);

  async function handleSubmit(values: CategoryFormValues) {
    if (submitInFlight.current) return;
    submitInFlight.current = true;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await onSubmit(values);

      if (response.error) {
        setErrorMessage(response.error.message);
        return;
      }

      onSave(response.data?.category);
    } catch (error) {
      // `onSubmit` can reject with something other than an ApiError (an edit
      // with no selected category, for instance). Without this the modal stayed
      // in its loading state forever, with no message and an unusable Cancel.
      console.error('Error saving category', error);
      setErrorMessage('Something went wrong, please try again.');
    } finally {
      submitInFlight.current = false;
      setIsLoading(false);
    }
  }

  return (
    <ModalShell onRequestClose={onClose} animationType="none">
      {title && title()}
      <FormProvider {...form}>
        <CategoryNameField />
        <CategoryColorPickerField />
      </FormProvider>

      {errorMessage ? (
        <View style={styles.errorMessage}>
          <AlertError>{errorMessage}</AlertError>
        </View>
      ) : null}

      <View style={styles.actions}>
        <Button
          disabled={isLoading}
          onPress={onClose}
          style={styles.actionButton}
        >
          Cancel
        </Button>
        <Button
          isLoading={isLoading}
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
  errorMessage: {
    marginTop: Spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.xl,
    marginTop: Spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
