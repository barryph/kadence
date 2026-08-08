import {
  filterByCategoryId,
  toggleCategoryFilter,
  toggleCategoryFilterMulti,
  toSingleSelectedCategoryIds,
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

describe('toggleCategoryFilter', () => {
  it('selects a category when none is active', () => {
    expect(toggleCategoryFilter(null, 2)).toBe(2);
  });

  it('deselects the category when it is already active', () => {
    expect(toggleCategoryFilter(2, 2)).toBeNull();
  });

  it('switches to a different category when another is active', () => {
    expect(toggleCategoryFilter(1, 2)).toBe(2);
  });
});

describe('toggleCategoryFilterMulti', () => {
  it('adds a category when it is not selected', () => {
    expect(toggleCategoryFilterMulti([], 2)).toEqual([2]);
  });

  it('removes a category when it is already selected', () => {
    expect(toggleCategoryFilterMulti([1, 2], 2)).toEqual([1]);
  });
});

describe('toSingleSelectedCategoryIds', () => {
  it('returns an empty array when no category is active', () => {
    expect(toSingleSelectedCategoryIds(null)).toEqual([]);
  });

  it('returns a single-item array when a category is active', () => {
    expect(toSingleSelectedCategoryIds(3)).toEqual([3]);
  });
});
