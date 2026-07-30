import {
  filterByCategoryId,
  toggleCategoryFilter,
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
