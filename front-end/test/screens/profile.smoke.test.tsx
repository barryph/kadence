import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import { TestSafeAreaProvider } from '@/test/setup/test-safe-area';
import ProfileScreen from '@/app/(tabs)/profile';
import { testUser } from '@/test/setup/fixtures/users';
import { setMockAuth } from '@/test/setup/mock-auth';

jest.mock('@/context/auth-context', () =>
  require('@/test/setup/mock-auth').createAuthContextMock(),
);

describe('Profile screen smoke', () => {
  it('renders user email', async () => {
    setMockAuth({ user: testUser, isAuthenticated: true });

    await render(
      <TestSafeAreaProvider>
        <ProfileScreen />
      </TestSafeAreaProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Profile')).toBeTruthy();
      expect(screen.getByText(testUser.email)).toBeTruthy();
    });
  });
});
