import React, { useMemo, useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

import { IActivityClient } from '@/api/api.activity';
import { ThemedText } from '@/components/base/themed-text';
import LoaderScreen from '@/components/base/loader-screen';
import CreateActivityModal from '@/components/activities/create-activity-modal';
import Background from '@/components/backgrounds/background';
import ActivityListItem from '@/components/activity-list/activity-list-item';
import FloatingActionButton from '@/components/ui/floating-action-button';
import ListItemShell from '@/components/list-item-shell';
import Dot from '@/components/dot';
import Container from '@/components/base/container';
import FilterList from '@/components/filter-list/filter-list';
import { getCurrentMonth, YYYYMMDD } from '@/utils/date';
import {
  filterByCategoryId,
  toggleCategoryFilter,
} from '@/components/filter-list/filter-by-category';
import { useActivitiesQuery } from '@/hooks/queries/use-activities';
import { useCategoriesQuery } from '@/hooks/queries/use-categories';
import { useTimelineQuery } from '@/hooks/queries/use-timeline';
import { useCompleteActivityMutation } from '@/hooks/mutations/use-activity-mutations';

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

export default function Dashboard() {
  const router = useRouter();
  const {
    data: activities = [],
    isPending: isActivitiesPending,
    isError: isActivitiesError,
  } = useActivitiesQuery();
  const {
    data: categories = [],
    isPending: isCategoriesPending,
    isError: isCategoriesError,
  } = useCategoriesQuery();
  const currentMonth = getCurrentMonth();
  const { data: timeline } = useTimelineQuery(currentMonth);
  const completeActivity = useCompleteActivityMutation();

  const [queuedIds, setQueuedIds] = useState<Set<number>>(new Set());
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [showNewActivityModal, setShowNewActivityModal] = useState(false);

  const today = YYYYMMDD();

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

  function toggleQueuedActivity(activityId: number) {
    setQueuedIds((current) => {
      const next = new Set(current);
      if (next.has(activityId)) {
        next.delete(activityId);
      } else {
        next.add(activityId);
      }
      return next;
    });
  }

  function removeFromQueue(activityId: number) {
    setQueuedIds((current) => {
      if (!current.has(activityId)) return current;
      const next = new Set(current);
      next.delete(activityId);
      return next;
    });
  }

  function handleActivityClick(activity: IActivityClient) {
    if (activity.completedToday) return;
    toggleQueuedActivity(activity.id);
  }

  async function handleComplete(activityId: number) {
    try {
      await completeActivity.mutateAsync({
        activityId,
        date: YYYYMMDD(),
      });
      removeFromQueue(activityId);
      Toast.show({
        type: 'success',
        text1: 'Activity Completed',
      });
    } catch (error) {
      console.error('Error completing activity', error);
    }
  }

  function handleEdit(activity: IActivityClient) {
    router.push(`/activities/edit/${activity.id}`);
  }

  function handleCategoryPress(categoryId: number) {
    setActiveCategoryId((current) => toggleCategoryFilter(current, categoryId));
  }

  const filteredActivities = filterByCategoryId(
    activitiesWithQueue,
    activeCategoryId,
  );

  if (isActivitiesPending || isCategoriesPending) {
    return <LoaderScreen text="Loading activities..." />;
  }

  if (isActivitiesError || isCategoriesError) {
    return <LoaderScreen text="Unable to load activities." />;
  }

  return (
    <View style={styles.container}>
      <Background />

      <ScrollView>
        <Container style={styles.scrollContent}>
          <View
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <ThemedText
              type="defaultBold"
              style={[
                styles.headline,
                !(categories.length > 0) && styles.headlineNoCategories,
              ]}
            >
              Activities In Motion
            </ThemedText>
          </View>
          <FilterList
            label="Categories"
            categories={categories}
            activeCategoryId={activeCategoryId}
            onCategoryPress={handleCategoryPress}
          />
          <View
            style={{
              marginTop: 6,
              display: 'flex',
              gap: 8,
            }}
          >
            {activities.length === 0 && (
              <ListItemShell style={styles.getStartedPill}>
                <View
                  style={{ flexDirection: 'row', gap: 2, alignItems: 'center' }}
                >
                  <Dot />
                  <ThemedText type="defaultBold">
                    Add your first activity
                  </ThemedText>
                </View>
                <ThemedText size="extraSmall">
                  Get started by adding your first activity!
                </ThemedText>
              </ListItemShell>
            )}
            {filteredActivities.map((activity) => (
              <ActivityListItem
                key={activity.id}
                activity={activity}
                onClick={handleActivityClick}
                onEdit={handleEdit}
                onComplete={handleComplete}
              />
            ))}
          </View>
        </Container>
      </ScrollView>

      <FloatingActionButton
        label="Add Activity"
        onPress={() => setShowNewActivityModal(true)}
      />

      {showNewActivityModal && (
        <CreateActivityModal onClose={() => setShowNewActivityModal(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    display: 'flex',
    gap: 8,
    paddingBottom: 100,
  },
  headline: {
    fontSize: 24,
    marginTop: 10,
    marginBottom: 5,
    color: '#fff',
    letterSpacing: -0.01,
    fontFamily: '"system-ui"',
    fontWeight: 700,
  },
  headlineNoCategories: {
    marginBottom: 3,
  },
  getStartedPill: {
    paddingTop: 14,
    paddingHorizontal: 15,
    paddingBottom: 12,
    gap: 2,
  },
});
