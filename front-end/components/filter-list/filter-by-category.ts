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

export function toggleMultiSelectFilter(
  selectedIds: number[],
  id: number,
): number[] {
  if (selectedIds.includes(id)) {
    return selectedIds.filter((item) => item !== id);
  }

  return [...selectedIds, id];
}

export function toggleCategoryFilterMulti(
  selectedCategoryIds: number[],
  categoryId: number,
): number[] {
  return toggleMultiSelectFilter(selectedCategoryIds, categoryId);
}

export function toggleActivityFilterMulti(
  selectedActivityIds: number[],
  activityId: number,
): number[] {
  return toggleMultiSelectFilter(selectedActivityIds, activityId);
}

export function toSingleSelectedCategoryIds(
  activeCategoryId: number | null,
): number[] {
  return activeCategoryId === null ? [] : [activeCategoryId];
}
