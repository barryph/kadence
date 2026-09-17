import React from 'react';
import { act, render, screen, waitFor } from '@testing-library/react-native';
import NetInfo from '@react-native-community/netinfo';

import OfflineBanner from '@/components/base/offline-banner';

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(),
}));

const mockAddEventListener = NetInfo.addEventListener as jest.Mock;

/** Push a connectivity state through the listener the banner registered. */
function emitConnectivity(state: {
  isConnected: boolean;
  isInternetReachable: boolean | null;
}) {
  const listener = mockAddEventListener.mock.calls.at(-1)?.[0];
  listener?.(state);
}

describe('OfflineBanner', () => {
  beforeEach(() => {
    mockAddEventListener.mockReset();
    mockAddEventListener.mockReturnValue(jest.fn());
  });

  it('renders nothing while the device is online', async () => {
    await render(<OfflineBanner />);

    await act(async () => {
      emitConnectivity({ isConnected: true, isInternetReachable: true });
    });

    expect(screen.queryByText(/offline/i)).toBeNull();
  });

  it('says changes cannot be saved once the device is offline', async () => {
    await render(<OfflineBanner />);

    await act(async () => {
      emitConnectivity({ isConnected: false, isInternetReachable: false });
    });

    await waitFor(() => {
      expect(screen.getByText(/You're offline/i)).toBeTruthy();
    });
  });

  it('treats a captive portal (connected but unreachable) as offline', async () => {
    await render(<OfflineBanner />);

    await act(async () => {
      emitConnectivity({ isConnected: true, isInternetReachable: false });
    });

    await waitFor(() => {
      expect(screen.getByText(/You're offline/i)).toBeTruthy();
    });
  });
});
