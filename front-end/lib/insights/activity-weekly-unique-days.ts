import type { IActivityEvent } from '@/api/api.events';
import type { IActivity } from '@/api/api.activity';
import { getWeekStartMonday } from '@/utils/date';

export const DEFAULT_ACTIVITY_COLOR = '#0073FF';

export interface ActivityWeeklyDataPoint {
  weekStart: string;
  value: number;
}

export interface ActivityWeeklySeries {
  activityId: number;
  name: string;
  color: string;
  data: ActivityWeeklyDataPoint[];
}

export function getActivityColor(activity: IActivity): string {
  return activity.category?.color ?? DEFAULT_ACTIVITY_COLOR;
}

export function aggregateActivityWeeklyUniqueDays(
  events: IActivityEvent[],
  activities: IActivity[],
  weekStarts: string[],
): ActivityWeeklySeries[] {
  const weekStartSet = new Set(weekStarts);
  const uniqueDaysByActivityWeek = new Map<string, Set<string>>();

  for (const event of events) {
    const weekStart = getWeekStartMonday(event.date);
    if (!weekStartSet.has(weekStart)) {
      continue;
    }

    const activityId = Number(event.activityId);
    const key = `${activityId}:${weekStart}`;
    if (!uniqueDaysByActivityWeek.has(key)) {
      uniqueDaysByActivityWeek.set(key, new Set());
    }
    uniqueDaysByActivityWeek.get(key)!.add(event.date);
  }

  return activities.map((activity) => {
    const data = weekStarts.map((weekStart) => {
      const key = `${activity.id}:${weekStart}`;
      const uniqueDays = uniqueDaysByActivityWeek.get(key);
      return {
        weekStart,
        value: uniqueDays?.size ?? 0,
      };
    });

    return {
      activityId: activity.id,
      name: activity.name,
      color: getActivityColor(activity),
      data,
    };
  });
}

export function isActivityVisible(
  activityId: number,
  activeActivityId: number | null,
): boolean {
  if (activeActivityId === null) {
    return true;
  }

  return Number(activityId) === Number(activeActivityId);
}

export function filterActivitySeries(
  series: ActivityWeeklySeries[],
  activeActivityId: number | null,
): ActivityWeeklySeries[] {
  return series.filter((item) =>
    isActivityVisible(item.activityId, activeActivityId),
  );
}

export function hasAnyWeeklyActivity(series: ActivityWeeklySeries[]): boolean {
  return series.some((item) => item.data.some((point) => point.value > 0));
}
