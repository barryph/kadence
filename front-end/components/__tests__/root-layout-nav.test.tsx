import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { useSegments } from 'expo-router';
import { RootLayoutNav } from '@/components/root-layout-nav';
import { mockReplace } from '@/test/setup/navigation-mocks';
import { resetMockAuth, setMockAuth } from '@/test/setup/mock-auth';

jest.mock('@/context/auth-context', () =>
  require('@/test/setup/mock-auth').createAuthContextMock(),
);

describe('RootLayoutNav auth gate', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    resetMockAuth();
    (useSegments as jest.Mock).mockReturnValue([]);
  });

  it('redirects unauthenticated users to login', async () => {
    setMockAuth({ isAuthenticated: false, isLoading: false, user: null });
    (useSegments as jest.Mock).mockReturnValue(['(tabs)']);

    await render(<RootLayoutNav />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('does not redirect while loading', async () => {
    setMockAuth({ isAuthenticated: false, isLoading: true, user: null });
    (useSegments as jest.Mock).mockReturnValue(['(tabs)']);

    await render(<RootLayoutNav />);

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });

  it('redirects authenticated users away from auth screens', async () => {
    setMockAuth({ isAuthenticated: true, isLoading: false });
    (useSegments as jest.Mock).mockReturnValue(['login']);

    await render(<RootLayoutNav />);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('allows unauthenticated users on auth screens', async () => {
    setMockAuth({ isAuthenticated: false, isLoading: false, user: null });
    (useSegments as jest.Mock).mockReturnValue(['login']);

    await render(<RootLayoutNav />);

    await waitFor(() => {
      expect(mockReplace).not.toHaveBeenCalled();
    });
  });
});
