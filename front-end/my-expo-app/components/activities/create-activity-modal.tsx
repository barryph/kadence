import { useEffect, useState } from 'react';
import {
  View,
  Modal,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormProvider } from 'react-hook-form';
import Button from '@/components/base/button';
import { ThemedText } from '@/components/base/themed-text';
import {
  activitiesAPI,
  type IActivity,
  type ICategory,
} from '@/api/api.activity';
import Background from '@/components/backgrounds/background';
import AlertError from '@/components/alerts/alert-error';
import { categoriesAPI } from '@/api/api.categories';

import ActivityNameField from '@/components/activities/fields/activity-name-field';
import ActivityTickerField from '@/components/activities/fields/activity-ticker-field';
import ActivityIntervalField from '@/components/activities/fields/activity-interval-field';
import ActivityCategoryField from '@/components/activities/fields/activity-category-field';
import ActivityLastDoneField from '@/components/activities/fields/activity-last-done-field';
import { useActivityForm } from '@/components/activities/use-activity-form';
import { ActivityFormValues } from '@/components/activities/activity-schema';

function formatDateISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface CreateActivityModalProps {
  onClose: (activity?: IActivity) => void;
}

export default function CreateActivityModal({
  onClose,
}: CreateActivityModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const form = useActivityForm();

  // TODO: Add clear category button
  const [categories, setCategories] = useState<ICategory[]>([
    // { name: 'Sprint', color: 'green' },
    // { name: 'Jump', color: 'red' },
    // { name: 'BB', color: 'blue' },
  ]);

  // Fetch categories
  useEffect(() => {
    const abortController = new AbortController();

    async function fetchCategories() {
      console.log('fetching categories');
      try {
        const response = await categoriesAPI.getAllByUser({
          signal: abortController.signal,
        });
        if (response.data?.categories) {
          setCategories(response.data.categories as ICategory[]);
          setIsLoading(false);
        }
      } catch (err) {
        console.error('Error fetching activities', err);
        setIsLoading(false);
      }
    }

    fetchCategories();
    return () => abortController.abort();
  }, []);

  function handleCreatedCategory(category: ICategory) {
    setCategories((prev) => [...prev, category]);
  }

  async function handleSubmit(values: ActivityFormValues) {
    setIsLoading(true);
    setErrorMessage(null);

    const response = await activitiesAPI.createActivity({
      name: values.name,
      ticker: values.ticker,
      interval: values.interval,
      lastDone: values.lastDone ? formatDateISO(values.lastDone) : undefined,
      ...(values.categoryId && {
        categoryId: values.categoryId,
      }),
    });

    if (response.error) {
      setErrorMessage(response.error.message);
      setIsLoading(false);
      return;
    }

    onClose(response.data?.activity);
  }

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={() => onClose()}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <Background showRed={false} />
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.title}>
              <ThemedText type="title">New activity</ThemedText>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => onClose()}
                accessibilityLabel="Close"
              >
                <ThemedText style={styles.closeButtonText}>✕</ThemedText>
              </TouchableOpacity>
            </View>

            <FormProvider {...form}>
              <ActivityNameField />
              <ActivityTickerField />
              <ActivityIntervalField />

              <ActivityCategoryField
                categories={categories}
                onCreate={handleCreatedCategory}
              />

              <ActivityLastDoneField />
            </FormProvider>

            {errorMessage ? (
              <View style={{ marginTop: 10 }}>
                <AlertError>{errorMessage}</AlertError>
              </View>
            ) : null}

            <Button
              isLoading={isLoading}
              style={styles.submitButton}
              onPress={form.handleSubmit(handleSubmit)}
            >
              Create
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  closeButton: {
    zIndex: 10,
    padding: 8,
  },
  closeButtonText: {
    fontSize: 28,
    opacity: 0.5,
    lineHeight: 28,
  },
  title: {
    marginBottom: 30,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  submitButton: {
    marginTop: 30,
  },
});
