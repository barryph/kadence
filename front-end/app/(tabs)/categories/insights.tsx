import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import Background from '@/components/backgrounds/background';
import Container from '@/components/base/container';
import LoaderScreen from '@/components/base/loader-screen';
import { ThemedText } from '@/components/base/themed-text';
import FilterList from '@/components/filter-list/filter-list';
import { toggleCategoryFilterMulti } from '@/components/filter-list/filter-by-category';
import CategoryInsightsChart from '@/components/insights/category-insights-chart';
import ListItemShell from '@/components/list-item-shell';
import { useCategoriesQuery } from '@/hooks/queries/use-categories';
import { useActivityEventsQuery } from '@/hooks/queries/use-activity-events';
import {
  aggregateCategoryWeeklyUniqueDays,
  hasAnyWeeklyActivity,
} from '@/lib/insights/category-weekly-unique-days';
import { getLastNWeekRange, YYYYMMDD } from '@/utils/date';

const WEEK_COUNT = 8;

export default function CategoryInsightsScreen() {
  const today = YYYYMMDD();
  const weekRange = useMemo(() => getLastNWeekRange(WEEK_COUNT), [today]);
  const {
    data: categories = [],
    isPending: isCategoriesPending,
    isError: isCategoriesError,
  } = useCategoriesQuery();
  const {
    data: events = [],
    isPending: isEventsPending,
    isError: isEventsError,
  } = useActivityEventsQuery(weekRange.from, weekRange.to);

  const [selectedCategoryIds, setSelectedCategoryIds] = useState<number[]>([]);

  const allSeries = useMemo(
    () =>
      aggregateCategoryWeeklyUniqueDays(
        events,
        categories,
        weekRange.weekStarts,
      ),
    [categories, events, weekRange.weekStarts],
  );

  function handleCategoryPress(categoryId: number) {
    setSelectedCategoryIds((current) =>
      toggleCategoryFilterMulti(current, categoryId),
    );
  }

  if (isCategoriesPending || isEventsPending) {
    return <LoaderScreen text="Loading insights..." />;
  }

  if (isCategoriesError || isEventsError) {
    return <LoaderScreen text="Unable to load category insights." />;
  }

  const showNoCategories = categories.length === 0;
  const showNoActivity = !showNoCategories && !hasAnyWeeklyActivity(allSeries);

  return (
    <View style={styles.container}>
      <Background showRed={false} />

      <ScrollView>
        <Container style={styles.scrollContent}>
          <ThemedText style={styles.title} type="title" size="large">
            Category Insights
          </ThemedText>

          <ThemedText size="small" style={styles.subtitle}>
            Activities completed over the last {WEEK_COUNT} weeks.
          </ThemedText>

          <FilterList
            label="Categories"
            categories={categories}
            selectedCategoryIds={selectedCategoryIds}
            onCategoryPress={handleCategoryPress}
            style={styles.filterList}
          />

          {showNoCategories ? (
            <ListItemShell style={styles.messageShell}>
              <ThemedText size="small" style={styles.messageText}>
                Add categories to start tracking completion trends.
              </ThemedText>
            </ListItemShell>
          ) : (
            <View style={styles.chartShell}>
              {showNoActivity ? (
                <View style={styles.emptyChartMessage}>
                  <ThemedText size="small" style={styles.messageText}>
                    No category completions in this period yet. Complete
                    activities to see trends here.
                  </ThemedText>
                </View>
              ) : (
                <CategoryInsightsChart
                  series={allSeries}
                  weekStarts={weekRange.weekStarts}
                  endDate={weekRange.to}
                  selectedCategoryIds={selectedCategoryIds}
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
