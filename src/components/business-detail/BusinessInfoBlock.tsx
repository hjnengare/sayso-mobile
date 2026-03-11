import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Typography';
import { businessDetailColors } from './styles';

type Props = {
  name: string;
  rating: number;
  category: string;
  location: string;
};

function getStarColor(rating: number): string {
  if (rating > 4.0) return '#E6A547';
  if (rating > 2.0) return '#D4915C';
  return '#D66B6B';
}

export function BusinessInfoBlock({ name, rating, category, location }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{name}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <Ionicons name="star" size={13} color={getStarColor(rating)} />
          <Text style={styles.metaText}>{rating > 0 ? rating.toFixed(1) : '0.0'}</Text>
        </View>

        <View style={styles.categoryPill}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>

        <View style={styles.locationPill}>
          <Ionicons name="location" size={13} color={businessDetailColors.charcoal} />
          <Text style={styles.locationText} numberOfLines={1}>
            {location}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  title: {
    color: businessDetailColors.charcoal,
    fontSize: 29,
    lineHeight: 34,
    fontWeight: '800',
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    backgroundColor: 'rgba(229,224,229,0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  metaText: {
    color: businessDetailColors.charcoal,
    fontSize: 12,
    fontWeight: '700',
  },
  categoryPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(229,224,229,0.78)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  categoryText: {
    color: businessDetailColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  locationPill: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(229,224,229,0.78)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  locationText: {
    color: businessDetailColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 220,
  },
});
