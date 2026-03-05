import { useEffect, useRef } from 'react';
import { Animated, Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { CardSurface } from './CardSurface';
import { CARD_RADIUS } from '../styles/radii';

type Props = {
  style?: StyleProp<ViewStyle>;
};

export function EventCardSkeleton({ style }: Props) {
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
    <Animated.View style={[style, { opacity }]}>
      <CardSurface radius={CARD_RADIUS}>
        <View style={styles.media}>
          <View style={styles.ribbon} />
          <View style={styles.ratingBadge} />
        </View>
        <View style={styles.body}>
          <View style={styles.title} />
          <View style={styles.descriptionLineLarge} />
          <View style={styles.descriptionLineSmall} />
          <View style={styles.pillRow}>
            <View style={styles.pill} />
            <View style={styles.pillShort} />
          </View>
          <View style={styles.reviewCount} />
          <View style={styles.cta} />
        </View>
      </CardSurface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  media: {
    height: 220,
    backgroundColor: '#E2E8F0',
  },
  ribbon: {
    position: 'absolute',
    left: -42,
    top: 18,
    width: 180,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(114, 47, 55, 0.2)',
    transform: [{ rotate: '-44deg' }],
  },
  ratingBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 52,
    height: 28,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  title: {
    height: 18,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    width: '76%',
  },
  descriptionLineLarge: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    width: '100%',
    marginTop: 9,
  },
  descriptionLineSmall: {
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E2E8F0',
    width: '72%',
    marginTop: 7,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  pill: {
    width: 118,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  pillShort: {
    width: 86,
    height: 28,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
  },
  reviewCount: {
    width: 92,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginTop: 12,
  },
  cta: {
    height: 46,
    borderRadius: 999,
    backgroundColor: '#E2E8F0',
    marginTop: 12,
  },
});
