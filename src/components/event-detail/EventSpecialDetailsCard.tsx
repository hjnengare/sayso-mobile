import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { EventSpecialDetail } from '../../hooks/useEventSpecialDetail';
import { Text } from '../Typography';
import { businessDetailColors, businessDetailSpacing } from '../business-detail/styles';

type Props = {
  item: EventSpecialDetail;
};

function formatVenueLocation(item: EventSpecialDetail) {
  const line = [item.venueName, item.city, item.country].filter(Boolean).join(' - ');
  return line || item.location || 'Location to be announced';
}

export function EventSpecialDetailsCard({ item }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{item.type === 'special' ? 'Special Details' : 'Event Details'}</Text>

      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="calendar" size={15} color={businessDetailColors.charcoal} />
        </View>
        <View style={styles.copyWrap}>
          <Text style={styles.label}>{item.type === 'special' ? 'Valid from' : 'Date'}</Text>
          <Text style={styles.value}>{item.startDate || 'Date TBA'}</Text>
          {item.endDate ? <Text style={styles.subValue}>to {item.endDate}</Text> : null}
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.iconWrap}>
          <Ionicons name="people" size={15} color={businessDetailColors.charcoal} />
        </View>
        <View style={styles.copyWrap}>
          <Text style={styles.label}>Venue</Text>
          <Text style={styles.value}>{formatVenueLocation(item)}</Text>
        </View>
      </View>

      {item.price ? (
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Text style={styles.rIcon}>R</Text>
          </View>
          <View style={styles.copyWrap}>
            <Text style={styles.label}>Price</Text>
            <Text style={styles.value}>{item.price}</Text>
          </View>
        </View>
      ) : null}

      {item.occurrencesCount && item.occurrencesCount > 1 ? (
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name="repeat" size={15} color={businessDetailColors.charcoal} />
          </View>
          <View style={styles.copyWrap}>
            <Text style={styles.label}>Occurrences</Text>
            <Text style={styles.value}>{item.occurrencesCount} dates</Text>
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: businessDetailSpacing.cardRadius,
    borderWidth: 1,
    borderColor: businessDetailColors.borderSoft,
    backgroundColor: businessDetailColors.cardTint,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  heading: {
    color: businessDetailColors.charcoal,
    fontSize: 19,
    fontWeight: '700',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,224,229,0.74)',
    marginTop: 2,
  },
  copyWrap: {
    flex: 1,
  },
  label: {
    color: businessDetailColors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
  },
  value: {
    color: businessDetailColors.charcoal,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 1,
  },
  subValue: {
    color: businessDetailColors.textMuted,
    fontSize: 13,
    marginTop: 1,
  },
  rIcon: {
    color: businessDetailColors.charcoal,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
});
