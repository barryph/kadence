import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { TestSafeAreaProvider } from '@/test/setup/test-safe-area';
import CategoriesScreen from '@/app/(tabs)/categories/index';
import { activitiesAPI } from '@/api/api.activity';
import { categoriesAPI } from '@/api/api.categories';
import { testActivities } from '@/test/setup/fixtures/activities';
import { testCategories } from '@/test/setup/fixtures/categories';

jest.mock('@/api/api.activity');
jest.mock('@/api/api.categories');

const mockGetActivities = activitiesAPI.getAllByUser as jest.Mock;
const mockGetCategories = categoriesAPI.getAllByUser as jest.Mock;

async function renderCategories() {
  return render(
    <TestSafeAreaProvider>
      <CategoriesScreen />
    </TestSafeAreaProvider>,
  );
}

describe('Categories screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetActivities.mockResolvedValue({
      data: { activities: testActivities },
    });
    mockGetCategories.mockResolvedValue({
      data: { categories: testCategories },
    });
  });

  it('shows category list after data loads', async () => {
    await renderCategories();

    await waitFor(() => {
      expect(screen.getByText('Categories')).toBeTruthy();
      expect(screen.getByText('Fitness')).toBeTruthy();
      expect(screen.getByText('Work')).toBeTruthy();
    });
  });

  it('shows activity usage counts', async () => {
    await renderCategories();

    await waitFor(() => {
      expect(screen.getAllByText(/Used in/).length).toBeGreaterThan(0);
    });
  });

  it('shows empty state when no categories', async () => {
    mockGetActivities.mockResolvedValue({ data: { activities: [] } });
    mockGetCategories.mockResolvedValue({ data: { categories: [] } });

    await renderCategories();

    await waitFor(() => {
      expect(screen.getByText('Add your first category')).toBeTruthy();
    });
  });

  it('shows create category button', async () => {
    await renderCategories();

    await waitFor(() => {
      expect(screen.getByText('Create Category')).toBeTruthy();
    });
  });
});
