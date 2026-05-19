import React, { ReactNode } from "react";
import { View, Text, StyleSheet, } from "react-native";
import { GestureDetector, Gesture } from "react-native-gesture-handler";
import { scheduleOnRN } from 'react-native-worklets';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import * as Haptics from 'expo-haptics';

const ACTION_THRESHOLD = 110;
const MAX_SWIPE = 110;

interface IProps {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  swipeLeftChild: ReactNode;
  swipeLeftColor: string;
  swipeLeftBackground: string;
  swipeRightChild: ReactNode;
  swipeRightColor: string;
  swipeRightBackground: string;
  children: ReactNode;
  queued?: boolean;
}

export default function SwipeRow({
  onSwipeLeft,
  onSwipeRight,
  swipeLeftChild,
  swipeLeftColor,
  swipeLeftBackground,
  swipeRightChild,
  swipeRightColor,
  swipeRightBackground,
  children,
}: IProps) {
  const translateX = useSharedValue(0);

  const triggerSwipeRight = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSwipeRight();
  };

  const triggerSwipeLeft = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSwipeLeft();
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      // Add resistance when dragging past MAX_SWIPE
      if (event.translationX > MAX_SWIPE) {
        translateX.value = MAX_SWIPE + (event.translationX - MAX_SWIPE) * 0.2;
      } else if (event.translationX < -MAX_SWIPE) {
        translateX.value = -MAX_SWIPE + (event.translationX + MAX_SWIPE) * 0.2;
      } else {
        translateX.value = event.translationX;
      }
    })
    .onEnd(() => {
      const finalX = translateX.value;

      if (finalX > ACTION_THRESHOLD) {
        // Right swipe
        scheduleOnRN(triggerSwipeRight);
      } else if (finalX < -ACTION_THRESHOLD) {
        // Left swipe
        scheduleOnRN(triggerSwipeLeft);
      }

      // Snap back to center
      translateX.value = withSpring(0);
    });

  const foregroundStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  const leftBackgroundOpacity = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        translateX.value,
        [-ACTION_THRESHOLD, 0],
        [1, 0],
        Extrapolation.CLAMP
      ),
    };
  });

  const rightBackgroundOpacity = useAnimatedStyle(() => {
    return {
      opacity: interpolate(
        translateX.value,
        [0, ACTION_THRESHOLD],
        [0, 1],
        Extrapolation.CLAMP
      ),
    };
  });

  return (
    <View style={styles.container}>
      {/* SWIPE LEFT (Revealed when swiping left, shows on the right side) */}
      <Animated.View
        style={[
          styles.backgroundLayer,
          {
            backgroundColor: swipeLeftBackground,
            justifyContent: "flex-end",
            paddingRight: 20,
          },
          leftBackgroundOpacity,
        ]}
      >
        <View style={{ opacity: 1 /* children color handled below */ }}>
          <Text style={{ color: swipeLeftColor }}>
            {swipeLeftChild}
          </Text>
        </View>
      </Animated.View>

      {/* SWIPE RIGHT (Revealed when swiping right, shows on the left side) */}
      <Animated.View
        style={[
          styles.backgroundLayer,
          {
            backgroundColor: swipeRightBackground,
            justifyContent: "flex-start",
            paddingLeft: 20,
          },
          rightBackgroundOpacity,
        ]}
      >
        <View style={{ opacity: 1 }}>
          <Text style={{ color: swipeRightColor }}>
            {swipeRightChild}
          </Text>
        </View>
      </Animated.View>

      {/* FOREGROUND */}
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.foregroundLayer, foregroundStyle]}>
          {children}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    overflow: "hidden",
    width: "100%",
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    display: "flex",
    flexDirection: "row",
  },
  foregroundLayer: {
    position: "relative",
    zIndex: 1,
    backgroundColor: "transparent",
  },
});
