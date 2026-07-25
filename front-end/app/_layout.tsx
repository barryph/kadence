import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from '@react-navigation/native';
import { SplashScreen, Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useEffect } from 'react';
import {
  IBMPlexMono_400Regular,
  IBMPlexMono_600SemiBold,
  IBMPlexMono_700Bold,
  useFonts,
} from '@expo-google-fonts/ibm-plex-mono';
import Toast, { BaseToast } from 'react-native-toast-message';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/context/auth-context';
import Background from '@/components/backgrounds/background';
import { ThemedText } from '@/components/base/themed-text';
import BlueBackground from '@/components/backgrounds/blue-background';
import ActivityBackground from '@/components/backgrounds/activity-background';
import { Colors } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

// This prevents SplashScreen from auto hiding while the fonts are in loading state
SplashScreen.preventAutoHideAsync();

function FontsProvider({ children }: { children: React.ReactNode }) {
  const [loaded, error] = useFonts({
    IBMPlexMono_400Regular,
    IBMPlexMono_600SemiBold,
    IBMPlexMono_700Bold,
  });

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

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup =
      segments[0] === 'login' ||
      segments[0] === 'register' ||
      segments[0] === 'forgot-password' ||
      segments[0] === 'reset-password';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, segments, router]);

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

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const toastConfig = {
    // success: (props) => <BaseToast {...props} style={{ background: 'red' }} />,
    success: ({ text1 }) => (
      <View
        style={{
          paddingVertical: 18,
          paddingHorizontal: 18,
          minWidth: '95%',
          borderRadius: 6,
          overflow: 'hidden',
          boxShadow:
            'rgba(0, 0, 0, 0.3) 0px 19px 38px, rgba(0, 0, 0, 0.22) 0px 15px 12px',
          backgroundColor: Colors.dark.toast,
          display: 'flex',
          alignContent: 'center',
          alignItems: 'center',
          gap: 11,
          flexDirection: 'row',
        }}
      >
        <Ionicons
          name="checkmark-circle-sharp"
          size={24}
          color={Colors.toastSuccess}
        />
        <ThemedText size="small" type="defaultBold">
          {text1}
        </ThemedText>
      </View>
    ),
  };

  return (
    <GestureHandlerRootView>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <FontsProvider>
          <AuthProvider>
            <RootLayoutNav />
            <Toast config={toastConfig} />
          </AuthProvider>
        </FontsProvider>
        <StatusBar style="auto" />
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
