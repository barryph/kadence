import type { ITimeline, ITimelineSet } from '@/api/api.timeline';

export function timelineToSet(timeline: ITimeline): ITimelineSet {
  return Object.keys(timeline).reduce<ITimelineSet>((acc, key) => {
    acc[key] = new Set(timeline[key]);
    return acc;
  }, {});
}

export function patchTimelineSet(
  timeline: ITimelineSet,
  activityId: string | number,
  dateKey: string,
  completed: boolean,
): ITimelineSet {
  const id = String(activityId);
  const next = { ...timeline };
  const dates = new Set(next[id] ?? []);

  if (completed) {
    dates.add(dateKey);
  } else {
    dates.delete(dateKey);
  }

  next[id] = dates;
  return next;
}
