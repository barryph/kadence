import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { ErrorBoundaryProps, SplashScreen } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet';
import { useEffect } from 'react';
import { useFonts } from '@expo-google-fonts/ibm-plex-mono';
import Toast, { type ToastConfig } from 'react-native-toast-message';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider } from '@/context/auth-context';
import { QueryProvider } from '@/lib/query/provider';
import { RootLayoutNav } from '@/components/root-layout-nav';
import Background from '@/components/backgrounds/background';
import { ThemedText } from '@/components/base/themed-text';
import Button from '@/components/base/button';
import { Colors, Shadows, Spacing } from '@/constants/theme';
import { MONO_FONTS } from '@/constants/typography';
import Ionicons from '@expo/vector-icons/Ionicons';
import Constants from 'expo-constants';
import {
  setCrashlyticsCollectionEnabled,
  setCrashlyticsCustomKey,
} from '@/lib/crashlytics/crashlytics';

// This prevents SplashScreen from auto hiding while the fonts are in loading state
SplashScreen.preventAutoHideAsync();

/**
 * Root error boundary.
 *
 * expo-router only installs a boundary for a route that exports one, so
 * without this any render-time throw left the user on a blank screen with no
 * way to recover. It sits above the app's providers, so it deliberately uses
 * only context-free components.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  return (
    <View style={styles.errorContainer}>
      <Background />
      <View style={styles.errorContent}>
        <Ionicons
          name="alert-circle-outline"
          size={36}
          color={Colors.iconAccent}
        />
        <ThemedText variant="subheading" style={styles.errorTitle}>
          Something went wrong
        </ThemedText>
        <ThemedText variant="bodySmall" style={styles.errorMessage}>
          {error.message}
        </ThemedText>
        <Button onPress={retry} style={styles.errorRetry}>
          Try again
        </Button>
      </View>
    </View>
  );
}

function FontsProvider({ children }: { children: React.ReactNode }) {
  const [loaded, error] = useFonts(MONO_FONTS);

  useEffect(() => {
    if (error) {
      console.error('Failed to load fonts:', error);
    }
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Shows overlay while fonts are loading, but also renders children in the
  // background to avoid showing text in the wrong fonts without delaying load times of children
  return (
    <>
      {!loaded && (
        <View style={[StyleSheet.absoluteFillObject, { zIndex: 9999 }]}>
          <Background />
        </View>
      )}
      {children}
    </>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  /**
   * Initialise Crashlytics once at startup. Collection is enabled for
   * preview/production builds only, so local dev-client crashes don't pollute
   * real production data. (RNFirebase auto-installs the global JS error and
   * unhandled-rejection handlers — no custom handler needed.) A custom key
   * gives debugging context on every report.
   */
  useEffect(() => {
    const variant: string =
      (Constants.expoConfig?.extra as { appVariant?: string } | undefined)
        ?.appVariant ?? 'production';
    const crashlyticsEnabled = variant !== 'development';

    setCrashlyticsCollectionEnabled(crashlyticsEnabled);
    setCrashlyticsCustomKey('app_variant', variant);
  }, []);

  const toastConfig: ToastConfig = {
    // success: (props) => <BaseToast {...props} style={{ background: 'red' }} />,
    success: ({ text1 }) => (
      <View style={styles.toastContainer}>
        <Ionicons
          name="checkmark-circle-sharp"
          size={24}
          color={Colors.success}
        />
        <ThemedText variant="bodySmall" weight="700">
          {text1}
        </ThemedText>
      </View>
    ),
  };

  return (
    <GestureHandlerRootView>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <BottomSheetModalProvider>
          <FontsProvider>
            <QueryProvider>
              <AuthProvider>
                <RootLayoutNav />
                <Toast config={toastConfig} />
              </AuthProvider>
            </QueryProvider>
          </FontsProvider>
          {/* The app is dark-only (see userInterfaceStyle in app.json), so the
              bar style is pinned rather than derived from the device theme. */}
          <StatusBar style="light" />
        </BottomSheetModalProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    paddingVertical: 18,
    paddingHorizontal: 18,
    minWidth: '95%',
    borderRadius: 6,
    overflow: 'hidden',
    ...Shadows.toast,
    backgroundColor: Colors.toast,
    display: 'flex',
    alignContent: 'center',
    alignItems: 'center',
    gap: 11,
    flexDirection: 'row',
  },
  errorContainer: {
    flex: 1,
  },
  errorContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing['5xl'],
    gap: Spacing.xl,
  },
  errorTitle: {
    marginTop: Spacing.xs,
  },
  errorMessage: {
    textAlign: 'center',
    opacity: 0.85,
  },
  errorRetry: {
    marginTop: Spacing.md,
    maxWidth: 220,
  },
});
