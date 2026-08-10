import {
  filterByCategoryId,
  toggleSingleSelectFilter,
} from '@/components/filter-list/filter-by-category';

describe('filterByCategoryId', () => {
  const items = [
    { id: 1, categoryId: 1 },
    { id: 2, categoryId: 2 },
    { id: 3, categoryId: 1 },
  ];

  it('returns all items when no category is selected', () => {
    expect(filterByCategoryId(items, null)).toEqual(items);
  });

  it('returns only items matching the active category', () => {
    expect(filterByCategoryId(items, 1)).toEqual([
      { id: 1, categoryId: 1 },
      { id: 3, categoryId: 1 },
    ]);
  });
});

describe('toggleSingleSelectFilter', () => {
  it('selects an item when none is active', () => {
    expect(toggleSingleSelectFilter(null, 2)).toBe(2);
  });

  it('deselects the item when it is already active', () => {
    expect(toggleSingleSelectFilter(2, 2)).toBeNull();
  });

  it('switches to a different item when another is active', () => {
    expect(toggleSingleSelectFilter(1, 2)).toBe(2);
  });
});
