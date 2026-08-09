import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/base/themed-text';
import Logo from '@/components/logo';
import BlueBackground from '@/components/backgrounds/blue-background';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = Math.floor((SCREEN_WIDTH / 100) * 75);

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export default function NavDrawer({
  isOpen,
  onClose,
  onLogout,
}: NavDrawerProps) {
  const router = useRouter();
  const slideAnim = useRef(new Animated.Value(DRAWER_WIDTH)).current;
  const [isModalVisible, setIsModalVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setIsModalVisible(true);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: DRAWER_WIDTH,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setIsModalVisible(false);
      });
    }
  }, [isOpen, slideAnim]);

  const handleNavigate = (path: any) => {
    onClose();
    router.push(path);
  };

  const handleLogout = () => {
    onClose();
    onLogout();
  };

  return (
    <Modal
      visible={isModalVisible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.backgroundDim} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.drawerContainer,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <BlueBackground />
          <SafeAreaView edges={['top']} style={styles.header}>
            <Logo />

            <Pressable onPress={onClose} style={styles.closeButton}>
              <ThemedText style={styles.closeIcon}>✕</ThemedText>
            </Pressable>
          </SafeAreaView>

          <View style={styles.navItems}>
            <Pressable
              style={styles.navItem}
              onPress={() => handleNavigate('/')}
            >
              <ThemedText style={styles.navText}>Activities</ThemedText>
            </Pressable>

            <Pressable
              style={styles.navItem}
              onPress={() => handleNavigate('/timeline')}
            >
              <ThemedText style={styles.navText}>Timeline</ThemedText>
            </Pressable>

            <Pressable
              style={styles.navItem}
              onPress={() => handleNavigate('/goals')}
            >
              <ThemedText style={styles.navText}>Goals</ThemedText>
            </Pressable>

            <Pressable
              style={styles.navItem}
              onPress={() => handleNavigate('/categories')}
            >
              <ThemedText style={styles.navText}>Categories</ThemedText>
            </Pressable>

            <Pressable
              style={styles.navItem}
              onPress={() => handleNavigate('/profile')}
            >
              <ThemedText style={styles.navText}>Profile</ThemedText>
            </Pressable>

            <Pressable
              style={[styles.navItem, styles.logout]}
              onPress={handleLogout}
            >
              <ThemedText style={styles.navText}>Logout</ThemedText>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  backgroundDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  drawerContainer: {
    width: DRAWER_WIDTH,
    // backgroundColor: Colors.blue.new,
    height: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: -2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    paddingHorizontal: 15,
    paddingRight: 25,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 21,
    paddingBottom: 14,
  },
  closeButton: {
    paddingVertical: 8,
  },
  closeIcon: {
    fontSize: 24,
    color: '#fff',
  },
  navItems: {
    display: 'flex',
    alignItems: 'flex-end',
    marginTop: 20,
  },
  navItem: {
    paddingVertical: 12,
  },
  navText: {
    fontSize: 26,
    lineHeight: 32,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'right',
  },
  logout: {
    borderTopWidth: 1,
    marginTop: 35,
    borderTopColor: '#fff',
    opacity: 0.6,
  },
});
