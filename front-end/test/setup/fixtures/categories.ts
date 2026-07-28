import type { ICategory } from '@/api/api.categories';

export const testCategory: ICategory = {
  id: 1,
  userId: 'user-1',
  name: 'Fitness',
  color: '#038df0',
};

export const testCategoryAlt: ICategory = {
  id: 2,
  userId: 'user-1',
  name: 'Work',
  color: '#ff3d54',
};

export const testCategories: ICategory[] = [testCategory, testCategoryAlt];
