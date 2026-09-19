import React from 'react';
import { Text } from 'react-native';
import { render, screen, waitFor } from '@testing-library/react-native';

import { useActivityQueue } from '@/hooks/use-activity-queue';

jest.mock('@/lib/storage/activity-queue', () => ({
  getCachedActivityQueue: jest.fn(),
  loadActivityQueue: jest.fn(),
  saveActivityQueue: jest.fn().mockResolvedValue(undefined),
}));

const storage = jest.requireMock('@/lib/storage/activity-queue') as {
  getCachedActivityQueue: jest.Mock;
  loadActivityQueue: jest.Mock;
};

function Probe({ userId }: { userId: string }) {
  const { isHydrated, queuedIds } = useActivityQueue(userId);
  return (
    <Text>{`${isHydrated ? 'hydrated' : 'loading'}:${queuedIds.size}`}</Text>
  );
}

describe('useActivityQueue', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    storage.getCachedActivityQueue.mockReturnValue(undefined);
  });

  it('hydrates the stored selection', async () => {
    storage.loadActivityQueue.mockResolvedValue([2, 5]);

    await render(<Probe userId="user-1" />);

    await waitFor(() => {
      expect(screen.getByText('hydrated:2')).toBeTruthy();
    });
  });

  it('still hydrates when the stored selection cannot be read', async () => {
    // Unreadable storage must not leave the dashboard on an endless loader:
    // the screen can render the server's activities with an empty queue.
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    storage.loadActivityQueue.mockRejectedValue(
      new Error('storage unavailable'),
    );

    try {
      await render(<Probe userId="user-1" />);

      await waitFor(() => {
        expect(screen.getByText('hydrated:0')).toBeTruthy();
      });
    } finally {
      consoleSpy.mockRestore();
    }
  });
});
