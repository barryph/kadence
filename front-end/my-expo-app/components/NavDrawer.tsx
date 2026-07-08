import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { useRouter } from 'expo-router';
import { ThemedText } from './themed-text';
import { Colors } from '@/constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import BlueBackground from './BlueBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH;

interface NavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
}

export default function NavDrawer({ isOpen, onClose, onLogout }: NavDrawerProps) {
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
  }, [isOpen]);

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
            { transform: [{ translateX: slideAnim }] }
          ]}
        >
          <BlueBackground />
          <SafeAreaView edges={['top']} style={styles.header}>
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
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <ThemedText style={styles.closeIcon}>✕</ThemedText>
            </TouchableOpacity>
          </SafeAreaView>

          <View style={styles.navItems}>
            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNavigate('/')}
            >
              <ThemedText style={styles.navText}>Home</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.navItem}
              onPress={() => handleNavigate('/explore')}
            >
              <ThemedText style={styles.navText}>Activity Hub</ThemedText>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navItem]}
              onPress={handleLogout}
            >
              <ThemedText style={styles.navText}>Logout</ThemedText>
            </TouchableOpacity>
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
    paddingTop: 24,
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
    marginTop: 15,
  },
  navItem: {
    paddingVertical: 15,
  },
  navText: {
    fontSize: 24,
    color: '#fff',
    fontWeight: '600',
    textAlign: 'right',
  },
});
