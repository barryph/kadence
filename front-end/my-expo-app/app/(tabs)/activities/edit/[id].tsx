import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FormProvider } from 'react-hook-form';
import UnmountOnBlur from '@/components/router/unmount-on-blur';
import AlertError from '@/components/alerts/alert-error';
import Background from '@/components/backgrounds/background';
import Button from '@/components/base/button';
import { ThemedText } from '@/components/base/themed-text';
import { ThemedView } from '@/components/base/themed-view';
import { activitiesAPI, ICategory } from '@/api/api.activity';
import { useActivityForm } from '@/components/activities/use-activity-form';
import ActivityCategoryField from '@/components/activities/fields/activity-category-field';
import ActivityIntervalField from '@/components/activities/fields/activity-interval-field';
import ActivityNameField from '@/components/activities/fields/activity-name-field';
import ActivityTickerField from '@/components/activities/fields/activity-ticker-field';
import { ActivityFormValues } from '@/components/activities/activity-schema';
import Skeleton from '@/components/ui/skeleton';
import { categoriesAPI } from '@/api/api.categories';
import AlertSuccess from '@/components/alerts/alert-success';

function isString(val: any): val is string {
  return typeof val === 'string';
}

function EditActivityPage() {
  const { id: activityId } = useLocalSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initLoadErrorMessage, setInitLoadErrorMessage] = useState<
    string | null
  >(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<boolean>(false);
  const form = useActivityForm();
  const [categories, setCategories] = useState<ICategory[]>([]);

  const router = useRouter();

  useEffect(() => {
    const abortController = new AbortController();

    async function fetchData() {
      if (!isString(activityId)) {
        setErrorMessage('Invalid Activity ID');
        setIsLoading(false);
        return;
      }

      try {
        const [activityResponse, categoriesResponse] = await Promise.all([
          activitiesAPI.getById(activityId, {
            signal: abortController.signal,
          }),
          categoriesAPI.getAllByUser({
            signal: abortController.signal,
          }),
        ]);

        if (activityResponse.data?.activity) {
          const activity = activityResponse.data.activity;

          form.reset({
            name: activity.name,
            ticker: activity.ticker,
            interval: activity.interval,
            categoryId: activity.categoryId,
          });
        }

        if (categoriesResponse.data?.categories) {
          setCategories(categoriesResponse.data.categories as ICategory[]);
        }
      } catch (err) {
        if (!abortController.signal.aborted) {
          console.error('Error fetching data', err);
          setInitLoadErrorMessage('Error fetching page data, please try again');
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();

    return () => abortController.abort();
  }, []);

  function handleCreatedCategory(category: ICategory) {
    setCategories((prev) => [...prev, category]);
  }

  async function handleSubmit(values: ActivityFormValues) {
    if (!isString(activityId)) {
      setErrorMessage('Invalid Activity ID');
      return;
    }

    setSuccessMessage(false);
    setIsSubmitting(true);
    setErrorMessage(null);

    console.log('value.categoryId', values.categoryId);
    const response = await activitiesAPI.editActivity(activityId, {
      name: values.name,
      ticker: values.ticker,
      interval: values.interval,
      categoryId: values.categoryId,
    });

    if (response.error) {
      setErrorMessage(response.error.message);
      setIsSubmitting(false);
      return;
    }

    setSuccessMessage(true);
    router.back();
  }

  return (
    <ThemedView style={{ flex: 1 }}>
      <Background />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <ThemedText type="title" style={styles.title}>
            Edit Activity
          </ThemedText>
          {initLoadErrorMessage && (
            <AlertError>{initLoadErrorMessage}</AlertError>
          )}
          {isLoading ? (
            <>
              <Skeleton width={200} height={20} style={{ marginBottom: 10 }} />
              <Skeleton height={40} style={{ marginBottom: 20 }} />

              <Skeleton width={200} height={20} style={{ marginBottom: 10 }} />
              <Skeleton height={40} style={{ marginBottom: 20 }} />

              <Skeleton width={200} height={20} style={{ marginBottom: 10 }} />
              <Skeleton height={40} style={{ marginBottom: 20 }} />

              <Skeleton width={200} height={20} style={{ marginBottom: 10 }} />
              <Skeleton height={40} style={{ marginBottom: 20 }} />
            </>
          ) : (
            <>
              {successMessage && <AlertSuccess>Saved!</AlertSuccess>}
              <FormProvider {...form}>
                <ActivityNameField />
                <ActivityTickerField />
                <ActivityIntervalField />

                <ActivityCategoryField
                  categories={categories}
                  onCreate={handleCreatedCategory}
                />
              </FormProvider>

              {errorMessage && (
                <View style={{ marginTop: 10 }}>
                  <AlertError>{errorMessage}</AlertError>
                </View>
              )}

              <Button
                isLoading={isSubmitting}
                style={styles.submitButton}
                onPress={form.handleSubmit(handleSubmit)}
              >
                Save
              </Button>
            </>
          )}
        </KeyboardAvoidingView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  title: {
    marginBottom: 30,
  },
  submitButton: {
    marginTop: 30,
  },
});

export default function wrapper() {
  return (
    <UnmountOnBlur>
      <EditActivityPage />
    </UnmountOnBlur>
  );
}
