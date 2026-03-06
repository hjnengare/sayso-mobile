import { useEffect, useRef } from 'react';
import { Animated, Easing, Platform, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

type Props = {
  style?: StyleProp<ViewStyle>;
};

export function SkeletonBlock({ style }: Props) {
  const opacity = useRef(new Animated.Value(0.52)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.92,
          duration: 760,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
          isInteraction: false,
        }),
        Animated.timing(opacity, {
          toValue: 0.52,
          duration: 760,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: Platform.OS !== 'web',
          isInteraction: false,
        }),
      ])
    );

    animation.start();
    return () => {
      animation.stop();
    };
  }, [opacity]);

  return <Animated.View style={[styles.base, style, { opacity }]} />;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: 'rgba(45,55,72,0.18)',
    borderRadius: 10,
  },
});
