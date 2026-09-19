import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { TestSafeAreaProvider } from '@/test/setup/test-safe-area';
import LoginScreen from '@/app/login';
import RegisterScreen from '@/app/register';
import ForgotPasswordScreen from '@/app/forgot-password';
import { mockReplace } from '@/test/setup/navigation-mocks';
import { resetMockAuth, setMockAuth } from '@/test/setup/mock-auth';

jest.mock('@/context/auth-context', () =>
  require('@/test/setup/mock-auth').createAuthContextMock(),
);

/**
 * Each sign-in screen guards itself. The root layout used to redirect
 * authenticated users away from these screens, which required reading the
 * current route from `useSegments()` in the root layout; on Android that value
 * is not rehydrated yet on a cold start, which is how deep links were lost.
 */
const guardedScreens: [string, React.ComponentType][] = [
  ['login', LoginScreen],
  ['register', RegisterScreen],
  ['forgot-password', ForgotPasswordScreen],
];

describe('sign-in screen guards', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    resetMockAuth();
  });

  it.each(guardedScreens)(
    'sends a signed-in user home from %s',
    async (_name, Screen) => {
      setMockAuth({ isAuthenticated: true, isLoading: false });

      await render(
        <TestSafeAreaProvider>
          <Screen />
        </TestSafeAreaProvider>,
      );

      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/');
      });
    },
  );
});
