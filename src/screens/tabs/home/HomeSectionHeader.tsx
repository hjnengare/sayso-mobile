import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../../../components/Typography';
import { homeTokens } from './HomeTokens';

type Props = {
  title: string;
  actionLabel?: string;
  onPress?: () => void;
  delay?: number;
};

export function HomeSectionHeader({ title, actionLabel, onPress, delay = 0 }: Props) {
  const titleAnim = useRef(new Animated.Value(0)).current;
  const actionAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const run = () => {
      Animated.timing(titleAnim, {
        toValue: 1,
        duration: 380,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
      setTimeout(() => {
        Animated.timing(actionAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      }, 90);
    };

    if (delay > 0) {
      const t = setTimeout(run, delay);
      return () => clearTimeout(t);
    }
    run();
  }, []);

  return (
    <View style={styles.row}>
      <Animated.View
        style={{
          opacity: titleAnim,
          transform: [
            { translateY: titleAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) },
          ],
        }}
      >
        <Text style={styles.title}>{title}</Text>
      </Animated.View>

      {actionLabel && onPress ? (
        <Animated.View
          style={{
            opacity: actionAnim,
            transform: [
              { translateX: actionAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) },
            ],
          }}
        >
          <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.8}>
            <Text style={styles.action}>{actionLabel}</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: homeTokens.pageGutter,
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: homeTokens.charcoal,
    letterSpacing: -0.3,
  },
  action: {
    fontSize: 14,
    fontWeight: '600',
    color: homeTokens.charcoal,
  },
  actionButton: {
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
});
