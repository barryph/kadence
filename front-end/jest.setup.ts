import { cleanup } from '@testing-library/react-native';
import './test/setup/setup-expo-router';
import { resetMockAuth } from './test/setup/mock-auth';

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

afterEach(async () => {
  await cleanup();
  resetMockAuth();
});

jest.mock('react-native-reanimated');

/**
 * KeyboardAvoidingView registers Keyboard listeners and layout state updates
 * that race with RNTL's async act() in login form tests. Keyboard avoidance
 * is not under test in screen suites — mock as a plain View.
 */
jest.mock('@/components/kb-avoiding-view', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({
      children,
      style,
    }: {
      children: React.ReactNode;
      style?: object;
    }) => React.createElement(View, { style }, children),
  };
});

jest.mock('@/components/swipe-row', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children: React.ReactNode }) =>
      React.createElement(View, null, children),
  };
});

jest.mock('reanimated-color-picker', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, null, children),
    Preview: () => null,
    Panel1: () => null,
    HueSlider: () => null,
    OpacitySlider: () => null,
    Swatches: () => null,
  };
});

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: { children?: React.ReactNode }) =>
    children ?? null,
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  isLoaded: () => true,
}));

jest.mock('@expo-google-fonts/ibm-plex-mono', () => ({
  IBMPlexMono_400Regular: 'IBMPlexMono_400Regular',
  IBMPlexMono_600SemiBold: 'IBMPlexMono_600SemiBold',
  IBMPlexMono_700Bold: 'IBMPlexMono_700Bold',
  useFonts: () => [true, null],
}));

jest.mock('react-native-toast-message', () => ({
  __esModule: true,
  default: {
    show: jest.fn(),
    hide: jest.fn(),
  },
}));
