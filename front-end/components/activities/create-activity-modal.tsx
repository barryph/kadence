import { useState } from 'react';
import {
  View,
  Modal,
  ScrollView,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormProvider } from 'react-hook-form';
import Button from '@/components/base/button';
import { ThemedText } from '@/components/base/themed-text';
import Background from '@/components/backgrounds/background';
import AlertError from '@/components/alerts/alert-error';
import { formatDateISO } from '@/utils/date';
import ActivityNameField from '@/components/activities/fields/activity-name-field';
import ActivityTickerField from '@/components/activities/fields/activity-ticker-field';
import ActivityIntervalField from '@/components/activities/fields/activity-interval-field';
import ActivityCategoryField from '@/components/activities/fields/activity-category-field';
import ActivityLastDoneField from '@/components/activities/fields/activity-last-done-field';
import { useActivityForm } from '@/components/activities/use-activity-form';
import { ActivityFormValues } from '@/components/activities/activity-schema';
import { useCategoriesQuery } from '@/hooks/queries/use-categories';
import { useCreateActivityMutation } from '@/hooks/mutations/use-activity-mutations';
import { ApiError } from '@/lib/query/unwrap';

interface CreateActivityModalProps {
  onClose: () => void;
}

export default function CreateActivityModal({
  onClose,
}: CreateActivityModalProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useActivityForm();
  const { data: categories = [] } = useCategoriesQuery();
  const createActivity = useCreateActivityMutation();

  async function handleSubmit(values: ActivityFormValues) {
    setErrorMessage(null);

    try {
      await createActivity.mutateAsync({
        name: values.name,
        ticker: values.ticker,
        interval: values.interval,
        lastDone: values.lastDone ? formatDateISO(values.lastDone) : undefined,
        ...(values.categoryId && {
          categoryId: values.categoryId,
        }),
      });
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
        return;
      }
      setErrorMessage('Something went wrong, please try again.');
    }
  }

  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
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
              <Pressable
                style={styles.closeButton}
                onPress={onClose}
                accessibilityLabel="Close"
              >
                <ThemedText style={styles.closeButtonText}>✕</ThemedText>
              </Pressable>
            </View>

            <FormProvider {...form}>
              <ActivityNameField />
              <ActivityTickerField />
              <ActivityIntervalField />

              <ActivityCategoryField
                categories={categories}
                onCreate={() => {}}
              />

              <ActivityLastDoneField />
            </FormProvider>

            {errorMessage && (
              <View style={{ marginTop: 10 }}>
                <AlertError>{errorMessage}</AlertError>
              </View>
            )}

            <Button
              isLoading={createActivity.isPending}
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
