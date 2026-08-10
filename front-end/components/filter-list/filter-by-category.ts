export function filterByCategoryId<T extends { categoryId?: number }>(
  items: T[],
  activeCategoryId: number | null,
): T[] {
  if (activeCategoryId === null) {
    return items;
  }

  return items.filter((item) => item.categoryId === activeCategoryId);
}

export function toggleSingleSelectFilter(
  currentId: number | null,
  id: number,
): number | null {
  return currentId === id ? null : id;
}
