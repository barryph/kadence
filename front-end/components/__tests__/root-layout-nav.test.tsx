import React from 'react';
import { Text } from 'react-native';
import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';
import { Stack } from 'expo-router';
import { RootLayoutNav } from '@/components/root-layout-nav';
import { mockReplace } from '@/test/setup/navigation-mocks';
import { resetMockAuth, setMockAuth } from '@/test/setup/mock-auth';

jest.mock('@/context/auth-context', () =>
  require('@/test/setup/mock-auth').createAuthContextMock(),
);

/**
 * The root layout owns the stack and the "session could not be restored" case
 * only. Auth gating lives on the routes: `(tabs)` sends signed-out users to
 * sign-in, and the sign-in screens send signed-in users home. A root gate that
 * read `useSegments()` broke cold-start deep links on Android, so these tests
 * pin that the layout never redirects on its own.
 */
describe('RootLayoutNav', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    resetMockAuth();
    // Emit a sentinel from Stack.Screen so tests can observe whether the
    // navigator is actually mounted (the default mock renders nothing).
    (Stack as any).Screen = function StackScreenSentinel() {
      return React.createElement(Text, null, 'stack-screen');
    };
  });

  it('mounts the navigator for a signed-out user', async () => {
    setMockAuth({ isAuthenticated: false, isLoading: false, user: null });

    const { getAllByText } = await render(<RootLayoutNav />);

    await waitFor(() => {
      expect(getAllByText('stack-screen').length).toBeGreaterThan(0);
    });
  });

  it('mounts the navigator for a signed-in user', async () => {
    setMockAuth({ isAuthenticated: true, isLoading: false });

    const { getAllByText } = await render(<RootLayoutNav />);

    await waitFor(() => {
      expect(getAllByText('stack-screen').length).toBeGreaterThan(0);
    });
  });

  it('never redirects on its own; the routes own their guards', async () => {
    setMockAuth({ isAuthenticated: false, isLoading: false, user: null });

    await render(<RootLayoutNav />);

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  it('offers a retry instead of the login screen when the session cannot be restored', async () => {
    // Offline boot: the server was unreachable, so we do not know whether the
    // user is signed in. Sending them to login would be wrong - signing in
    // needs the same server - so the layout shows a retryable error.
    const retrySessionRestore = jest.fn();
    setMockAuth({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      isConnectionError: true,
      retrySessionRestore,
    });

    await render(<RootLayoutNav />);

    const retry = await screen.findByText('Try again');
    await fireEvent.press(retry);
    expect(retrySessionRestore).toHaveBeenCalledTimes(1);
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
