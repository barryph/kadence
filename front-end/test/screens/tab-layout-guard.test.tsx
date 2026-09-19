import React from 'react';
import { Text } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { Tabs } from 'expo-router';
import TabLayout from '@/app/(tabs)/_layout';
import { mockReplace } from '@/test/setup/navigation-mocks';
import { resetMockAuth, setMockAuth } from '@/test/setup/mock-auth';

jest.mock('@/context/auth-context', () =>
  require('@/test/setup/mock-auth').createAuthContextMock(),
);

/**
 * The protected `(tabs)` group guards itself. This layout only renders when one
 * of its routes is current, so it can never misjudge a deep link that targets
 * another route, and it never renders the tabs for a signed-out user.
 */
describe('(tabs) auth guard', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    resetMockAuth();
    (Tabs as any).Screen = function TabsScreenSentinel() {
      return React.createElement(Text, null, 'tab-screen');
    };
  });

  it('sends a signed-out user to sign-in', async () => {
    setMockAuth({ isAuthenticated: false, isLoading: false, user: null });

    await render(<TabLayout />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('renders the tabs for a signed-in user', async () => {
    setMockAuth({ isAuthenticated: true, isLoading: false });

    const { getAllByText } = await render(<TabLayout />);

    await waitFor(() => {
      expect(getAllByText('tab-screen').length).toBeGreaterThan(0);
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
