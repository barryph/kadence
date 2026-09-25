import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { TestSafeAreaProvider } from '@/test/setup/test-safe-area';
import { TestQueryProvider } from '@/test/setup/test-query-client';
import GoalInsightsScreen from '@/app/(tabs)/goals/[activityId]';
import { useGoalStatsQuery } from '@/hooks/queries/use-goals';

jest.mock('@/hooks/queries/use-goals');

jest.mock('react-native-chart-kit/v2', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    LineChart: () => React.createElement(View),
    ProgressChart: () => React.createElement(View),
  };
});

const mockUseGoalStatsQuery = useGoalStatsQuery as jest.Mock;

const statsFixture = {
  goal: { id: 'g1', activityId: '1', targetPerWeek: 3 },
  activityName: 'Squats',
  currentWeekCount: 2,
  weeklyPerformance: [
    { weekStart: '2026-07-06', count: 2 },
    { weekStart: '2026-07-13', count: 3 },
    { weekStart: '2026-07-20', count: 5 },
  ],
  adherence: { applicable: 4, met: 2, percentage: 0.5 },
  heatmap: [
    { weekStart: '2026-07-06', count: 2 },
    { weekStart: '2026-07-13', count: 3 },
    { weekStart: '2026-07-20', count: 5 },
  ],
  firstCompletionDate: '2026-07-06',
};

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <TestQueryProvider>
      <TestSafeAreaProvider>{ui}</TestSafeAreaProvider>
    </TestQueryProvider>,
  );
}

describe('Goal insights screen', () => {
  beforeEach(() => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ activityId: '1' });
    mockUseGoalStatsQuery.mockReturnValue({
      data: statsFixture,
      isPending: false,
      isError: false,
    });
  });

  it('reports a missing goal instead of spinning when the route has no id', async () => {
    // The stats query is disabled without an id, so it never leaves `pending`;
    // rendering a loader here would spin forever.
    (useLocalSearchParams as jest.Mock).mockReturnValue({
      activityId: undefined,
    });
    mockUseGoalStatsQuery.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    });

    await renderWithProviders(<GoalInsightsScreen />);

    expect(screen.getByText('This goal could not be found.')).toBeTruthy();
    expect(screen.queryByText('Loading goal insights...')).toBeNull();
  });

  it('renders the target, current-week progress and historical stats', async () => {
    await renderWithProviders(<GoalInsightsScreen />);

    await waitFor(() => {
      expect(screen.getByText('Squats')).toBeTruthy();
      expect(screen.getByText('2/3 this week')).toBeTruthy();
      const performanceText = screen.getByText('Performance');
      expect(
        within(performanceText.parent!).getByText('Over the last 3 weeks'),
      ).toBeTruthy();
      expect(screen.getByText('50%')).toBeTruthy();
      const cadenceText = screen.getByText('Cadence');
      expect(
        within(cadenceText.parent!).getByText('Over the last 3 weeks'),
      ).toBeTruthy();
    });
  });

  it('shows the in-progress badge when the weekly target is not met', async () => {
    await renderWithProviders(<GoalInsightsScreen />);

    await waitFor(() => {
      expect(screen.getByText('IN PROGRESS')).toBeTruthy();
      expect(screen.queryByText('DONE')).toBeNull();
    });
  });

  it('shows the done badge once the weekly target is met', async () => {
    mockUseGoalStatsQuery.mockReturnValue({
      data: { ...statsFixture, currentWeekCount: 3 },
      isPending: false,
      isError: false,
    });

    await renderWithProviders(<GoalInsightsScreen />);

    await waitFor(() => {
      expect(screen.getByText('DONE')).toBeTruthy();
      expect(screen.queryByText('IN PROGRESS')).toBeNull();
    });
  });

  it('shows an empty message when there is no completion history', async () => {
    mockUseGoalStatsQuery.mockReturnValue({
      data: {
        ...statsFixture,
        currentWeekCount: 0,
        weeklyPerformance: [],
        adherence: { applicable: 0, met: 0, percentage: null },
        heatmap: [],
        firstCompletionDate: null,
      },
      isPending: false,
      isError: false,
    });

    await renderWithProviders(<GoalInsightsScreen />);

    await waitFor(() => {
      expect(screen.getByText('0/3 this week')).toBeTruthy();
      expect(screen.getByText('—')).toBeTruthy();
      expect(
        screen.getByText(
          'No completion history yet. Complete this activity to see weekly performance here.',
        ),
      ).toBeTruthy();
    });
  });

  it('shows a loading state', async () => {
    mockUseGoalStatsQuery.mockReturnValue({
      data: undefined,
      isPending: true,
      isError: false,
    });

    await renderWithProviders(<GoalInsightsScreen />);

    expect(screen.getByText('Loading goal insights...')).toBeTruthy();
  });
});
