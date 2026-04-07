import React, { useRef, useEffect } from 'react';
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
  const isAnimatingRef = useRef(false);
  const hasCalledBackRef = useRef(false);
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  // 当组件挂载时确保状态重置
  useEffect(() => {
    translateX.setValue(0);
    isAnimatingRef.current = false;
    hasCalledBackRef.current = false;
    animationRef.current = null;

    return () => {
      // 组件卸载时停止动画
      if (animationRef.current) {
        animationRef.current.stop();
      }
      translateX.setValue(0);
    };
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        if (!enabled || gestureState.x0 > EDGE_TRIGGER_WIDTH) {
          return false;
        }
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx > 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // 防止重复触发
        if (isAnimatingRef.current || hasCalledBackRef.current) {
          return;
        }

        const shouldNavigateBack =
          gestureState.dx > screenWidth * SWIPE_THRESHOLD ||
          gestureState.vx > VELOCITY_THRESHOLD;

        if (shouldNavigateBack) {
          isAnimatingRef.current = true;

          animationRef.current = Animated.timing(translateX, {
            toValue: screenWidth,
            duration: 200,
            useNativeDriver: true,
          });

          animationRef.current.start(() => {
            if (!hasCalledBackRef.current) {
              hasCalledBackRef.current = true;
              onSwipeBack();
            }
          });
        } else {
          animationRef.current = Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          });
          animationRef.current.start();
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
