import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import Background from '@/components/backgrounds/background';
import Container from '@/components/base/container';
import LoaderScreen from '@/components/base/loader-screen';
import { ThemedText } from '@/components/base/themed-text';
import FilterList from '@/components/filter-list/filter-list';
import { toggleActivityFilterMulti } from '@/components/filter-list/filter-by-category';
import ActivityInsightsChartKit from '@/components/insights/activity-insights-chart-kit';
import ListItemShell from '@/components/list-item-shell';
import { useActivitiesQuery } from '@/hooks/queries/use-activities';
import { useActivityEventsQuery } from '@/hooks/queries/use-activity-events';
import {
  aggregateActivityWeeklyUniqueDays,
  getActivityColor,
  hasAnyWeeklyActivity,
} from '@/lib/insights/activity-weekly-unique-days';
import { getLastNWeekRange, YYYYMMDD } from '@/utils/date';

const WEEK_COUNT = 8;

export default function ActivityInsightsScreen() {
  const today = YYYYMMDD();
  const weekRange = useMemo(() => getLastNWeekRange(WEEK_COUNT), [today]);
  const {
    data: activities = [],
    isPending: isActivitiesPending,
    isError: isActivitiesError,
  } = useActivitiesQuery();
  const {
    data: events = [],
    isPending: isEventsPending,
    isError: isEventsError,
  } = useActivityEventsQuery(weekRange.from, weekRange.to);

  const [selectedActivityIds, setSelectedActivityIds] = useState<number[]>([]);

  const filterItems = useMemo(
    () =>
      activities.map((activity) => ({
        id: activity.id,
        name: activity.name,
        color: getActivityColor(activity),
      })),
    [activities],
  );

  const allSeries = useMemo(
    () =>
      aggregateActivityWeeklyUniqueDays(
        events,
        activities,
        weekRange.weekStarts,
      ),
    [activities, events, weekRange.weekStarts],
  );

  function handleActivityPress(activityId: number) {
    setSelectedActivityIds((current) =>
      toggleActivityFilterMulti(current, activityId),
    );
  }

  if (isActivitiesPending || isEventsPending) {
    return <LoaderScreen text="Loading insights..." />;
  }

  if (isActivitiesError || isEventsError) {
    return <LoaderScreen text="Unable to load activity insights." />;
  }

  const showNoActivities = activities.length === 0;
  const showNoActivity = !showNoActivities && !hasAnyWeeklyActivity(allSeries);

  return (
    <View style={styles.container}>
      <Background showRed={false} />

      <ScrollView>
        <Container style={styles.scrollContent}>
          <ThemedText style={styles.title} type="title" size="large">
            Activity Insights
          </ThemedText>

          <ThemedText size="small" style={styles.subtitle}>
            Activities completed over the last {WEEK_COUNT} weeks.
          </ThemedText>

          <FilterList
            label="Activities"
            items={filterItems}
            selectedIds={selectedActivityIds}
            onItemPress={handleActivityPress}
            style={styles.filterList}
          />

          {showNoActivities ? (
            <ListItemShell style={styles.messageShell}>
              <ThemedText size="small" style={styles.messageText}>
                Add activities to start tracking completion trends.
              </ThemedText>
            </ListItemShell>
          ) : (
            <View style={styles.chartShell}>
              {showNoActivity ? (
                <View style={styles.emptyChartMessage}>
                  <ThemedText size="small" style={styles.messageText}>
                    No activity completions in this period yet. Complete
                    activities to see trends here.
                  </ThemedText>
                </View>
              ) : (
                <ActivityInsightsChartKit
                  series={allSeries}
                  weekStarts={weekRange.weekStarts}
                  selectedActivityIds={selectedActivityIds}
                />
              )}
            </View>
          )}
        </Container>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    gap: 12,
    paddingBottom: 40,
  },
  title: {
    marginTop: 10,
    marginBottom: 2,
  },
  subtitle: {
    opacity: 0.65,
    lineHeight: 20,
  },
  filterList: {
    marginTop: 8,
  },
  chartShell: {
    paddingVertical: 0,
    marginTop: 4,
  },
  messageShell: {
    paddingHorizontal: 16,
    paddingVertical: 18,
    marginTop: 4,
  },
  messageText: {
    opacity: 0.7,
    lineHeight: 20,
  },
  emptyChartMessage: {
    minHeight: 220,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
});
