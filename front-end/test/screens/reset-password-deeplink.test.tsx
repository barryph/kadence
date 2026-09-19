/**
 * The password reset email opens `kadence://reset-password?token=...`.
 *
 * The cold-start case is Android-specific and is the one that regressed: there
 * the launch URL reaches expo-router asynchronously, so the restored route is
 * not reflected in `useSegments()` on the first pass. The old root gate read
 * that stale value, saw the default `/` with no segments, and redirected the
 * link to `/login` before the navigator had rehydrated. These tests drive the
 * real Android branch (a Promise from `Linking.getInitialURL()`, no
 * synchronous initial state) and assert the link survives.
 */
import { Linking, Platform } from 'react-native';
import { router as imperativeRouter } from 'expo-router';
import { act, renderRouter } from 'expo-router/testing-library';
import { resetMockAuth, setMockAuth } from '@/test/setup/mock-auth';

jest.unmock('expo-router');

jest.mock('@/context/auth-context', () =>
  require('@/test/setup/mock-auth').createAuthContextMock(),
);

// The repo-wide toast mock is a plain object, but the real root layout renders
// `<Toast />`. Give it a component for this file.
jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: () => null,
}));

function deepLinkFor(token: string): `/reset-password?token=${string}` {
  return `/reset-password?token=${token}`;
}

const realPlatformOS = Platform.OS;

/** Cold start on Android: the launch URL arrives as a Promise. */
async function launchFromNativeDeepLink(token: string) {
  (Platform as { OS: string }).OS = 'android';
  jest
    .spyOn(Linking, 'getInitialURL')
    .mockResolvedValue(`kadence://reset-password?token=${token}` as never);

  const router = renderRouter('./app', { initialUrl: null });
  const view = await router;
  await act(async () => {});

  return { router, view, token };
}

afterEach(() => {
  (Platform as { OS: string }).OS = realPlatformOS;
});

describe('reset-password cold-start deep link (Android)', () => {
  beforeEach(() => {
    resetMockAuth();
  });

  it('opens the form with the token when launched signed out', async () => {
    setMockAuth({ isAuthenticated: false, isLoading: false, user: null });

    const { router, view, token } = await launchFromNativeDeepLink('cold-out');

    expect(router.getPathname()).toBe('/reset-password');
    expect(router.getSearchParams().token).toBe(token);
    expect(view.getByText('New Password')).toBeTruthy();
    expect(view.queryByText('Reset token is missing')).toBeNull();
  });

  it('opens the form with the token when launched signed in', async () => {
    setMockAuth({ isAuthenticated: true, isLoading: false });

    const { router, view, token } = await launchFromNativeDeepLink('cold-in');

    expect(router.getPathname()).toBe('/reset-password');
    expect(router.getSearchParams().token).toBe(token);
    expect(view.getByText('New Password')).toBeTruthy();
  });

  it('still sends a plain signed-out launch to sign-in', async () => {
    setMockAuth({ isAuthenticated: false, isLoading: false, user: null });
    (Platform as { OS: string }).OS = 'android';

    const router = renderRouter('./app', { initialUrl: '/' });
    await router;
    await act(async () => {});

    expect(router.getPathname()).toBe('/login');
  });

  it('passes the token when the app is already open', async () => {
    setMockAuth({ isAuthenticated: true, isLoading: false });

    const router = renderRouter('./app', { initialUrl: '/' });
    const view = await router;
    const token = 'warm-token';

    // What expo-router's Linking subscription does when a URL arrives while the
    // app is running.
    await act(async () => {
      imperativeRouter.navigate(deepLinkFor(token));
    });

    expect(router.getPathname()).toBe('/reset-password');
    expect(router.getSearchParams().token).toBe(token);
    expect(view.getByText('New Password')).toBeTruthy();
  });
});
