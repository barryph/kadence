import type { IActivityEvent } from '@/api/api.events';
import type { ICategory } from '@/api/api.categories';
import {
  aggregateCategoryWeeklyUniqueDays,
  filterCategorySeries,
  hasAnyWeeklyActivity,
  isCategoryVisible,
} from '@/lib/insights/category-weekly-unique-days';

describe('aggregateCategoryWeeklyUniqueDays', () => {
  const categories: ICategory[] = [
    { id: 1, name: 'Legs', color: '#ff0000' },
    { id: 2, name: 'Push', color: '#00ff00' },
  ];

  const weekStarts = ['2026-03-02', '2026-03-09', '2026-03-16'];

  it('counts unique completion days per category per week', () => {
    const events: IActivityEvent[] = [
      { activityId: 'a1', categoryId: 1, date: '2026-03-03' },
      { activityId: 'a2', categoryId: 1, date: '2026-03-03' },
      { activityId: 'a1', categoryId: 1, date: '2026-03-05' },
      { activityId: 'a1', categoryId: 1, date: '2026-03-07' },
      { activityId: 'a3', categoryId: 2, date: '2026-03-10' },
    ];

    const series = aggregateCategoryWeeklyUniqueDays(
      events,
      categories,
      weekStarts,
    );

    expect(series).toHaveLength(2);
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
      { activityId: 'a1', categoryId: 1, date: '2026-03-08' },
    ];

    const series = aggregateCategoryWeeklyUniqueDays(
      events,
      categories,
      weekStarts,
    );

    expect(series[0].data[0]).toEqual({ weekStart: '2026-03-02', value: 1 });
  });

  it('ignores events without a category', () => {
    const events: IActivityEvent[] = [
      { activityId: 'a1', categoryId: null, date: '2026-03-03' },
    ];

    const series = aggregateCategoryWeeklyUniqueDays(
      events,
      categories,
      weekStarts,
    );

    expect(series.every((item) => item.data.every((point) => point.value === 0)))
      .toBe(true);
  });
});

describe('isCategoryVisible', () => {
  it('returns true for every category when none are selected', () => {
    expect(isCategoryVisible(1, [])).toBe(true);
    expect(isCategoryVisible(2, [])).toBe(true);
  });

  it('returns true only for selected categories', () => {
    expect(isCategoryVisible(1, [1])).toBe(true);
    expect(isCategoryVisible(2, [1])).toBe(false);
  });

  it('matches selected ids even when types differ', () => {
    expect(isCategoryVisible(2, ['2' as unknown as number])).toBe(true);
  });
});

describe('filterCategorySeries', () => {
  const series = [
    {
      categoryId: 1,
      name: 'Legs',
      color: '#ff0000',
      data: [],
    },
    {
      categoryId: 2,
      name: 'Push',
      color: '#00ff00',
      data: [],
    },
  ];

  it('returns all series when no categories are selected', () => {
    expect(filterCategorySeries(series, [])).toEqual(series);
  });

  it('returns only selected categories', () => {
    expect(filterCategorySeries(series, [2])).toEqual([series[1]]);
  });

  it('preserves each category series data independently of selection', () => {
    const fullSeries = [
      {
        categoryId: 1,
        name: 'Legs',
        color: '#ff0000',
        data: [{ weekStart: '2026-03-02', value: 3 }],
      },
      {
        categoryId: 2,
        name: 'Push',
        color: '#00ff00',
        data: [{ weekStart: '2026-03-02', value: 1 }],
      },
    ];

    const legsAlone = filterCategorySeries(fullSeries, [1])[0];
    const legsWithPush = filterCategorySeries(fullSeries, [1, 2])[0];

    expect(legsAlone).toEqual(fullSeries[0]);
    expect(legsWithPush).toEqual(fullSeries[0]);
  });

  it('matches selected ids even when types differ', () => {
    expect(filterCategorySeries(series, ['2' as unknown as number])).toEqual([
      series[1],
    ]);
  });
});

describe('hasAnyWeeklyActivity', () => {
  it('returns false when all values are zero', () => {
    expect(
      hasAnyWeeklyActivity([
        {
          categoryId: 1,
          name: 'Legs',
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
          categoryId: 1,
          name: 'Legs',
          color: '#ff0000',
          data: [{ weekStart: '2026-03-02', value: 2 }],
        },
      ]),
    ).toBe(true);
  });
});
