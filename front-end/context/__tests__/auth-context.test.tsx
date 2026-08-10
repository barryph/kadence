import React from 'react';
import { Text } from 'react-native';
import { render, screen, waitFor, act } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '@/context/auth-context';
import { usersAPI } from '@/api/api.users';
import { authAPI } from '@/api/api.auth';
import { testUser } from '@/test/setup/fixtures/users';
import { SocialAuthError } from '@/lib/auth/errors';

jest.mock('@/api/api.users');
jest.mock('@/api/api.auth');
jest.mock('@/lib/auth/google');
jest.mock('@/lib/auth/apple');

const mockGetCurrentUser = usersAPI.getCurrentUser as jest.Mock;
const mockLogin = authAPI.login as jest.Mock;
const mockLogout = authAPI.logout as jest.Mock;
const mockRegister = authAPI.register as jest.Mock;
const mockGoogleLogin = authAPI.googleLogin as jest.Mock;
const mockAppleLogin = authAPI.appleLogin as jest.Mock;
const googleSignInClient = require('@/lib/auth/google')
  .signInWithGoogle as jest.Mock;
const appleSignInClient = require('@/lib/auth/apple').signInWithApple as jest.Mock;

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

describe('AuthProvider social sign-in', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetCurrentUser.mockResolvedValue({ data: undefined });
  });

  async function renderWithTrigger() {
    let authRef: ReturnType<typeof useAuth> | undefined;
    function Trigger() {
      authRef = useAuth();
      return (
        <Text>
          {authRef.isAuthenticated ? authRef.user?.email : 'logged out'}
        </Text>
      );
    }

    await render(
      <AuthProvider>
        <Trigger />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByText('logged out')).toBeTruthy();
    });
    return authRef!;
  }

  it('signs in with Google and updates auth state', async () => {
    googleSignInClient.mockResolvedValue({ idToken: 'google-token' });
    mockGoogleLogin.mockResolvedValue({ data: { user: testUser } });

    const auth = await renderWithTrigger();
    const response = await act(() => auth.signInWithGoogle());

    expect(mockGoogleLogin).toHaveBeenCalledWith({ idToken: 'google-token' });
    expect(response).toEqual({ data: { user: testUser } });
    expect(await screen.findByText(testUser.email)).toBeTruthy();
  });

  it('signs in with Apple and updates auth state', async () => {
    appleSignInClient.mockResolvedValue({
      idToken: 'apple-token',
      nonce: 'raw-nonce',
    });
    mockAppleLogin.mockResolvedValue({ data: { user: testUser } });

    const auth = await renderWithTrigger();
    const response = await act(() => auth.signInWithApple());

    expect(mockAppleLogin).toHaveBeenCalledWith({
      idToken: 'apple-token',
      nonce: 'raw-nonce',
    });
    expect(response).toEqual({ data: { user: testUser } });
    expect(await screen.findByText(testUser.email)).toBeTruthy();
  });

  it('maps provider cancellation to a non-error result', async () => {
    googleSignInClient.mockRejectedValue(
      new SocialAuthError('cancelled', 'Google sign-in was cancelled'),
    );

    const auth = await renderWithTrigger();
    const response = await act(() => auth.signInWithGoogle());

    expect(mockGoogleLogin).not.toHaveBeenCalled();
    expect(response.error?.code).toBe('SOCIAL_AUTH_CANCELLED');
    expect(screen.getByText('logged out')).toBeTruthy();
  });

  it('surfaces friendly messages for provider failures', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    googleSignInClient.mockRejectedValue(
      new Error('native failure'),
    );

    const auth = await renderWithTrigger();
    const response = await act(() => auth.signInWithGoogle());

    expect(mockGoogleLogin).not.toHaveBeenCalled();
    expect(response.error?.code).toBe('SOCIAL_AUTH_FAILED');
    expect(response.error?.message).toBe('Sign in failed. Please try again.');
    consoleSpy.mockRestore();
  });

  it('propagates backend errors without changing auth state', async () => {
    googleSignInClient.mockResolvedValue({ idToken: 'google-token' });
    mockGoogleLogin.mockResolvedValue({
      error: {
        code: 'OAUTH_AUTH_FAILED',
        message: 'Authentication failed',
      },
    });

    const auth = await renderWithTrigger();
    const response = await act(() => auth.signInWithGoogle());

    expect(response.error?.code).toBe('OAUTH_AUTH_FAILED');
    expect(screen.getByText('logged out')).toBeTruthy();
  });

  it('prevents duplicate simultaneous sign-in requests', async () => {
    googleSignInClient.mockResolvedValue({ idToken: 'google-token' });
    mockGoogleLogin.mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ data: { user: testUser } }), 20),
        ),
    );

    const auth = await renderWithTrigger();

    const firstRequest = auth.signInWithGoogle();
    const secondRequest = auth.signInWithGoogle();

    await act(async () => {
      await Promise.all([firstRequest, secondRequest]);
    });

    const first = await firstRequest;
    const second = await secondRequest;
    expect(second.error?.message).toBe('A sign-in is already in progress.');
    expect(first.error).toBeUndefined();
    expect(mockGoogleLogin).toHaveBeenCalledTimes(1);
  });
});
