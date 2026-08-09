import { useMemo, useState } from 'react';

import { toggleCategoryFilterMulti } from '@/components/filter-list/filter-by-category';
import WeeklyInsightsScreen from '@/components/insights/weekly-insights-screen';
import { useActivityEventsQuery } from '@/hooks/queries/use-activity-events';
import { useCategoriesQuery } from '@/hooks/queries/use-categories';
import {
  aggregateCategoryWeeklyUniqueDays,
  filterCategorySeries,
  hasAnyWeeklyActivity,
} from '@/lib/insights/category-weekly-unique-days';
import { getLastNWeekRange } from '@/utils/date';

const WEEK_COUNT = 8;

export default function CategoryInsightsScreen() {
  const weekRange = useMemo(() => getLastNWeekRange(WEEK_COUNT), []);
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

  const filterItems = useMemo(
    () =>
      categories
        .filter((category) => category.id !== undefined)
        .map((category) => ({
          id: category.id!,
          name: category.name,
          color: category.color,
        })),
    [categories],
  );

  const allSeries = useMemo(
    () =>
      aggregateCategoryWeeklyUniqueDays(
        events,
        categories,
        weekRange.weekStarts,
      ),
    [categories, events, weekRange.weekStarts],
  );

  const visibleSeries = useMemo(
    () => filterCategorySeries(allSeries, selectedCategoryIds),
    [allSeries, selectedCategoryIds],
  );

  const hasActivity = hasAnyWeeklyActivity(allSeries);

  function handleCategoryPress(categoryId: number) {
    setSelectedCategoryIds((current) =>
      toggleCategoryFilterMulti(current, categoryId),
    );
  }

  return (
    <WeeklyInsightsScreen
      title="Category Insights"
      filterLabel="Categories"
      filterItems={filterItems}
      selectedIds={selectedCategoryIds}
      onItemPress={handleCategoryPress}
      visibleSeries={visibleSeries}
      weekStarts={weekRange.weekStarts}
      weekCount={WEEK_COUNT}
      isLoading={isCategoriesPending || isEventsPending}
      isError={isCategoriesError || isEventsError}
      errorMessage="Unable to load category insights."
      hasActivity={hasActivity}
      noItemsMessage="Add categories to start tracking completion trends."
      noActivityMessage="No category completions in this period yet. Complete activities to see trends here."
      emptyMessage="Select categories to compare, or add categories to begin tracking insights."
    />
  );
}
