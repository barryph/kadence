import React from 'react';
import { Text } from 'react-native';
import { render, screen, waitFor, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { usersAPI } from '@/api/api.users';
import { authAPI } from '@/api/api.auth';
import { testUser } from '@/test/setup/fixtures/users';

jest.mock('@/api/api.users');
jest.mock('@/api/api.auth');

const mockGetCurrentUser = usersAPI.getCurrentUser as jest.Mock;
const mockLogin = authAPI.login as jest.Mock;
const mockLogout = authAPI.logout as jest.Mock;
const mockRegister = authAPI.register as jest.Mock;

function AuthConsumer() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <Text>Loading...</Text>;
  if (!isAuthenticated) return <Text>Not authenticated</Text>;
  return <Text>{user?.email}</Text>;
}

describe('AuthProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loading state while fetching current user', async () => {
    mockGetCurrentUser.mockReturnValue(new Promise(() => {}));

    await render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('sets authenticated state when current user is returned', async () => {
    mockGetCurrentUser.mockResolvedValue({ data: { user: testUser } });

    await render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(testUser.email)).toBeTruthy();
    });
  });

  it('remains unauthenticated when current user fetch fails', async () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockGetCurrentUser.mockRejectedValue(new Error('Unauthorized'));

    await render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('Not authenticated')).toBeTruthy();
    });

    consoleSpy.mockRestore();
  });

  it('login updates auth state on success', async () => {
    mockGetCurrentUser.mockResolvedValue({ data: undefined });
    mockLogin.mockResolvedValue({ data: { user: testUser } });

    let authRef: ReturnType<typeof useAuth> | undefined;
    function LoginTrigger() {
      authRef = useAuth();
      return (
        <Text>
          {authRef.isAuthenticated ? authRef.user?.email : 'logged out'}
        </Text>
      );
    }

    await render(
      <AuthProvider>
        <LoginTrigger />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('logged out')).toBeTruthy();
    });

    await act(async () => {
      await authRef!.login('test@example.com', 'password123');
    });

    expect(await screen.findByText(testUser.email)).toBeTruthy();
  });

  it('logout clears auth state on success', async () => {
    mockGetCurrentUser.mockResolvedValue({ data: { user: testUser } });
    mockLogout.mockResolvedValue({ data: undefined });

    let authRef: ReturnType<typeof useAuth> | undefined;
    function LogoutTrigger() {
      authRef = useAuth();
      return (
        <Text>
          {authRef.isAuthenticated ? authRef.user?.email : 'logged out'}
        </Text>
      );
    }

    await render(
      <AuthProvider>
        <LogoutTrigger />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText(testUser.email)).toBeTruthy();
    });

    await act(async () => {
      await authRef!.logout();
    });

    expect(await screen.findByText('logged out')).toBeTruthy();
  });

  it('register updates auth state on success', async () => {
    mockGetCurrentUser.mockResolvedValue({ data: undefined });
    mockRegister.mockResolvedValue({ data: { user: testUser } });

    let authRef: ReturnType<typeof useAuth> | undefined;
    function RegisterTrigger() {
      authRef = useAuth();
      return (
        <Text>
          {authRef.isAuthenticated ? authRef.user?.email : 'logged out'}
        </Text>
      );
    }

    await render(
      <AuthProvider>
        <RegisterTrigger />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('logged out')).toBeTruthy();
    });

    await act(async () => {
      await authRef!.register(
        'test@example.com',
        'password123',
        'password123',
      );
    });

    expect(await screen.findByText(testUser.email)).toBeTruthy();
  });
});
