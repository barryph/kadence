import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { TestSafeAreaProvider } from '@/test/setup/test-safe-area';
import { TestQueryProvider } from '@/test/setup/test-query-client';
import TimelineScreen from '@/app/(tabs)/timeline';
import { useActivitiesQuery } from '@/hooks/queries/use-activities';
import { useCategoriesQuery } from '@/hooks/queries/use-categories';
import { useTimelineQuery } from '@/hooks/queries/use-timeline';
import { testActivities } from '@/test/setup/fixtures/activities';
import { testCategories } from '@/test/setup/fixtures/categories';
import { testTimeline } from '@/test/setup/fixtures/timeline';
import { timelineToSet } from '@/lib/query/timeline-utils';

jest.mock('@/hooks/queries/use-activities');
jest.mock('@/hooks/queries/use-categories');
jest.mock('@/hooks/queries/use-timeline');
jest.mock('@/hooks/mutations/use-activity-mutations', () => ({
  useCompleteActivityMutation: () => ({ mutateAsync: jest.fn() }),
  useUndoActivityMutation: () => ({ mutateAsync: jest.fn() }),
}));

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

async function renderTimeline() {
  return renderWithProviders(<TimelineScreen />);
}

describe('Timeline screen', () => {
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
    mockUseTimelineQuery.mockReturnValue({
      data: timelineToSet(testTimeline),
      isPending: false,
      isFetching: false,
      isError: false,
    });
  });

  it('shows timeline grid after data loads', async () => {
    await renderTimeline();

    await waitFor(
      () => {
        expect(screen.getByText('RUN')).toBeTruthy();
        expect(screen.getByText('REV')).toBeTruthy();
      },
      { timeout: 3000 },
    );
  });

  it('shows empty state when no activities', async () => {
    mockUseActivitiesQuery.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    });
    mockUseTimelineQuery.mockReturnValue({
      data: timelineToSet({}),
      isPending: false,
      isFetching: false,
      isError: false,
    });

    await renderTimeline();

    await waitFor(() => {
      expect(screen.getByText('Add an activity to get started.')).toBeTruthy();
    });
  });
});
