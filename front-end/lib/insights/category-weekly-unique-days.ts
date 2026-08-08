import type { IActivityEvent } from '@/api/api.events';
import type { ICategory } from '@/api/api.categories';
import { getWeekStartMonday } from '@/utils/date';

export interface CategoryWeeklyDataPoint {
  weekStart: string;
  value: number;
}

export interface CategoryWeeklySeries {
  categoryId: number;
  name: string;
  color: string;
  data: CategoryWeeklyDataPoint[];
}

export function aggregateCategoryWeeklyUniqueDays(
  events: IActivityEvent[],
  categories: ICategory[],
  weekStarts: string[],
): CategoryWeeklySeries[] {
  const weekStartSet = new Set(weekStarts);
  const uniqueDaysByCategoryWeek = new Map<string, Set<string>>();

  for (const event of events) {
    if (event.categoryId == null) {
      continue;
    }

    const weekStart = getWeekStartMonday(event.date);
    if (!weekStartSet.has(weekStart)) {
      continue;
    }

    const categoryId = Number(event.categoryId);
    const key = `${categoryId}:${weekStart}`;
    if (!uniqueDaysByCategoryWeek.has(key)) {
      uniqueDaysByCategoryWeek.set(key, new Set());
    }
    uniqueDaysByCategoryWeek.get(key)!.add(event.date);
  }

  return categories
    .filter((category) => category.id !== undefined)
    .map((category) => {
      const categoryId = category.id!;
      const data = weekStarts.map((weekStart) => {
        const key = `${categoryId}:${weekStart}`;
        const uniqueDays = uniqueDaysByCategoryWeek.get(key);
        return {
          weekStart,
          value: uniqueDays?.size ?? 0,
        };
      });

      return {
        categoryId,
        name: category.name,
        color: category.color,
        data,
      };
    });
}

export function isCategoryVisible(
  categoryId: number,
  selectedCategoryIds: number[],
): boolean {
  if (selectedCategoryIds.length === 0) {
    return true;
  }

  const selected = new Set(selectedCategoryIds.map((id) => Number(id)));
  return selected.has(Number(categoryId));
}

export function filterCategorySeries(
  series: CategoryWeeklySeries[],
  selectedCategoryIds: number[],
): CategoryWeeklySeries[] {
  return series.filter((item) =>
    isCategoryVisible(item.categoryId, selectedCategoryIds),
  );
}

export function hasAnyWeeklyActivity(series: CategoryWeeklySeries[]): boolean {
  return series.some((item) => item.data.some((point) => point.value > 0));
}
