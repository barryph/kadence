import { Stack } from 'expo-router';
import { useAuth } from '@/context/auth-context';
import ErrorScreen from '@/components/base/error-screen';
import { useScreenTracking } from '@/lib/analytics/use-screen-tracking';
import { useAnalyticsIdentity } from '@/lib/analytics/use-analytics-identity';

/**
 * Root navigation stack.
 *
 * Auth gating belongs to the routes themselves: the `(tabs)` group sends
 * signed-out users to `/login`, and the sign-in screens send signed-in users
 * home. `reset-password` stays unguarded so the emailed link works signed in or
 * out.
 *
 * This layout deliberately makes no routing decision from `useSegments()`. It
 * used to redirect from here, which broke cold-start deep links on Android:
 * the launch URL is applied asynchronously there, so on the first pass
 * `useSegments()` still reported the default `/` with no segments while the
 * session was restoring, and `kadence://reset-password?token=...` was sent to
 * `/login` before the navigator had rehydrated the route. A guard on the route
 * itself cannot make that mistake, because a screen that is not on the current
 * route never renders.
 */
export function RootLayoutNav() {
  const { isAuthenticated, isConnectionError, retrySessionRestore } = useAuth();

  // Analytics: log screen views on route changes and keep the user id in
  // sync with the authenticated session (opaque id only, never an email).
  useScreenTracking();
  useAnalyticsIdentity();

  // The server could not be reached to restore the session. Redirecting to
  // sign-in would be wrong: signing in needs the same server, so the user
  // would land on a form that cannot succeed. Stay put and offer a retry.
  if (isConnectionError && !isAuthenticated) {
    return (
      <ErrorScreen
        message="Unable to reach Kadence. Check your connection and try again."
        onRetry={retrySessionRestore}
      />
    );
  }

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
