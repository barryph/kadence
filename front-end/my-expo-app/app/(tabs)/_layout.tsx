import { Tabs } from 'expo-router';
import React, { useState } from 'react';
import { TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/context/AuthContext';
import NavDrawer from '@/components/NavDrawer';
import { ThemedText } from '@/components/themed-text';
import UnmountOnBlur from '@/components/router/UnmountOnBlur';
import { LinearGradient } from 'expo-linear-gradient';


export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { logout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const headerOptions = {
    headerShown: true,
    headerStyle: {
      paddingVertical: 40,
    },

    header: () =>
    (
      <SafeAreaView
        edges={['top']}
        style={{
          paddingVertical: 14,
          paddingHorizontal: 15,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignContent: 'center',
          alignItems: 'center',
        }}
      >
        <LinearGradient
          colors={[
            'rgba(7,124,255,0.98)',
            'rgba(0,158,255,0.92)',
            'rgba(11,216,255,0.82)',
          ]}
          locations={[0, 0.58, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <ThemedText
          type="defaultBold"
          style={{
            color: '#fff',
            fontSize: 32,
          }}
        >
          Fit<ThemedText
            type="defaultBold"
            style={{
              color: Colors.light.faint,
              fontSize: 32,
            }}
          >Trick</ThemedText>
        </ThemedText>

        <TouchableOpacity onPress={() => setIsDrawerOpen(true)}>
          <View style={{
            backgroundColor: 'rgba(255,255,255,.11)',
            borderRadius: 17,
            height: 44,
            width: 45,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <Text style={{ color: '#d8ecff', fontSize: 24, fontWeight: 'bold' }}>☰</Text>
          </View>
        </TouchableOpacity>
      </SafeAreaView>
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
