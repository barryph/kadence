import { useCallback, useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Dimensions,
  View,
} from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { FormProvider } from 'react-hook-form';
import Ionicons from '@expo/vector-icons/Ionicons';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import AlertError from '@/components/alerts/alert-error';
import Background from '@/components/backgrounds/background';
import Button from '@/components/base/button';
import { ThemedText } from '@/components/base/themed-text';
import { Colors, Shadows, Spacing } from '@/constants/theme';
import { useActivityForm } from '@/components/activities/use-activity-form';
import ActivityCategoryField from '@/components/activities/fields/activity-category-field';
import ActivityIntervalField from '@/components/activities/fields/activity-interval-field';
import ActivityNameField from '@/components/activities/fields/activity-name-field';
import ActivityTickerField from '@/components/activities/fields/activity-ticker-field';
import ActivityGoalField from '@/components/goals/activity-goal-field';
import { ActivityFormValues } from '@/components/activities/activity-schema';
import Skeleton from '@/components/ui/skeleton';
import DeleteActivityModal from '@/components/activities/delete-activity-modal';
import DiscardChangesModal from '@/components/activities/discard-changes-modal';
import { useActivityQuery } from '@/hooks/queries/use-activities';
import { useCategoriesQuery } from '@/hooks/queries/use-categories';
import { useEditActivityMutation } from '@/hooks/mutations/use-activity-mutations';
import { useUnsavedChangesGuard } from '@/hooks/use-unsaved-changes-guard';
import { ApiError } from '@/lib/query/unwrap';
import { goBackOrHome } from '@/lib/navigation/back';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function isString(val: unknown): val is string {
  return typeof val === 'string';
}

export default function EditActivityPage() {
  const { id: activityId } = useLocalSearchParams();
  const activityQuery = useActivityQuery(
    isString(activityId) ? activityId : undefined,
  );
  const { data: categories = [] } = useCategoriesQuery();
  const editActivity = useEditActivityMutation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeleteModalVisible, setIsDeleteModalVisible] = useState(false);
  const form = useActivityForm();
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);
  const [dropdownTop, setDropdownTop] = useState(0);
  const [dropdownRight, setDropdownRight] = useState(0);
  const [initializedForId, setInitializedForId] = useState<string | null>(null);

  const router = useRouter();

  // This screen is a tab screen, so it stays mounted when navigating between
  // activities. The form must be (re)initialized from scratch each time the
  // activity id changes, once that activity's data is available. The guard is
  // checked and set within the same effect so cached data never gets skipped.
  useEffect(() => {
    if (!activityQuery.data) return;
    if (initializedForId === String(activityId)) return;

    const activity = activityQuery.data;
    form.reset({
      name: activity.name,
      ticker: activity.ticker ?? '',
      interval: activity.interval,
      categoryId: activity.categoryId ?? null,
      goalTargetPerWeek: activity.goal?.targetPerWeek ?? null,
    });
    setInitializedForId(String(activityId));
  }, [activityId, activityQuery.data, form, initializedForId]);

  // Transient UI state must never survive a visit to this screen. A successful
  // save redirects away, and a stale error, open dropdown, or open delete modal
  // would otherwise still be showing when the page is opened again.
  const resetUiState = useCallback(() => {
    setErrorMessage(null);
    setIsSubmitting(false);
    setShowSettingsDropdown(false);
    setIsDeleteModalVisible(false);
  }, []);

  // Clear transient UI state when switching between activities.
  useEffect(() => {
    resetUiState();
  }, [activityId, resetUiState]);

  // The screen stays mounted as a tab, so opening or re-opening the page (for
  // example returning after a save) is a focus event, not a mount.
  useFocusEffect(resetUiState);

  const formReady =
    !isString(activityId) || initializedForId === String(activityId);

  // Leaving with unsaved edits asks first. Discarding clears the initialization
  // guard so the effect above restores the server's values: this screen stays
  // mounted as a tab, and an abandoned draft would otherwise be saved later as
  // if it were the current edit.
  const discardAndLeave = useCallback(() => {
    setInitializedForId(null);
    goBackOrHome(router);
  }, [router]);
  const leaveGuard = useUnsavedChangesGuard(
    form.formState.isDirty,
    discardAndLeave,
  );

  async function handleSubmit(values: ActivityFormValues) {
    if (!isString(activityId)) {
      setErrorMessage('Invalid Activity ID');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await editActivity.mutateAsync({
        activityId,
        body: {
          name: values.name,
          ticker: values.ticker,
          interval: values.interval,
          categoryId: values.categoryId,
          goalTargetPerWeek: values.goalTargetPerWeek,
        },
      });
      goBackOrHome(router);
    } catch (error) {
      if (error instanceof ApiError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('Something went wrong, please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const settingsToggleRef = useRef<View>(null);
  const containerRef = useRef<View>(null);

  function toggleSettingsModal() {
    if (!settingsToggleRef.current) return;
    settingsToggleRef.current.measure((x, y, width, height, pageX, pageY) => {
      if (!containerRef.current) return;
      containerRef.current.measure(
        (cX, cY, cWidth, cHeight, cPageX, cPageY) => {
          if (!showSettingsDropdown) {
            setDropdownTop(pageY - cPageY + height);
            setDropdownRight(SCREEN_WIDTH - (pageX + width));
            setShowSettingsDropdown(true);
          } else {
            setShowSettingsDropdown(false);
          }
        },
      );
    });
  }

  const initLoadErrorMessage = !isString(activityId)
    ? 'Invalid Activity ID'
    : activityQuery.isError
      ? 'Error fetching page data, please try again'
      : null;

  return (
    <View style={styles.container} ref={containerRef}>
      <Background />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
      >
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.header}>
            <View style={styles.titleRow}>
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
              <ThemedText variant="title">Edit Activity</ThemedText>
            </View>
            <View style={styles.settingsToggle} ref={settingsToggleRef}>
              <Pressable onPress={toggleSettingsModal}>
                <MaterialCommunityIcons
                  name="dots-vertical"
                  size={24}
                  color={Colors.textPrimary}
                  style={styles.settingsIcon}
                />
              </Pressable>
            </View>
          </View>
          <View style={styles.form}>
            {initLoadErrorMessage ? (
              // The form can never become ready here: a failed load leaves
              // `initializedForId` unset, and an invalid/missing id disables the
              // query so it stays pending forever. Render a terminal state with
              // a retry instead of an animating skeleton stack that never ends.
              <View style={styles.loadError}>
                <AlertError>{initLoadErrorMessage}</AlertError>
                {activityQuery.isError ? (
                  <Button
                    onPress={() => void activityQuery.refetch()}
                    style={styles.retryButton}
                  >
                    Try again
                  </Button>
                ) : null}
              </View>
            ) : activityQuery.isPending || !formReady ? (
              <>
                <Skeleton
                  width={200}
                  height={20}
                  style={styles.skeletonLabel}
                />
                <Skeleton height={40} style={styles.skeletonInput} />

                <Skeleton
                  width={200}
                  height={20}
                  style={styles.skeletonLabel}
                />
                <Skeleton height={40} style={styles.skeletonInput} />

                <Skeleton
                  width={200}
                  height={20}
                  style={styles.skeletonLabel}
                />
                <Skeleton height={40} style={styles.skeletonInput} />

                <Skeleton
                  width={200}
                  height={20}
                  style={styles.skeletonLabel}
                />
                <Skeleton height={40} style={styles.skeletonInput} />
              </>
            ) : (
              <>
                <FormProvider {...form}>
                  <ActivityNameField />
                  <ActivityTickerField />
                  <ActivityIntervalField />

                  <ActivityCategoryField categories={categories} />
                  <ActivityGoalField />
                </FormProvider>

                {errorMessage && (
                  <View style={styles.errorMessage}>
                    <AlertError>{errorMessage}</AlertError>
                  </View>
                )}

                <Button
                  testID="edit-activity-submit-button"
                  isLoading={isSubmitting}
                  style={styles.submitButton}
                  onPress={form.handleSubmit(handleSubmit)}
                >
                  Save
                </Button>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </ScrollView>

      <DeleteActivityModal
        visible={isDeleteModalVisible}
        activityId={isString(activityId) ? activityId : ''}
        onClose={() => setIsDeleteModalVisible(false)}
        onDeleted={() => {
          setIsDeleteModalVisible(false);
          goBackOrHome(router);
        }}
      />

      <DiscardChangesModal
        visible={leaveGuard.isConfirmVisible}
        onKeepEditing={leaveGuard.cancelLeave}
        onDiscard={leaveGuard.confirmLeave}
      />

      {showSettingsDropdown && (
        <View
          style={[
            styles.settingsDropdown,
            { top: dropdownTop, right: dropdownRight },
          ]}
        >
          <Pressable
            style={styles.settingsDropdownItem}
            onPress={(event) => {
              event.stopPropagation();
              event.preventDefault();
              setIsDeleteModalVisible(true);
            }}
          >
            <ThemedText style={styles.settingsDeleteButton} variant="bodyBold">
              Delete
            </ThemedText>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadError: {
    gap: Spacing.xl,
  },
  retryButton: {
    marginTop: Spacing.xs,
  },
  skeletonLabel: {
    marginBottom: Spacing.lg,
  },
  skeletonInput: {
    marginBottom: Spacing['3xl'],
  },
  errorMessage: {
    marginTop: Spacing.lg,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing['2xl'],
    paddingTop: 14,
    paddingBottom: Spacing['5xl'],
  },
  form: {
    zIndex: 0,
    elevation: 0,
  },
  header: {
    zIndex: 1,
    elevation: 1,
    marginTop: Spacing['3xl'],
    marginBottom: 25,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xl,
  },
  settingsToggle: {
    zIndex: 10,
    elevation: 10,
  },
  settingsIcon: {
    paddingHorizontal: Spacing.md,
  },
  settingsDropdown: {
    position: 'absolute',
    width: 150,
    marginTop: Spacing.xl,
    borderRadius: 8,
    overflow: 'hidden',
    zIndex: 999999,
    elevation: 999999,
    ...Shadows.menu,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  settingsDropdownItem: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing['2xl'],
  },
  settingsDeleteButton: {
    color: Colors.dangerText,
  },
  submitButton: {
    marginTop: 30,
  },
});
