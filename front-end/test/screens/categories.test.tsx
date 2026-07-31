import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { TestSafeAreaProvider } from '@/test/setup/test-safe-area';
import { TestQueryProvider } from '@/test/setup/test-query-client';
import CategoriesScreen from '@/app/(tabs)/categories/index';
import { useActivitiesQuery } from '@/hooks/queries/use-activities';
import { useCategoriesQuery } from '@/hooks/queries/use-categories';
import { testActivities } from '@/test/setup/fixtures/activities';
import { testCategories } from '@/test/setup/fixtures/categories';

jest.mock('@/hooks/queries/use-activities');
jest.mock('@/hooks/queries/use-categories');

const mockUseActivitiesQuery = useActivitiesQuery as jest.Mock;
const mockUseCategoriesQuery = useCategoriesQuery as jest.Mock;

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <TestQueryProvider>
      <TestSafeAreaProvider>{ui}</TestSafeAreaProvider>
    </TestQueryProvider>,
  );
}

async function renderCategories() {
  return renderWithProviders(<CategoriesScreen />);
}

describe('Categories screen', () => {
  beforeEach(() => {
    mockUseActivitiesQuery.mockReturnValue({
      data: testActivities,
      isPending: false,
      isError: false,
    });
    mockUseCategoriesQuery.mockReturnValue({
      data: testCategories,
      isPending: false,
      isError: false,
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
    mockUseActivitiesQuery.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    });
    mockUseCategoriesQuery.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    });

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
