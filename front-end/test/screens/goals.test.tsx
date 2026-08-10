import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { TestSafeAreaProvider } from '@/test/setup/test-safe-area';
import { TestQueryProvider } from '@/test/setup/test-query-client';
import GoalsScreen from '@/app/(tabs)/goals/index';
import { useGoalsQuery } from '@/hooks/queries/use-goals';

jest.mock('@/hooks/queries/use-goals');

const mockUseGoalsQuery = useGoalsQuery as jest.Mock;

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <TestQueryProvider>
      <TestSafeAreaProvider>{ui}</TestSafeAreaProvider>
    </TestQueryProvider>,
  );
}

describe('Goals screen', () => {
  beforeEach(() => {
    mockUseGoalsQuery.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    });
  });

  it('shows the empty state when there are no goals', async () => {
    await renderWithProviders(<GoalsScreen />);

    await waitFor(() => {
      expect(
        screen.getByText(
          'No goals yet. Set a weekly target when creating or editing an activity to start tracking your cadence.',
        ),
      ).toBeTruthy();
    });
  });

  it('lists goals with their current-week progress', async () => {
    mockUseGoalsQuery.mockReturnValue({
      data: [
        {
          goalId: 'g1',
          activityId: '1',
          activityName: 'Squats',
          targetPerWeek: 3,
          currentWeekCount: 2,
          categoryColor: null,
        },
        {
          goalId: 'g2',
          activityId: '2',
          activityName: 'Running',
          targetPerWeek: 4,
          currentWeekCount: 5,
          categoryColor: null,
        },
      ],
      isPending: false,
      isError: false,
    });

    await renderWithProviders(<GoalsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Squats')).toBeTruthy();
      expect(screen.getByText('2/3 this week')).toBeTruthy();
      expect(screen.getByText('Running')).toBeTruthy();
      expect(screen.getByText('5/4 this week')).toBeTruthy();
    });
  });

  it('shows a loading state', async () => {
    mockUseGoalsQuery.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    });

    await renderWithProviders(<GoalsScreen />);

    expect(screen.getByText('Loading goals...')).toBeTruthy();
  });
});
