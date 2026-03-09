import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type Props = {
  visible: boolean;
  onPress: () => void;
};

export function ScrollToTopFab({ visible, onPress }: Props) {
  const anim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(anim, {
      toValue: visible ? 1 : 0,
      damping: 18,
      stiffness: 260,
      useNativeDriver: true,
    }).start();
  }, [visible, anim]);

  return (
    <Animated.View
      style={[
        styles.fab,
        {
          opacity: anim,
          transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) }],
        },
      ]}
      pointerEvents={visible ? 'box-none' : 'none'}
    >
      <Pressable
        style={({ pressed }) => [styles.btn, pressed && styles.btnPressed]}
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Scroll to top"
      >
        <Ionicons name="chevron-up" size={20} color="#2D2D2D" />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 32,
    zIndex: 100,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: 'rgba(229,224,229,0.90)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  btnPressed: {
    opacity: 0.88,
    transform: [{ scale: 0.95 }],
  },
});
