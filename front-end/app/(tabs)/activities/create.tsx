import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FormProvider } from 'react-hook-form';
import Ionicons from '@expo/vector-icons/Ionicons';
import AlertError from '@/components/alerts/alert-error';
import Background from '@/components/backgrounds/background';
import Button from '@/components/base/button';
import DiscardChangesModal from '@/components/activities/discard-changes-modal';
import { ThemedText } from '@/components/base/themed-text';
import { Colors, Spacing } from '@/constants/theme';
import { useActivityForm } from '@/components/activities/use-activity-form';
import ActivityCategoryField from '@/components/activities/fields/activity-category-field';
import ActivityIntervalField from '@/components/activities/fields/activity-interval-field';
import ActivityNameField from '@/components/activities/fields/activity-name-field';
import ActivityTickerField from '@/components/activities/fields/activity-ticker-field';
import ActivityLastDoneField from '@/components/activities/fields/activity-last-done-field';
import ActivityGoalField from '@/components/goals/activity-goal-field';
import { ActivityFormValues } from '@/components/activities/activity-schema';
import { useCategoriesQuery } from '@/hooks/queries/use-categories';
import { useCreateActivityMutation } from '@/hooks/mutations/use-activity-mutations';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { formatDateISO } from '@/utils/date';
import { ApiError } from '@/lib/query/unwrap';
import { goBackOrHome } from '@/lib/navigation/back';

export default function CreateActivityPage() {
  const router = useRouter();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const form = useActivityForm();
  const { data: categories = [] } = useCategoriesQuery();
  const createActivity = useCreateActivityMutation();

  // Asks user if they are sure before leaving a half-filled form
  const discardAndLeave = useCallback(() => {
    form.reset();
    goBackOrHome(router);
  }, [form, router]);
  const leaveGuard = useUnsavedChangesGuard(
    form.formState.isDirty,
    discardAndLeave,
  );

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
        goalTargetPerWeek: values.goalTargetPerWeek,
      });
      form.reset();
      goBackOrHome(router);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
        return;
      }
      setErrorMessage('Something went wrong, please try again.');
    }
  }

  return (
    <View style={styles.container}>
      <Background />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.topRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go back"
              onPress={leaveGuard.requestLeave}
              hitSlop={8}
            >
              <Ionicons
                name="arrow-back"
                size={27}
                color={Colors.textPrimary}
              />
            </Pressable>
            <ThemedText variant="title">New Activity</ThemedText>
          </View>

          <FormProvider {...form}>
            <ActivityNameField />
            <ActivityTickerField />
            <ActivityIntervalField />

            <ActivityCategoryField categories={categories} />

            <ActivityLastDoneField />
            <ActivityGoalField />
          </FormProvider>

          {errorMessage && (
            <View style={styles.errorMessage}>
              <AlertError>{errorMessage}</AlertError>
            </View>
          )}

          <Button
            testID="create-activity-submit-button"
            isLoading={createActivity.isPending}
            style={styles.submitButton}
            onPress={form.handleSubmit(handleSubmit)}
          >
            Create
          </Button>
        </KeyboardAvoidingView>
      </ScrollView>

      <DiscardChangesModal
        visible={leaveGuard.isConfirmVisible}
        onKeepEditing={leaveGuard.cancelLeave}
        onDiscard={leaveGuard.confirmLeave}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 14,
    paddingBottom: Spacing['5xl'],
  },
  topRow: {
    marginTop: 15,
    marginBottom: 23,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xl,
  },
  errorMessage: {
    marginTop: Spacing.lg,
  },
  submitButton: {
    marginTop: 15,
  },
});
