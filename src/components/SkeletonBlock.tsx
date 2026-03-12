import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from '../hooks/useReducedMotion';
import type { ReactNode } from 'react';

type Props = {
  style?: StyleProp<ViewStyle>;
  animated?: boolean;
  reducedMotionOverride?: boolean;
  variant?: 'default' | 'soft' | 'strong';
  children?: ReactNode;
};

const PULSE_MIN = 0.74;
const PULSE_MAX = 0.96;

export function SkeletonBlock({
  style,
  animated = true,
  reducedMotionOverride,
  variant = 'default',
  children,
}: Props) {
  const reducedMotionEnabled = useReducedMotion();
  const shouldAnimate = animated && !(reducedMotionOverride ?? reducedMotionEnabled);
  const pulse = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!shouldAnimate) {
      pulse.setValue(0.45);
      shimmer.setValue(0);
      return;
    }

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 980,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
          isInteraction: false,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 980,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
          isInteraction: false,
        }),
      ])
    );

    const shimmerLoop = Animated.loop(
      Animated.sequence([
        Animated.delay(160),
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1400,
          easing: Easing.linear,
          useNativeDriver: true,
          isInteraction: false,
        }),
      ])
    );

    pulseLoop.start();
    shimmerLoop.start();

    return () => {
      pulseLoop.stop();
      shimmerLoop.stop();
    };
  }, [pulse, shimmer, shouldAnimate]);

  const pulseOpacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [PULSE_MIN, PULSE_MAX],
  });

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-140, 260],
  });

  const shimmerOpacity = shimmer.interpolate({
    inputRange: [0, 0.3, 0.7, 1],
    outputRange: [0, 0.28, 0.28, 0],
  });

  const variantStyle =
    variant === 'soft'
      ? styles.soft
      : variant === 'strong'
      ? styles.strong
      : styles.default;

  return (
    <View style={[styles.base, variantStyle, style]}>
      <Animated.View style={[StyleSheet.absoluteFillObject, styles.fill, { opacity: pulseOpacity }]} />
      {shouldAnimate ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.shimmer,
            {
              opacity: shimmerOpacity,
              transform: [{ translateX: shimmerTranslate }, { rotate: '18deg' }],
            },
          ]}
        />
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
    borderRadius: 10,
  },
  fill: {
    backgroundColor: 'rgba(229, 224, 229, 0.50)',
  },
  shimmer: {
    position: 'absolute',
    top: -14,
    bottom: -14,
    width: '44%',
    backgroundColor: 'rgba(255, 255, 255, 0.20)',
  },
  default: {
    backgroundColor: 'rgba(45, 45, 45, 0.10)',
  },
  soft: {
    backgroundColor: 'rgba(45, 45, 45, 0.05)',
  },
  strong: {
    backgroundColor: 'rgba(45, 45, 45, 0.18)',
  },
});
