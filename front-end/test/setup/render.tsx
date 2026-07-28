import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react-native';
import { TestSafeAreaProvider } from './test-safe-area';
import {
  setMockAuth,
  type MockAuthContextValue,
} from './mock-auth';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  auth?: Partial<MockAuthContextValue>;
}

/**
 * Render with SafeArea metrics and optional auth overrides.
 * Requires the test file to mock `@/context/auth-context` via createAuthContextMock().
 */
export async function renderWithProviders(
  ui: ReactElement,
  { auth, ...options }: CustomRenderOptions = {},
) {
  const authValue = setMockAuth(auth);

  const result = await render(ui, {
    wrapper: ({ children }) => (
      <TestSafeAreaProvider>{children}</TestSafeAreaProvider>
    ),
    ...options,
  });

  return {
    auth: authValue,
    ...result,
  };
}

export * from '@testing-library/react-native';
