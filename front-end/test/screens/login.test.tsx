import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  userEvent,
} from '@testing-library/react-native';
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
