import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  PanResponder,
  Dimensions,
} from 'react-native';

interface SwipeBackWrapperProps {
  children: React.ReactNode;
  backgroundContent: React.ReactNode;
  onSwipeBack: () => void;
  enabled?: boolean;
}

const EDGE_TRIGGER_WIDTH = 20;
const SWIPE_THRESHOLD = 0.3;
const VELOCITY_THRESHOLD = 0.3;

export function SwipeBackWrapper({
  children,
  backgroundContent,
  onSwipeBack,
  enabled = true,
}: SwipeBackWrapperProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const screenWidth = Dimensions.get('window').width;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false, // 不在开始时拦截
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // 只在水平移动大于垂直移动且在左边缘区域时拦截
        if (!enabled || gestureState.x0 > EDGE_TRIGGER_WIDTH) {
          return false;
        }
        // 允许垂直滚动，只在明显水平滑动时拦截
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        const shouldNavigateBack =
          gestureState.dx > screenWidth * SWIPE_THRESHOLD ||
          gestureState.vx > VELOCITY_THRESHOLD;

        if (shouldNavigateBack) {
          Animated.timing(translateX, {
            toValue: screenWidth,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onSwipeBack();
          });
        } else {
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={styles.wrapper}>
      {/* 底层 - 上一个页面内容 */}
      <View style={styles.backgroundLayer}>
        {backgroundContent}
      </View>
      {/* 遮罩层 */}
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: translateX.interpolate({
              inputRange: [0, screenWidth],
              outputRange: [0, 0.3],
            }),
          },
        ]}
      />
      {/* 前景 - 当前页面 */}
      <Animated.View
        style={[styles.container, { transform: [{ translateX }] }]}
        {...panResponder.panHandlers}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  container: {
    flex: 1,
    zIndex: 2,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
    pointerEvents: 'none',
    zIndex: 1,
  },
});
