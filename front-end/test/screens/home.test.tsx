import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { TestSafeAreaProvider } from '@/test/setup/test-safe-area';
import { TestQueryProvider } from '@/test/setup/test-query-client';
import HomeScreen from '@/app/(tabs)/index';
import { useActivitiesQuery } from '@/hooks/queries/use-activities';
import { useCategoriesQuery } from '@/hooks/queries/use-categories';
import { useTimelineQuery } from '@/hooks/queries/use-timeline';
import { testActivities } from '@/test/setup/fixtures/activities';
import { testCategories } from '@/test/setup/fixtures/categories';
import { resetActivityQueueCache } from '@/lib/storage/activity-queue';

jest.mock('@/hooks/queries/use-activities');
jest.mock('@/hooks/queries/use-categories');
jest.mock('@/hooks/queries/use-timeline');
jest.mock('@/context/auth-context', () =>
  require('@/test/setup/mock-auth').createAuthContextMock(),
);

const mockUseActivitiesQuery = useActivitiesQuery as jest.Mock;
const mockUseCategoriesQuery = useCategoriesQuery as jest.Mock;
const mockUseTimelineQuery = useTimelineQuery as jest.Mock;

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <TestQueryProvider>
      <TestSafeAreaProvider>{ui}</TestSafeAreaProvider>
    </TestQueryProvider>,
  );
}

async function renderHome() {
  return renderWithProviders(<HomeScreen />);
}

describe('Home screen', () => {
  beforeEach(() => {
    resetActivityQueueCache();
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
    mockUseTimelineQuery.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: false,
    });
  });

  it('shows activity list after data loads', async () => {
    await renderHome();

    await waitFor(() => {
      expect(screen.getByText('Activities In Motion')).toBeTruthy();
      expect(screen.getByText('Morning Run')).toBeTruthy();
      expect(screen.getByText('Weekly Review')).toBeTruthy();
    });
  });

  it('shows category filters when categories exist', async () => {
    await renderHome();

    await waitFor(() => {
      expect(screen.getByText('Fitness')).toBeTruthy();
      expect(screen.getByText('Work')).toBeTruthy();
    });
  });

  it('shows empty state when no activities', async () => {
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

    await renderHome();

    await waitFor(() => {
      expect(screen.getByText('Add your first activity')).toBeTruthy();
    });
  });

  it('shows add activity button', async () => {
    await renderHome();

    await waitFor(() => {
      expect(screen.getByText('Add Activity')).toBeTruthy();
    });
  });
});
