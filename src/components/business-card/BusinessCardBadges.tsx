import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getOverlayShadowStyle } from '../../styles/overlayShadow';
import { Text } from '../Typography';

// Matches web's Gold (>4.0) / Bronze (>2.0) / Low star gradient tiers
function getStarColor(rating: number): string {
  if (rating > 4.0) return '#E6A547'; // Gold
  if (rating > 2.0) return '#D4915C'; // Bronze
  return '#D66B6B';                   // Low
}

type Props = {
  verified?: boolean;
  hasRating: boolean;
  rating?: number;
  distanceBadgeText?: string | null;
  onPressDistance?: () => void;
};

export function BusinessCardBadges({
  verified = false,
  hasRating,
  rating,
  distanceBadgeText,
  onPressDistance,
}: Props) {
  return (
    <>
      {verified ? (
        <View style={[styles.badge, getOverlayShadowStyle(999), styles.leftBadge]}>
          <Ionicons name="checkmark-circle" size={13} color="#2563EB" />
          <Text style={styles.badgeText}>Verified</Text>
        </View>
      ) : null}

      <View style={[styles.badge, getOverlayShadowStyle(999), styles.rightBadge]}>
        {hasRating && rating != null ? (
          <>
            <Ionicons name="star" size={13} color={getStarColor(rating)} />
            <Text style={styles.badgeText}>{rating.toFixed(1)}</Text>
          </>
        ) : (
          <Text style={styles.badgeText}>New</Text>
        )}
      </View>

      {distanceBadgeText ? (
        <Pressable
          style={[styles.badge, getOverlayShadowStyle(999), styles.bottomLeftBadge]}
          onPress={(event) => {
            event.stopPropagation();
            onPressDistance?.();
          }}
          disabled={!onPressDistance}
        >
          <Text style={styles.distanceText}>{distanceBadgeText}</Text>
        </Pressable>
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
  },
  leftBadge: {
    top: 12,
    left: 12,
  },
  rightBadge: {
    top: 12,
    right: 12,
  },
  bottomLeftBadge: {
    bottom: 12,
    left: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(45,45,45,0.8)',
  },
});
