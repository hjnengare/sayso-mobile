import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getOverlayShadowStyle } from '../../styles/overlayShadow';
import { Text } from '../Typography';

type Props = {
  rating: number;
};

export function EventRatingBadge({ rating }: Props) {
  return (
    <View style={[styles.badge, getOverlayShadowStyle(999)]} pointerEvents="none">
      <Ionicons name="star" size={15} color="#B7791F" />
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
    backgroundColor: 'rgba(247, 250, 252, 0.94)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2D2D2D',
  },
});
