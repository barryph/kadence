import React from 'react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import Toast from 'react-native-toast-message';
import { TestSafeAreaProvider } from '@/test/setup/test-safe-area';
import { TestQueryProvider } from '@/test/setup/test-query-client';
import HomeScreen from '@/app/(tabs)/index';
import { useActivitiesQuery } from '@/hooks/queries/use-activities';
import { useCategoriesQuery } from '@/hooks/queries/use-categories';
import { useTimelineQuery } from '@/hooks/queries/use-timeline';
import { useCompleteActivityMutation } from '@/hooks/mutations/use-activity-mutations';
import { testActivities } from '@/test/setup/fixtures/activities';
import { testCategories } from '@/test/setup/fixtures/categories';
import {
  resetActivityQueueCache,
  saveActivityQueue,
} from '@/lib/storage/activity-queue';
import { setMockAuth } from '@/test/setup/mock-auth';
import { ApiError } from '@/lib/query/unwrap';
import { YYYYMMDD } from '@/utils/date';

jest.mock('@/hooks/queries/use-activities');
jest.mock('@/hooks/queries/use-categories');
jest.mock('@/hooks/queries/use-timeline');
jest.mock('@/hooks/mutations/use-activity-mutations');
jest.mock('@/context/auth-context', () =>
  require('@/test/setup/mock-auth').createAuthContextMock(),
);

/**
 * Swipes are driven by native gestures and worklets that do not run under
 * jest. The row itself is covered elsewhere, so this stand-in exposes the two
 * swipe callbacks as pressable controls: that keeps the screen's completion
 * success/failure handling testable without simulating a pan.
 */
jest.mock('@/components/swipe-row', () => {
  const React = require('react');
  const { Pressable, Text, View } = require('react-native');

  return {
    __esModule: true,
    default: ({
      children,
      onSwipeLeft,
      onSwipeRight,
    }: {
      children?: React.ReactNode;
      onSwipeLeft: () => void;
      onSwipeRight: () => void;
    }) =>
      React.createElement(
        View,
        null,
        React.createElement(
          Pressable,
          { accessibilityLabel: 'swipe to complete', onPress: onSwipeRight },
          React.createElement(Text, null, 'complete'),
        ),
        React.createElement(
          Pressable,
          { accessibilityLabel: 'swipe to edit', onPress: onSwipeLeft },
          React.createElement(Text, null, 'edit'),
        ),
        children,
      ),
  };
});

const mockUseActivitiesQuery = useActivitiesQuery as jest.Mock;
const mockUseCategoriesQuery = useCategoriesQuery as jest.Mock;
const mockUseTimelineQuery = useTimelineQuery as jest.Mock;
const mockUseCompleteActivityMutation =
  useCompleteActivityMutation as jest.Mock;

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
    void saveActivityQueue('user-1', []);
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
    mockUseCompleteActivityMutation.mockReturnValue({
      mutateAsync: jest.fn().mockResolvedValue({}),
    });
    (Toast.show as jest.Mock).mockClear();
  });

  it('shows activity list after data loads', async () => {
    await renderHome();

    await waitFor(() => {
      expect(screen.getByText('Activities Center')).toBeTruthy();
      expect(screen.getByText('Morning Run')).toBeTruthy();
      expect(screen.getByText('Weekly Review')).toBeTruthy();
    });
  });

  it('shows Activities section header when items are available', async () => {
    await renderHome();

    await waitFor(() => {
      expect(screen.queryByText('Queued')).toBeNull();
      expect(screen.getByText('Pending')).toBeTruthy();
      expect(screen.queryByText('Completed')).toBeNull();
    });
  });

  it('shows Queued section header when activities are queued', async () => {
    await saveActivityQueue('user-1', [2]);

    await renderHome();

    await waitFor(() => {
      expect(screen.getByText('Queued')).toBeTruthy();
      expect(screen.getByText('Pending')).toBeTruthy();
      expect(screen.queryByText('Completed')).toBeNull();
    });
  });

  it('shows Completed section header when activities are done today', async () => {
    mockUseTimelineQuery.mockReturnValue({
      data: {
        '1': new Set([YYYYMMDD()]),
      },
      isPending: false,
      isError: false,
    });

    await renderHome();

    await waitFor(() => {
      expect(screen.getByText('Completed')).toBeTruthy();
      expect(screen.getByText('Pending')).toBeTruthy();
      expect(screen.queryByText('Queued')).toBeNull();
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

  it('renders nothing without crashing when the user is logged out', async () => {
    setMockAuth({ user: null, isAuthenticated: false });

    await renderHome();

    expect(screen.queryByText('Activities Center')).toBeNull();
  });

  it('shows an error screen when nothing could be loaded', async () => {
    mockUseActivitiesQuery.mockReturnValue({
      data: undefined,
      isPending: false,
      isError: true,
    });

    await renderHome();

    await waitFor(() => {
      expect(screen.getByText('Unable to load activities.')).toBeTruthy();
    });
  });

  it('keeps the cached list when a background refetch fails', async () => {
    // refetchOnWindowFocus and the date-keyed query rolling over at local
    // midnight both refetch without the user asking. A failure there must not
    // replace a populated screen with an error.
    mockUseActivitiesQuery.mockReturnValue({
      data: testActivities,
      isPending: false,
      isError: true,
    });

    await renderHome();

    await waitFor(() => {
      expect(screen.getByText('Activities Center')).toBeTruthy();
      expect(screen.getByText('Morning Run')).toBeTruthy();
    });
    expect(screen.queryByText('Unable to load activities.')).toBeNull();
  });

  it('reports a successful completion', async () => {
    const mutateAsync = jest.fn().mockResolvedValue({});
    mockUseCompleteActivityMutation.mockReturnValue({ mutateAsync });

    await renderHome();
    await waitFor(() =>
      expect(screen.getAllByText('Morning Run').length).toBeGreaterThan(0),
    );

    await fireEvent.press(screen.getAllByLabelText('swipe to complete')[0]);

    await waitFor(() => {
      expect(mutateAsync).toHaveBeenCalledWith({
        activityId: expect.any(Number),
        date: YYYYMMDD(),
      });
      expect(Toast.show).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' }),
      );
    });
  });

  it('surfaces a failed completion instead of failing silently', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    const mutateAsync = jest.fn().mockRejectedValue(
      new ApiError({
        code: 'GENERIC_ERROR',
        message: 'Something went wrong, please try again.',
      }),
    );
    mockUseCompleteActivityMutation.mockReturnValue({ mutateAsync });

    try {
      await renderHome();
      await waitFor(() =>
        expect(screen.getAllByText('Morning Run').length).toBeGreaterThan(0),
      );

      await fireEvent.press(screen.getAllByLabelText('swipe to complete')[0]);

      await waitFor(() => {
        expect(Toast.show).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'error',
            text1: 'Could not complete activity',
            text2: 'Something went wrong, please try again.',
          }),
        );
      });

      // The completion was never applied, so the activity is still pending and
      // the failure is visible rather than a phantom success.
      expect(screen.getByText('Pending')).toBeTruthy();
      expect(screen.queryByText('Completed')).toBeNull();
      expect(Toast.show).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'success' }),
      );
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
