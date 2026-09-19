import { Redirect, Tabs, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import Feather from '@expo/vector-icons/Feather';

import { HapticTab } from '@/components/base/haptic-tab';
import OfflineBanner from '@/components/base/offline-banner';
import { useAuth } from '@/context/auth-context';
import { Colors, Spacing } from '@/constants/theme';
import BlueBackground from '@/components/backgrounds/blue-background';
import Logo from '@/components/logo';

export default function TabLayout() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  // Guard the protected group at the group itself: this layout only renders
  // when one of its routes is the current one, so a deep link elsewhere (e.g.
  // `reset-password`) can never be misread as a protected route and bounced.
  // `AuthProvider` withholds it until the session restore finishes, so
  // `isAuthenticated` is never a guess.
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const headerOptions = {
    headerShown: true,
    headerStyle: {
      paddingVertical: Spacing['6xl'],
    },

    header: () => (
      <SafeAreaView edges={['top']} style={styles.header}>
        <BlueBackground />
        <View style={styles.headerRow}>
          <Logo />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Account"
            hitSlop={8}
            onPress={() => router.push('/profile')}
            style={styles.headerButton}
          >
            <MaterialIcons
              name="account-circle"
              size={24}
              color={Colors.iconAccent}
            />
          </Pressable>
        </View>

        {/* The app is server-backed and queues no writes, so an offline user
            needs to know before they try to do anything. */}
        <OfflineBanner />
      </SafeAreaView>
    ),
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.textPrimary,
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: Colors.navbar,
          borderTopWidth: 0,
        },
      }}
      backBehavior="history"
    >
      <Tabs.Screen
        name="index"
        options={{
          ...headerOptions,
          title: 'Activities',
          tabBarIcon: ({ color }) => (
            <Feather name="activity" size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="categories/index"
        options={{
          ...headerOptions,
          title: 'Categories',
          tabBarIcon: ({ color }) => (
            <FontAwesome6 name="layer-group" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="categories/insights"
        options={{
          ...headerOptions,
          title: 'Category Insights',
          href: null,
        }}
      />

      <Tabs.Screen
        name="timeline"
        options={{
          ...headerOptions,
          title: 'Timeline',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="timeline" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals/index"
        options={{
          ...headerOptions,
          title: 'Goals',
          tabBarIcon: ({ color }) => (
            <Feather name="target" size={24} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="goals/[activityId]"
        options={{
          ...headerOptions,
          title: 'Goal Insights',
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          ...headerOptions,
          href: null,
        }}
      />

      <Tabs.Screen
        name="activities/insights"
        options={{
          ...headerOptions,
          title: 'Activity Insights',
          href: null,
        }}
      />
      <Tabs.Screen
        name="activities/create"
        options={{
          ...headerOptions,
          title: 'New Activity',
          href: null,
        }}
      />
      <Tabs.Screen
        name="activities/edit/[id]"
        options={{
          ...headerOptions,
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingVertical: Spacing.lg,
  },
  headerRow: {
    paddingHorizontal: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerButton: {
    backgroundColor: Colors.surfaceTranslucentStrong,
    borderRadius: 12,
    height: 40,
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
