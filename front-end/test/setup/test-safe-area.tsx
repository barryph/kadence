import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const initialMetrics = {
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
  frame: { x: 0, y: 0, width: 390, height: 844 },
};

export function TestSafeAreaProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SafeAreaProvider initialMetrics={initialMetrics}>
      {children}
    </SafeAreaProvider>
  );
}
