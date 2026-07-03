import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { TouchableOpacity, Text, View } from 'react-native';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import NavDrawer from '@/components/NavDrawer';
import { ThemedText } from '@/components/themed-text';
import UnmountOnBlur from '@/components/router/UnmountOnBlur';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { logout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const headerOptions = {
    headerShown: true,
    headerStyle: {
      borderBottomWidth: 3,
      borderBottomColor: '#dfdfdf99',
      backgroundColor: Colors.blue.new,
    },
    headerTitle: () => (
      <ThemedText
        type="defaultSemiBold"
        style={{
          color: '#fff',
          fontSize: 22,
        }}
      >
        Fit<ThemedText
          type="defaultSemiBold"
          style={{
            color: Colors.light.faint,
            fontSize: 22,
          }}
        >Trick</ThemedText>
      </ThemedText>
    ),
    headerRight: () => (
      <TouchableOpacity onPress={() => setIsDrawerOpen(true)} style={{ marginRight: 16 }}>
        <Text style={{ color: Colors.light.faint, fontSize: 24, fontWeight: 'bold' }}>☰</Text>
      </TouchableOpacity>
    ),
  };

  return (
    <>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            ...headerOptions,
            title: 'Home',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="dual-simple"
          options={{
            ...headerOptions,
            title: 'Scrll Simple',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
            href: null,
          }}
        />
        <Tabs.Screen
          name="dual-real"
          options={{
            ...headerOptions,
            title: 'Scrll Real',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
            href: null,
          }}
        />
        <Tabs.Screen
          name="dual-two-simple"
          options={{
            ...headerOptions,
            title: 'Scrll Two Simple',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
            href: null,
          }}
        />
        <Tabs.Screen
          name="dual-two"
          options={{
            ...headerOptions,
            title: 'Scrll Two Real',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
            href: null,
          }}
        />
        <Tabs.Screen
          name="timeline-manual"
          options={{
            ...headerOptions,
            title: 'TimelineManual',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
          }}
        />
        <Tabs.Screen
          name="timeline"
          options={{
            ...headerOptions,
            title: 'Timeline',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="calendar" color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Explore',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
            href: null,
          }}
        />
      </Tabs >

      <NavDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onLogout={logout}
      />
    </>
  );
}
