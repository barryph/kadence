export function filterByCategoryId<T extends { categoryId?: number }>(
  items: T[],
  activeCategoryId: number | null,
): T[] {
  if (activeCategoryId === null) {
    return items;
  }

  return items.filter((item) => item.categoryId === activeCategoryId);
}

export function toggleCategoryFilter(
  currentCategoryId: number | null,
  categoryId: number,
): number | null {
  return currentCategoryId === categoryId ? null : categoryId;
}
