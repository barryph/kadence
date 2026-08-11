import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  userEvent,
} from '@testing-library/react-native';
import { Platform } from 'react-native';
import { TestSafeAreaProvider } from '@/test/setup/test-safe-area';
import LoginScreen from '@/app/login';
import { ErrorCode } from '@/api/api.types';
import { testUser } from '@/test/setup/fixtures/users';
import { mockReplace } from '@/test/setup/navigation-mocks';
import { getMockAuth, setMockAuth } from '@/test/setup/mock-auth';

jest.mock('@/context/auth-context', () =>
  require('@/test/setup/mock-auth').createAuthContextMock(),
);

async function renderLogin() {
  const view = await render(
    <TestSafeAreaProvider>
      <LoginScreen />
    </TestSafeAreaProvider>,
  );
  await screen.findByText('Login!');
  return view;
}

describe('LoginScreen', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    setMockAuth({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });
  });

  it('renders the login form', async () => {
    await renderLogin();

    expect(screen.getByPlaceholderText('Email')).toBeTruthy();
    expect(screen.getByPlaceholderText('Password')).toBeTruthy();
    expect(screen.getByText('Enter')).toBeTruthy();
  });

  it('calls login and navigates on success', async () => {
    const auth = setMockAuth({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: jest.fn().mockResolvedValue({ data: { user: testUser } }),
    });

    await renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.press(screen.getByText('Enter'));

    await waitFor(() => {
      expect(auth.login).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
      );
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('shows validation errors for empty fields', async () => {
    await renderLogin();

    await fireEvent.press(screen.getByText('Enter'));

    expect(
      await screen.findByText('Please enter a valid email address'),
    ).toBeTruthy();
    expect(await screen.findByText('Password is required')).toBeTruthy();
    expect(getMockAuth().login).not.toHaveBeenCalled();
  });

  it('shows API error message on login failure', async () => {
    const auth = setMockAuth({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      login: jest.fn().mockResolvedValue({
        error: {
          code: ErrorCode.INVALID_CREDENTIALS,
          message: 'Invalid email or password, please try again.',
        },
      }),
    });

    await renderLogin();
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'wrong');
    await user.press(screen.getByText('Enter'));

    expect(
      await screen.findByText('Invalid email or password, please try again.'),
    ).toBeTruthy();
    expect(auth.login).toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});

describe('LoginScreen social sign-in', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    mockReplace.mockClear();
    setMockAuth({
      isAuthenticated: false,
      isLoading: false,
      user: null,
    });
  });

  it('renders the Google button and the Apple button on iOS', async () => {
    await render(
      <TestSafeAreaProvider>
        <LoginScreen />
      </TestSafeAreaProvider>,
    );
    await screen.findByText('Login!');

    expect(screen.getByTestId('google-signin-button')).toBeTruthy();
    expect(screen.getByTestId('apple-signin-button')).toBeTruthy();
  });

  it('does not render the Apple button on Android', async () => {
    jest.replaceProperty(Platform, 'OS', 'android');

    await render(
      <TestSafeAreaProvider>
        <LoginScreen />
      </TestSafeAreaProvider>,
    );
    await screen.findByText('Login!');

    expect(screen.getByTestId('google-signin-button')).toBeTruthy();
    expect(screen.queryByTestId('apple-signin-button')).toBeNull();
  });

  it('signs in with Google and navigates on success', async () => {
    const auth = setMockAuth({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      signInWithGoogle: jest
        .fn()
        .mockResolvedValue({ data: { user: testUser } }),
    });

    await renderLogin();
    const user = userEvent.setup();

    await user.press(screen.getByTestId('google-signin-button'));

    await waitFor(() => {
      expect(auth.signInWithGoogle).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('signs in with Apple and navigates on success', async () => {
    const auth = setMockAuth({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      signInWithApple: jest
        .fn()
        .mockResolvedValue({ data: { user: testUser } }),
    });

    await renderLogin();
    const user = userEvent.setup();

    await user.press(screen.getByTestId('apple-signin-button'));

    await waitFor(() => {
      expect(auth.signInWithApple).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/');
    });
  });

  it('does not show an error when sign-in is cancelled', async () => {
    setMockAuth({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      signInWithGoogle: jest.fn().mockResolvedValue({
        error: {
          code: ErrorCode.SOCIAL_AUTH_CANCELLED,
          message: 'Sign in was cancelled.',
        },
      }),
    });

    await renderLogin();
    const user = userEvent.setup();

    await user.press(screen.getByTestId('google-signin-button'));

    await waitFor(() => {
      expect(screen.queryByText('Sign in was cancelled.')).toBeNull();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('shows a friendly message when provider sign-in fails', async () => {
    setMockAuth({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      signInWithGoogle: jest.fn().mockResolvedValue({
        error: {
          code: ErrorCode.SOCIAL_AUTH_FAILED,
          message: 'Sign in failed. Please try again.',
        },
      }),
    });

    await renderLogin();
    const user = userEvent.setup();

    await user.press(screen.getByTestId('google-signin-button'));

    expect(
      await screen.findByText('Sign in failed. Please try again.'),
    ).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('shows a friendly message on network failure', async () => {
    setMockAuth({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      signInWithApple: jest.fn().mockResolvedValue({
        error: {
          code: ErrorCode.NETWORK_ERROR,
          message: 'Network error. Please check your connection.',
        },
      }),
    });

    await renderLogin();
    const user = userEvent.setup();

    await user.press(screen.getByTestId('apple-signin-button'));

    expect(
      await screen.findByText('Network error. Please check your connection.'),
    ).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
