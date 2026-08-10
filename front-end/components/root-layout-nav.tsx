import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuth } from '@/context/auth-context';

/**
 * Root navigation stack + session gate.
 * Redirects unauthenticated users to auth screens and authenticated users away from them.
 */
export function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  const inAuthGroup =
    segments[0] === 'login' ||
    segments[0] === 'register' ||
    segments[0] === 'forgot-password' ||
    segments[0] === 'reset-password';

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    } else {
      setIsReady(true);
    }
  }, [isAuthenticated, isLoading, segments, router, inAuthGroup]);

  // Never render protected screens while the session is invalid. Unmount them
  // synchronously instead of waiting for the async redirect, so no
  // user-dependent hook can run against a logged-out user.
  if (!isReady || (!isAuthenticated && !inAuthGroup)) return null;

  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="modal"
        options={{ presentation: 'modal', title: 'Modal' }}
      />
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="register" options={{ headerShown: false }} />
      <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
      <Stack.Screen name="reset-password" options={{ headerShown: false }} />
    </Stack>
  );
}
