import type { IActivityEvent } from '@/api/api.events';
import type { IActivity } from '@/api/api.activity';
import {
  aggregateActivityWeeklyUniqueDays,
  DEFAULT_ACTIVITY_COLOR,
  filterActivitySeries,
  getActivityColor,
  hasAnyWeeklyActivity,
  isActivityVisible,
} from '@/lib/insights/activity-weekly-unique-days';

describe('aggregateActivityWeeklyUniqueDays', () => {
  const activities: IActivity[] = [
    {
      id: 1,
      userId: 'u1',
      name: 'Squat',
      interval: 3,
      categoryId: 10,
      category: { id: 10, name: 'Legs', color: '#ff0000' },
      daysUntil: 1,
    },
    {
      id: 2,
      userId: 'u1',
      name: 'Bench',
      interval: 3,
      daysUntil: 2,
    },
  ];

  const weekStarts = ['2026-03-02', '2026-03-09', '2026-03-16'];

  it('counts unique completion days per activity per week', () => {
    const events: IActivityEvent[] = [
      { activityId: '1', categoryId: 10, date: '2026-03-03' },
      { activityId: '1', categoryId: 10, date: '2026-03-03' },
      { activityId: '1', categoryId: 10, date: '2026-03-05' },
      { activityId: '1', categoryId: 10, date: '2026-03-07' },
      { activityId: '2', categoryId: null, date: '2026-03-10' },
    ];

    const series = aggregateActivityWeeklyUniqueDays(
      events,
      activities,
      weekStarts,
    );

    expect(series).toHaveLength(2);
    expect(series[0]).toMatchObject({
      activityId: 1,
      name: 'Squat',
      color: '#ff0000',
    });
    expect(series[0].data).toEqual([
      { weekStart: '2026-03-02', value: 3 },
      { weekStart: '2026-03-09', value: 0 },
      { weekStart: '2026-03-16', value: 0 },
    ]);
    expect(series[1].data).toEqual([
      { weekStart: '2026-03-02', value: 0 },
      { weekStart: '2026-03-09', value: 1 },
      { weekStart: '2026-03-16', value: 0 },
    ]);
  });

  it('groups Sunday into the Monday-start week', () => {
    const events: IActivityEvent[] = [
      { activityId: '1', categoryId: 10, date: '2026-03-08' },
    ];

    const series = aggregateActivityWeeklyUniqueDays(
      events,
      activities,
      weekStarts,
    );

    expect(series[0].data[0]).toEqual({ weekStart: '2026-03-02', value: 1 });
  });

  it('uses the default color when an activity has no category', () => {
    const series = aggregateActivityWeeklyUniqueDays([], activities, weekStarts);

    expect(series[1].color).toBe(DEFAULT_ACTIVITY_COLOR);
  });
});

describe('getActivityColor', () => {
  it('returns the category color when available', () => {
    expect(
      getActivityColor({
        id: 1,
        userId: 'u1',
        name: 'Squat',
        interval: 3,
        category: { id: 10, name: 'Legs', color: '#ff0000' },
        daysUntil: 1,
      }),
    ).toBe('#ff0000');
  });

  it('returns the default color when no category is set', () => {
    expect(
      getActivityColor({
        id: 1,
        userId: 'u1',
        name: 'Squat',
        interval: 3,
        daysUntil: 1,
      }),
    ).toBe(DEFAULT_ACTIVITY_COLOR);
  });
});

describe('isActivityVisible', () => {
  it('returns true for every activity when none are selected', () => {
    expect(isActivityVisible(1, [])).toBe(true);
    expect(isActivityVisible(2, [])).toBe(true);
  });

  it('returns true only for selected activities', () => {
    expect(isActivityVisible(1, [1])).toBe(true);
    expect(isActivityVisible(2, [1])).toBe(false);
  });
});

describe('filterActivitySeries', () => {
  const series = [
    {
      activityId: 1,
      name: 'Squat',
      color: '#ff0000',
      data: [],
    },
    {
      activityId: 2,
      name: 'Bench',
      color: '#00ff00',
      data: [],
    },
  ];

  it('returns all series when no activities are selected', () => {
    expect(filterActivitySeries(series, [])).toEqual(series);
  });

  it('returns only selected activities', () => {
    expect(filterActivitySeries(series, [2])).toEqual([series[1]]);
  });
});

describe('hasAnyWeeklyActivity', () => {
  it('returns false when all values are zero', () => {
    expect(
      hasAnyWeeklyActivity([
        {
          activityId: 1,
          name: 'Squat',
          color: '#ff0000',
          data: [{ weekStart: '2026-03-02', value: 0 }],
        },
      ]),
    ).toBe(false);
  });

  it('returns true when any value is greater than zero', () => {
    expect(
      hasAnyWeeklyActivity([
        {
          activityId: 1,
          name: 'Squat',
          color: '#ff0000',
          data: [{ weekStart: '2026-03-02', value: 2 }],
        },
      ]),
    ).toBe(true);
  });
});
