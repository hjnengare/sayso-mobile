import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Typography';
import { businessDetailColors } from '../business-detail/styles';

type Props = {
  title: string;
  rating: number;
  location: string;
  type: 'event' | 'special';
};

export function EventSpecialInfoBlock({ title, rating, location, type }: Props) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>

      <View style={styles.metaRow}>
        <View style={styles.metaPill}>
          <Ionicons name="star" size={13} color="#F59E0B" />
          <Text style={styles.metaText}>{rating > 0 ? rating.toFixed(1) : '0.0'}</Text>
        </View>

        <View style={styles.typePill}>
          <Text style={styles.typeText}>{type === 'special' ? 'Special' : 'Event'}</Text>
        </View>

        <View style={styles.locationPill}>
          <Ionicons name="location" size={13} color={businessDetailColors.charcoal} />
          <Text numberOfLines={1} style={styles.locationText}>
            {location || 'Cape Town'}
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
  typePill: {
    borderRadius: 999,
    backgroundColor: 'rgba(229,224,229,0.78)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  typeText: {
    color: businessDetailColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  locationPill: {
    maxWidth: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
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
