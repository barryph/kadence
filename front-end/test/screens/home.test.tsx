import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { TestSafeAreaProvider } from '@/test/setup/test-safe-area';
import HomeScreen from '@/app/(tabs)/index';
import { activitiesAPI } from '@/api/api.activity';
import { categoriesAPI } from '@/api/api.categories';
import { testActivities } from '@/test/setup/fixtures/activities';
import { testCategories } from '@/test/setup/fixtures/categories';

jest.mock('@/api/api.activity');
jest.mock('@/api/api.categories');

const mockGetActivities = activitiesAPI.getAllByUser as jest.Mock;
const mockGetCategories = categoriesAPI.getAllByUser as jest.Mock;

async function renderHome() {
  return render(
    <TestSafeAreaProvider>
      <HomeScreen />
    </TestSafeAreaProvider>,
  );
}

describe('Home screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetActivities.mockResolvedValue({
      data: { activities: testActivities },
    });
    mockGetCategories.mockResolvedValue({
      data: { categories: testCategories },
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
    mockGetActivities.mockResolvedValue({ data: { activities: [] } });
    mockGetCategories.mockResolvedValue({ data: { categories: [] } });

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
