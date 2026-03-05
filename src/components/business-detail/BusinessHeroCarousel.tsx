import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Typography';
import { businessDetailColors, businessDetailSpacing } from './styles';

type Props = {
  businessName: string;
  images: string[];
  rating: number;
  verified?: boolean;
};

export function BusinessHeroCarousel({ businessName, images, rating, verified }: Props) {
  const [index, setIndex] = useState(0);

  const activeIndex = useMemo(() => {
    if (images.length === 0) return 0;
    return Math.min(index, images.length - 1);
  }, [images.length, index]);

  const activeImage = images[activeIndex];
  const hasMultiple = images.length > 1;
  const displayRating = Number.isFinite(rating) ? rating : 0;

  return (
    <View style={styles.wrap}>
      {activeImage ? (
        <Image source={{ uri: activeImage }} style={styles.image} contentFit="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons name="image-outline" size={40} color="rgba(255,255,255,0.9)" />
          <Text style={styles.placeholderText}>{businessName}</Text>
        </View>
      )}

      <View pointerEvents="none" style={styles.gradientOverlay} />

      {verified ? (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>Verified</Text>
        </View>
      ) : null}

      <View style={styles.ratingBadge}>
        <Ionicons name="star" size={14} color="#F59E0B" />
        <Text style={styles.ratingText}>{displayRating > 0 ? displayRating.toFixed(1) : '0.0'}</Text>
      </View>

      {hasMultiple ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous image"
            onPress={() => setIndex((current) => (current === 0 ? images.length - 1 : current - 1))}
            style={styles.carouselArrowLeft}
          >
            <Ionicons name="chevron-back" size={20} color={businessDetailColors.charcoal} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Next image"
            onPress={() => setIndex((current) => (current === images.length - 1 ? 0 : current + 1))}
            style={styles.carouselArrowRight}
          >
            <Ionicons name="chevron-forward" size={20} color={businessDetailColors.charcoal} />
          </Pressable>
        </>
      ) : null}

      {hasMultiple ? (
        <View style={styles.indicators}>
          {images.map((_, dotIndex) => (
            <Pressable
              key={`hero-dot-${dotIndex}`}
              onPress={() => setIndex(dotIndex)}
              style={[styles.indicator, dotIndex === activeIndex ? styles.indicatorActive : null]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: 288,
    borderRadius: businessDetailSpacing.cardRadius,
    overflow: 'hidden',
    backgroundColor: businessDetailColors.cardBg,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: businessDetailColors.cardBg,
  },
  placeholderText: {
    color: businessDetailColors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.26)',
  },
  verifiedBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(157,171,155,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.52)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  verifiedText: {
    color: businessDetailColors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  ratingBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(229,224,229,0.96)',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  ratingText: {
    color: businessDetailColors.charcoal,
    fontSize: 13,
    fontWeight: '700',
  },
  carouselArrowLeft: {
    position: 'absolute',
    top: '50%',
    left: 14,
    marginTop: -19,
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,224,229,0.95)',
  },
  carouselArrowRight: {
    position: 'absolute',
    top: '50%',
    right: 14,
    marginTop: -19,
    width: 38,
    height: 38,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,224,229,0.95)',
  },
  indicators: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  indicator: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: businessDetailColors.white,
  },
});
