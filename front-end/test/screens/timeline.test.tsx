import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { TestSafeAreaProvider } from '@/test/setup/test-safe-area';
import TimelineScreen from '@/app/(tabs)/timeline';
import { activitiesAPI } from '@/api/api.activity';
import { timelineAPI } from '@/api/api.timeline';
import { testActivities } from '@/test/setup/fixtures/activities';
import { testTimeline } from '@/test/setup/fixtures/timeline';

jest.mock('@/api/api.activity');
jest.mock('@/api/api.timeline');

const mockGetActivities = activitiesAPI.getAllByUser as jest.Mock;
const mockGetTimeline = timelineAPI.getTimeline as jest.Mock;

async function renderTimeline() {
  return render(
    <TestSafeAreaProvider>
      <TimelineScreen />
    </TestSafeAreaProvider>,
  );
}

describe('Timeline screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetActivities.mockResolvedValue({
      data: { activities: testActivities },
    });
    mockGetTimeline.mockResolvedValue({
      data: { timeline: testTimeline },
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
    mockGetActivities.mockResolvedValue({ data: { activities: [] } });
    mockGetTimeline.mockResolvedValue({ data: { timeline: {} } });

    await renderTimeline();

    await waitFor(() => {
      expect(screen.getByText('Add an activity to get started.')).toBeTruthy();
    });
  });
});
