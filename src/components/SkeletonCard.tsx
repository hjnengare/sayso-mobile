import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { CardSurface } from './CardSurface';
import { CARD_RADIUS } from '../styles/radii';

export function SkeletonCard() {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: Platform.OS !== 'web' }),
      ])
    ).start();
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }}>
      <CardSurface radius={CARD_RADIUS}>
        <View style={styles.image} />
        <View style={styles.body}>
          <View style={styles.titleLine} />
          <View style={styles.subtitleLine} />
          <View style={styles.ratingLine} />
        </View>
      </CardSurface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  image: {
    width: '100%',
    height: 220,
    backgroundColor: '#E5E7EB',
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  titleLine: {
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E5E7EB',
    width: '70%',
  },
  subtitleLine: {
    height: 11,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    width: '50%',
    marginTop: 8,
  },
  ratingLine: {
    height: 11,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
    width: '30%',
    marginTop: 8,
  },
});
