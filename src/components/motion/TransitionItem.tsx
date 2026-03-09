import { useEffect, useRef } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { MOTION_VARIANTS, REDUCED_MOTION_DURATION, STAGGER_MAX_DELAY, STAGGER_STEP, type MotionVariant } from './motionTokens';
import { usePageTransitionScope } from './TransitionScope';

type Props = {
  children: React.ReactNode;
  index?: number;
  style?: StyleProp<ViewStyle>;
  variant?: MotionVariant;
  animate?: boolean;
  disableOnVirtualized?: boolean;
};

export function TransitionItem({
  children,
  index = 0,
  style,
  variant = 'card',
  animate = true,
  disableOnVirtualized = false,
}: Props) {
  const reducedMotionEnabled = useReducedMotion();
  const progress = useRef(new Animated.Value(0)).current;
  const spec = MOTION_VARIANTS[variant];
  const scope = usePageTransitionScope();
  const scopeTick = scope?.scopeTick ?? 0;
  const shouldAnimate = animate && !disableOnVirtualized;

  useEffect(() => {
    if (__DEV__ && !scope) {
      console.warn('[motion] TransitionItem rendered outside TransitionScopeProvider.');
    }
  }, [scope]);

  useEffect(() => {
    scope?.registerItem();
  }, [scope, scopeTick]);

  useEffect(() => {
    if (!shouldAnimate) {
      progress.setValue(1);
      return;
    }

    const delay = reducedMotionEnabled ? 0 : Math.min(spec.baseDelay + index * STAGGER_STEP, STAGGER_MAX_DELAY);

    progress.setValue(0);
    Animated.timing(progress, {
      toValue: 1,
      delay,
      duration: reducedMotionEnabled ? REDUCED_MOTION_DURATION : spec.duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [index, progress, reducedMotionEnabled, scopeTick, shouldAnimate, spec.baseDelay, spec.duration]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: progress,
          transform: [
            {
              translateY: progress.interpolate({
                inputRange: [0, 1],
                outputRange: [reducedMotionEnabled ? 0 : spec.translateY, 0],
              }),
            },
          ],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}
