import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

import { IActivityClient } from '@/api/api.activity';
import { ThemedText } from '@/components/base/themed-text';
import LoaderScreen from '@/components/base/loader-screen';
import ErrorScreen from '@/components/base/error-screen';
import Background from '@/components/backgrounds/background';
import ActivityListItem from '@/components/activity-list/activity-list-item';
import FloatingActionButton from '@/components/ui/floating-action-button';
import ListItemShell from '@/components/list-item-shell';
import Dot from '@/components/dot';
import Container from '@/components/base/container';
import { Colors, Spacing } from '@/constants/theme';
import FilterList from '@/components/filter-list/filter-list';
import { getMonthOf, YYYYMMDD } from '@/utils/date';
import { useToday } from '@/hooks/use-today';
import {
  filterByCategoryId,
  toggleSingleSelectFilter,
} from '@/components/filter-list/filter-by-category';
import { useAuth } from '@/context/auth-context';
import { useActivitiesQuery } from '@/hooks/queries/use-activities';
import { useCategoriesQuery } from '@/hooks/queries/use-categories';
import { useTimelineQuery } from '@/hooks/queries/use-timeline';
import { useCompleteActivityMutation } from '@/hooks/mutations/use-activity-mutations';
import { useActivityQueue } from '@/hooks/use-activity-queue';
import { useIsOffline } from '@/hooks/use-is-offline';
import { ApiError } from '@/lib/query/unwrap';
import { useGuide } from '@/hooks/use-guide';
import GuideModal from '@/components/guide/guide-modal';
import GuideInfoButton from '@/components/guide/guide-info-button';
import { HOME_GUIDE_STEPS } from '@/components/guide/home-guide-steps';
import {
  logOnboardingComplete,
  logOnboardingSkip,
  logOnboardingStart,
  logOnboardingStepComplete,
  logOnboardingStepView,
} from '@/lib/analytics/analytics';

/**
 * Stable fallback for a query with no data yet, so the array identity does
 * not change on every render and invalidate downstream memoisation.
 */
const EMPTY_LIST: never[] = [];

function sortActivities(acts: IActivityClient[] = []) {
  return [...acts].sort((a, b) => {
    // queued items go first
    if (a.queued !== b.queued) {
      if (a.queued) return -1;
      if (b.queued) return 1;
    }

    // completed items go last
    if (!!a.completedToday !== !!b.completedToday) {
      if (a.completedToday) return 1;
      if (b.completedToday) return -1;
    }

    const daysUntilSort = (a.daysUntil || 0) - (b.daysUntil || 0);
    if (daysUntilSort !== 0) return daysUntilSort;
    return a.name.localeCompare(b.name);
  });
}

function partitionActivities(acts: IActivityClient[]) {
  const queued: IActivityClient[] = [];
  const available: IActivityClient[] = [];
  const completed: IActivityClient[] = [];

  for (const activity of acts) {
    if (activity.completedToday) {
      completed.push(activity);
    } else if (activity.queued) {
      queued.push(activity);
    } else {
      available.push(activity);
    }
  }

  return { queued, available, completed };
}

const ACTIVITY_SECTIONS = [
  { title: 'Queued', key: 'queued' },
  { title: 'Pending', key: 'available' },
  { title: 'Completed', key: 'completed' },
] as const;

/**
 * Step titles and count are fixed. Kept at module scope so
 * the onboarding analytics effect depends only on whether the guide is open.
 */
const HOME_GUIDE_STEP_NAMES = HOME_GUIDE_STEPS.map((step) => step.title);
const HOME_GUIDE_STEP_COUNT = HOME_GUIDE_STEPS.length;

/**
 * Message shown when a swipe-to-complete fails. Connectivity gets its own
 * wording because "check your connection" is actionable only when the device
 * actually knows it has no connection.
 */
function getCompletionErrorMessage(error: unknown, isOffline: boolean): string {
  if (isOffline) {
    return "You're offline. Reconnect and try again.";
  }
  if (error instanceof ApiError) {
    return error.message;
  }
  return 'Please check your connection and try again.';
}

export default function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  return <DashboardContent userId={user.id} />;
}

function DashboardContent({ userId }: { userId: string }) {
  const router = useRouter();
  const {
    data: activitiesData,
    isPending: isActivitiesPending,
    isError: isActivitiesError,
    refetch: refetchActivities,
  } = useActivitiesQuery();
  const {
    data: categoriesData,
    isPending: isCategoriesPending,
    refetch: refetchCategories,
  } = useCategoriesQuery();
  const activities = activitiesData ?? EMPTY_LIST;
  const categories = categoriesData ?? EMPTY_LIST;
  // The user's local date, refreshed at their midnight: everything below
  // ("completed today", the current month's timeline) is relative to it.
  const today = useToday();
  const currentMonth = getMonthOf(today);
  const { data: timeline } = useTimelineQuery(currentMonth);
  const completeActivity = useCompleteActivityMutation();
  const {
    queuedIds,
    isHydrated: isQueueHydrated,
    toggleQueuedActivity,
    removeFromQueue,
  } = useActivityQueue(userId);

  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const isOffline = useIsOffline();

  // Home onboarding guide — auto-shows on first visit; the info (i) icon reopens it.
  const guide = useGuide({ pageId: 'home' });

  // --- Onboarding funnel analytics -------------------------------------------
  // The guide IS onboarding. We measure: start, per-step view, per-step
  // completion, completion, and skip (dismissal without finishing).
  const stepCount = HOME_GUIDE_STEP_COUNT;
  // Index of the step currently (or last) being viewed, so we can derive
  // "step complete" whenever the user moves forward.
  const viewedStepRef = useRef(0);

  // Guide opened → funnel starts on the first step. `HOME_GUIDE_STEP_NAMES`
  // and `stepCount` are module constants, so this fires once per open.
  useEffect(() => {
    if (!guide.isOpen) return;
    viewedStepRef.current = 0;
    logOnboardingStart('home');
    logOnboardingStepView(0, HOME_GUIDE_STEP_NAMES[0] ?? '', stepCount);
  }, [guide.isOpen, stepCount]);

  function handleOnboardingStepChange(index: number) {
    if (index > viewedStepRef.current) {
      // Moving forward: the previously-viewed step was completed.
      logOnboardingStepComplete(viewedStepRef.current, stepCount);
    }
    viewedStepRef.current = index;
    logOnboardingStepView(index, HOME_GUIDE_STEP_NAMES[index] ?? '', stepCount);
  }

  function handleOnboardingDismiss() {
    // Dismissal = skip (abandoned before finishing the funnel).
    logOnboardingSkip(viewedStepRef.current, stepCount);
    guide.dismiss();
  }

  function handleOnboardingComplete() {
    logOnboardingComplete(stepCount);
    guide.finish();
  }

  const activitiesWithQueue = useMemo(() => {
    const withClientState = activities.map((activity) => {
      const completedToday =
        timeline?.[String(activity.id)]?.has(today) ?? false;
      return {
        ...activity,
        queued: !completedToday && queuedIds.has(activity.id),
        completedToday,
      };
    });
    return sortActivities(withClientState);
  }, [activities, queuedIds, timeline, today]);

  function handleActivityClick(activity: IActivityClient) {
    if (activity.completedToday) return;
    toggleQueuedActivity(activity.id);
  }

  async function handleComplete(activityId: number) {
    try {
      await completeActivity.mutateAsync({
        activityId,
        // The user's local date, read at tap time so a completion made just
        // after their midnight is recorded against the new day.
        date: YYYYMMDD(),
      });
      removeFromQueue(activityId);
      Toast.show({
        type: 'success',
        text1: 'Activity Completed',
      });
    } catch (error) {
      console.error('Error completing activity', error);
      Toast.show({
        type: 'error',
        text1: 'Could not complete activity',
        text2: getCompletionErrorMessage(error, isOffline),
      });
    }
  }

  function handleEdit(activity: IActivityClient) {
    router.push(`/activities/edit/${activity.id}`);
  }

  function handleCategoryPress(categoryId: number) {
    setActiveCategoryId((current) =>
      toggleSingleSelectFilter(current, categoryId),
    );
  }

  const filteredActivities = filterByCategoryId(
    activitiesWithQueue,
    activeCategoryId,
  );

  const activitySections = useMemo(() => {
    const groups = partitionActivities(filteredActivities);
    return ACTIVITY_SECTIONS.map(({ title, key }) => ({
      title,
      items: groups[key],
    })).filter((section) => section.items.length > 0);
  }, [filteredActivities]);

  // Queue hydration is local and usually finishes with (or before) network data,
  // so this does not add a noticeable extra loading state.
  if (isActivitiesPending || isCategoriesPending || !isQueueHydrated) {
    return <LoaderScreen text="Loading activities..." />;
  }

  // Only a failure with nothing cached is terminal. A background refetch that
  // fails (a focus refetch, or the date-keyed query rolling over at local
  // midnight while offline) must keep the list that is already on screen -
  // TanStack retains it, and replacing it with an error screen loses usable
  // data for a refresh the user never asked for.
  if (isActivitiesError && !activitiesData) {
    return (
      <ErrorScreen
        message="Unable to load activities."
        onRetry={() => {
          void refetchActivities();
          void refetchCategories();
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <Background />
      <ScrollView>
        <Container style={styles.scrollContent}>
          <View style={styles.headlineRow}>
            <ThemedText
              variant="heading"
              font="system"
              style={[
                styles.headline,
                !(categories.length > 0) && styles.headlineNoCategories,
              ]}
            >
              Activities Center
            </ThemedText>

            <View style={styles.headlineActions}>
              <Pressable
                onPress={() => router.push('/activities/insights')}
                style={styles.insightsLink}
              >
                <ThemedText variant="bodySmall" style={styles.insightsLinkText}>
                  See Insights &rarr;
                </ThemedText>
              </Pressable>
              <GuideInfoButton onPress={guide.open} />
            </View>
          </View>

          <FilterList
            label="Categories"
            items={categories
              .filter((category) => category.id !== undefined)
              .map((category) => ({
                id: category.id!,
                name: category.name,
                color: category.color,
              }))}
            selectedIds={activeCategoryId}
            onItemPress={handleCategoryPress}
          />

          <View
            style={{
              marginTop: Spacing.sm,
              display: 'flex',
              gap: Spacing.md,
            }}
          >
            {activities.length === 0 && (
              <ListItemShell style={styles.getStartedPill}>
                <View
                  style={{
                    flexDirection: 'row',
                    gap: Spacing.xxs,
                    alignItems: 'center',
                  }}
                >
                  <Dot />
                  <ThemedText variant="bodyBold">
                    Add your first activity
                  </ThemedText>
                </View>
                <ThemedText variant="caption">
                  Get started by adding your first activity!
                </ThemedText>
              </ListItemShell>
            )}
            {activitySections.map((section, sectionIndex) => (
              <View
                key={section.title}
                style={sectionIndex > 0 ? styles.sectionGroupSpaced : undefined}
              >
                <ThemedText variant="eyebrow" style={styles.sectionHeader}>
                  {section.title}
                </ThemedText>
                <View style={styles.sectionItems}>
                  {section.items.map((activity) => (
                    <ActivityListItem
                      key={activity.id}
                      testID={`activity-row-${activity.id}`}
                      activity={activity}
                      onClick={handleActivityClick}
                      onEdit={handleEdit}
                      onComplete={handleComplete}
                    />
                  ))}
                </View>
              </View>
            ))}
          </View>
        </Container>
      </ScrollView>

      <FloatingActionButton
        testID="add-activity-button"
        label="Add Activity"
        onPress={() => router.push('/activities/create')}
      />

      <GuideModal
        visible={guide.isOpen}
        steps={HOME_GUIDE_STEPS}
        onClose={handleOnboardingDismiss}
        onComplete={handleOnboardingComplete}
        onStepChange={handleOnboardingStepChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  scrollContent: {
    display: 'flex',
    gap: Spacing.lg,
    paddingBottom: 100,
  },
  headlineRow: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xl,
    marginBottom: 3,
  },
  headlineActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  headline: {
    color: Colors.textPrimary,
  },
  headlineNoCategories: {
    marginBottom: 3,
  },
  insightsLink: {},
  insightsLinkText: {},
  getStartedPill: {
    paddingTop: 14,
    paddingHorizontal: 15,
    paddingBottom: Spacing.xl,
    gap: Spacing.xxs,
  },
  sectionHeader: {
    opacity: 0.6,
    marginBottom: 6,
  },
  sectionGroupSpaced: {
    marginTop: 14,
  },
  sectionItems: {
    gap: Spacing.md,
  },
});
