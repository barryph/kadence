import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import ErrorScreen from '@/components/base/error-screen';
import { useScreenTracking } from '@/lib/analytics/use-screen-tracking';
import { useAnalyticsIdentity } from '@/lib/analytics/use-analytics-identity';

/**
 * Root navigation stack + session gate.
 * Redirects unauthenticated users to auth screens and authenticated users away from them.
 */
export function RootLayoutNav() {
  const { isAuthenticated, isLoading, isConnectionError, retrySessionRestore } =
    useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  // Analytics: log screen views on route changes and keep the user id in
  // sync with the authenticated session (opaque id only, never an email).
  useScreenTracking();
  useAnalyticsIdentity();

  const isAuthScreen =
    segments[0] === 'login' ||
    segments[0] === 'register' ||
    segments[0] === 'forgot-password';

  // `reset-password` is deliberately outside the auth group. It is reached from
  // the emailed `kadence://reset-password?token=...` link, and bouncing a
  // signed-in user to home would discard the single-use token without ever
  // showing the form.
  const isResetPassword = segments[0] === 'reset-password';

  useEffect(() => {
    if (isLoading) return;

    // The server could not be reached to restore the session. Redirecting to
    // sign-in would be wrong: signing in needs the same server, so the user
    // would land on a form that cannot succeed. Stay put and offer a retry.
    if (isConnectionError && !isAuthenticated) return;

    if (!isAuthenticated && !isAuthScreen && !isResetPassword) {
      router.replace('/login');
    } else if (isAuthenticated && isAuthScreen) {
      router.replace('/');
    } else {
      setIsReady(true);
    }
  }, [
    isAuthenticated,
    isLoading,
    isConnectionError,
    segments,
    router,
    isAuthScreen,
    isResetPassword,
  ]);

  if (isConnectionError && !isAuthenticated) {
    return (
      <ErrorScreen
        message="Unable to reach Kadence. Check your connection and try again."
        onRetry={retrySessionRestore}
      />
    );
  }

  // Keep the navigator mounted while the session-gate effect redirects: the
  // `replace` action must reach a navigator that still registers the target
  // route, or it is dropped as unhandled. Protected screens are safe to render
  // briefly against a logged-out user because they return null when `user` is
  // absent, so no user-dependent hook runs.
  if (!isReady) return null;

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
    </Stack>
  );
}
