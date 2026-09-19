import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import { TestSafeAreaProvider } from '@/test/setup/test-safe-area';
import ResetPasswordScreen from '@/app/reset-password';
import { ErrorCode } from '@/api/api.types';
import { mockReplace } from '@/test/setup/navigation-mocks';

jest.mock('@/api/api.auth', () => ({
  authAPI: { resetPassword: jest.fn() },
}));

const { authAPI } = require('@/api/api.auth') as {
  authAPI: { resetPassword: jest.Mock };
};

const TOKEN = '7293dc00a37aa684ca741b0c0fa0662581f5c993';

/** Renders the screen as expo-router would, with the deep-link query applied. */
async function renderScreen(token?: string) {
  (useLocalSearchParams as jest.Mock).mockReturnValue(token ? { token } : {});

  await render(
    <TestSafeAreaProvider>
      <ResetPasswordScreen />
    </TestSafeAreaProvider>,
  );
}

async function submitNewPassword() {
  const user = userEvent.setup();
  await user.type(screen.getByPlaceholderText('New Password'), 'newpassword');
  await user.press(screen.getByRole('button', { name: 'Reset Password' }));
}

describe('ResetPasswordScreen', () => {
  beforeEach(() => {
    mockReplace.mockClear();
    authAPI.resetPassword.mockReset();
  });

  it('submits the token from the deep link with the new password', async () => {
    authAPI.resetPassword.mockResolvedValue({ data: { message: 'ok' } });
    await renderScreen(TOKEN);

    await submitNewPassword();

    await waitFor(() => {
      expect(authAPI.resetPassword).toHaveBeenCalledWith({
        token: TOKEN,
        password: 'newpassword',
      });
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('surfaces an invalid or expired token instead of navigating', async () => {
    authAPI.resetPassword.mockResolvedValue({
      error: { code: ErrorCode.INVALID_RESET_TOKEN, message: 'invalid' },
    });
    await renderScreen(TOKEN);

    await submitNewPassword();

    expect(
      await screen.findByText('Reset token is invalid or expired'),
    ).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  it('explains that the link is incomplete when it has no token', async () => {
    await renderScreen();

    expect(screen.getByText('Reset token is missing')).toBeTruthy();
    expect(screen.queryByPlaceholderText('New Password')).toBeNull();
    expect(authAPI.resetPassword).not.toHaveBeenCalled();
  });
});
