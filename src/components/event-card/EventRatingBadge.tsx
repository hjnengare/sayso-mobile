import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getOverlayShadowStyle } from '../../styles/overlayShadow';
import { Text } from '../Typography';

type Props = {
  rating: number;
};

function getStarColor(value: number) {
  if (value > 4.0) return '#E6A547';
  if (value > 2.0) return '#D4915C';
  return '#D66B6B';
}

export function EventRatingBadge({ rating }: Props) {
  return (
    <View style={[styles.badge, getOverlayShadowStyle(999)]} pointerEvents="none">
      <Ionicons name="star" size={14} color={getStarColor(rating)} />
      <Text style={styles.label}>{rating.toFixed(1)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    right: 14,
    top: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(229, 224, 229, 0.95)',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2D2D2D',
  },
});
