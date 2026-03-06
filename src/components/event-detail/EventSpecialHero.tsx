import { StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { EventSpecialDetail } from '../../hooks/useEventSpecialDetail';
import { resolveEventMediaImage } from '../event-card/eventCardUtils';
import { Text } from '../Typography';
import { businessDetailColors } from '../business-detail/styles';

type Props = {
  item: EventSpecialDetail;
  rating: number;
};

export function EventSpecialHero({ item, rating }: Props) {
  const { image } = resolveEventMediaImage(item);
  const displayRating = Number.isFinite(rating) ? rating : 0;

  return (
    <View style={styles.wrap}>
      {image ? (
        <>
          <Image source={{ uri: image }} style={styles.imageBlur} contentFit="cover" blurRadius={26} />
          <Image source={{ uri: image }} style={styles.image} contentFit="cover" />
        </>
      ) : (
        <View style={styles.imageFallback}>
          <Ionicons name="image" size={48} color="rgba(255,255,255,0.82)" />
        </View>
      )}

      <View pointerEvents="none" style={styles.gradientOverlay} />

      <View style={styles.typeBadge}>
        <Text style={styles.typeBadgeText}>{item.type === 'special' ? 'Special Offer' : 'Event'}</Text>
      </View>

      {item.availabilityStatus ? (
        <View
          style={[
            styles.availabilityBadge,
            item.availabilityStatus === 'sold_out' ? styles.soldOutBadge : styles.limitedBadge,
          ]}
        >
          <Text style={styles.availabilityBadgeText}>
            {item.availabilityStatus === 'sold_out' ? 'Sold Out' : 'Limited Spots'}
          </Text>
        </View>
      ) : null}

      <View style={[styles.ratingBadge, item.availabilityStatus ? styles.ratingBadgeShifted : null]}>
        <Ionicons name="star" size={14} color="#F59E0B" />
        <Text style={styles.ratingText}>{displayRating > 0 ? displayRating.toFixed(1) : '0.0'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: 286,
    overflow: 'hidden',
    backgroundColor: businessDetailColors.cardBg,
  },
  image: {
    ...StyleSheet.absoluteFillObject,
  },
  imageBlur: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
    transform: [{ scale: 1.12 }],
  },
  imageFallback: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: businessDetailColors.sage,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  typeBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(114,47,55,0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.45)',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  typeBadgeText: {
    color: businessDetailColors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  availabilityBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 999,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  limitedBadge: {
    backgroundColor: 'rgba(217,119,6,0.92)',
  },
  soldOutBadge: {
    backgroundColor: 'rgba(114,47,55,0.92)',
  },
  availabilityBadgeText: {
    color: businessDetailColors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  ratingBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(229,224,229,0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  ratingBadgeShifted: {
    right: 126,
  },
  ratingText: {
    color: businessDetailColors.charcoal,
    fontSize: 13,
    fontWeight: '700',
  },
});
