import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Typography';
import { businessDetailColors, businessDetailSpacing } from './styles';
import { calculateOpenStatus, getHoursRows, normalizeHours, normalizePriceRange } from './utils';

type Props = {
  priceRange?: string | null;
  verified?: boolean;
  hours?: Record<string, string> | string | null;
  openingHours?: Record<string, string> | string | null;
  opening_hours?: Record<string, string> | string | null;
};

export function BusinessDetailsCard({ priceRange, verified, hours, openingHours, opening_hours }: Props) {
  const [expanded, setExpanded] = useState(false);

  const normalizedHours = useMemo(
    () => normalizeHours(hours ?? opening_hours ?? openingHours ?? null),
    [hours, openingHours, opening_hours]
  );
  const rows = useMemo(() => getHoursRows(normalizedHours), [normalizedHours]);
  const openStatus = useMemo(() => calculateOpenStatus(normalizedHours), [normalizedHours]);
  const priceInfo = useMemo(() => normalizePriceRange(priceRange ?? undefined), [priceRange]);

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Business Details</Text>

      <View style={styles.row}>
        <View style={styles.iconPill}>
          <Ionicons name="cash" size={15} color={businessDetailColors.charcoal} />
        </View>
        <View style={styles.valueWrap}>
          <Text style={styles.label}>Price Range</Text>
          {priceInfo ? (
            <View style={styles.inlineValue}>
              <Text style={styles.valueStrong}>{priceInfo.display}</Text>
              {priceInfo.description ? <Text style={styles.valueHint}>- {priceInfo.description}</Text> : null}
            </View>
          ) : (
            <Text style={styles.valueFallback}>Coming soon</Text>
          )}
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.iconPill}>
          <Ionicons name="time" size={15} color={businessDetailColors.charcoal} />
        </View>
        <View style={styles.valueWrap}>
          <View style={styles.hoursHeader}>
            <Text style={styles.label}>Hours</Text>
            {rows.length > 0 ? (
              <Pressable style={styles.hoursToggle} onPress={() => setExpanded((current) => !current)}>
                <Text style={styles.hoursToggleText}>{expanded ? 'Hide' : 'See all'}</Text>
                <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={businessDetailColors.textMuted} />
              </Pressable>
            ) : null}
          </View>

          {rows.length > 0 ? (
            <View style={styles.openStatusWrap}>
              <View style={[styles.openBadge, openStatus.isOpen ? styles.openBadgeOpen : styles.openBadgeClosed]}>
                <View style={[styles.openDot, openStatus.isOpen ? styles.openDotOpen : styles.openDotClosed]} />
                <Text style={[styles.openBadgeText, openStatus.isOpen ? styles.openBadgeTextOpen : styles.openBadgeTextClosed]}>
                  {openStatus.isOpen ? 'Open' : 'Closed'}
                </Text>
              </View>
              <Text style={styles.openStatusText}>{openStatus.status}</Text>
            </View>
          ) : (
            <Text style={styles.valueFallback}>Hours coming soon</Text>
          )}

          {expanded ? (
            <View style={styles.hoursList}>
              {rows.map((row) => (
                <View key={row.key} style={[styles.hoursRow, row.isToday ? styles.hoursRowToday : null]}>
                  <Text style={[styles.hoursDay, row.isToday ? styles.hoursDayToday : null]}>
                    {row.label}
                    {row.isToday ? ' (Today)' : ''}
                  </Text>
                  <Text style={[styles.hoursValue, row.isToday ? styles.hoursValueToday : null]}>{row.value}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.iconPill}>
          <Ionicons name={verified ? 'checkmark-circle' : 'close-circle'} size={15} color={businessDetailColors.charcoal} />
        </View>
        <View style={styles.valueWrap}>
          <Text style={styles.label}>Verification</Text>
          <Text style={verified ? styles.valueVerified : styles.valueFallback}>
            {verified ? 'Verified business' : 'Verification pending'}
          </Text>
        </View>
      </View>
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
    gap: 14,
  },
  heading: {
    color: businessDetailColors.charcoal,
    fontSize: 19,
    fontWeight: '700',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconPill: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,224,229,0.75)',
  },
  valueWrap: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: businessDetailColors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
  },
  inlineValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  valueStrong: {
    color: businessDetailColors.charcoal,
    fontSize: 14,
    fontWeight: '700',
  },
  valueHint: {
    color: businessDetailColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  valueFallback: {
    color: businessDetailColors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
  valueVerified: {
    color: businessDetailColors.sage,
    fontSize: 13,
    fontWeight: '700',
  },
  hoursHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  hoursToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  hoursToggleText: {
    color: businessDetailColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  openStatusWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  openBadge: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  openBadgeOpen: {
    backgroundColor: 'rgba(125,155,118,0.2)',
  },
  openBadgeClosed: {
    backgroundColor: 'rgba(114,47,55,0.2)',
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
  },
  openDotOpen: {
    backgroundColor: businessDetailColors.sage,
  },
  openDotClosed: {
    backgroundColor: businessDetailColors.coral,
  },
  openBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  openBadgeTextOpen: {
    color: businessDetailColors.sage,
  },
  openBadgeTextClosed: {
    color: businessDetailColors.coral,
  },
  openStatusText: {
    color: businessDetailColors.textMuted,
    fontSize: 12,
  },
  hoursList: {
    marginTop: 4,
    gap: 4,
  },
  hoursRow: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  hoursRowToday: {
    backgroundColor: 'rgba(229,224,229,0.46)',
  },
  hoursDay: {
    color: businessDetailColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  hoursDayToday: {
    color: businessDetailColors.charcoal,
    fontWeight: '700',
  },
  hoursValue: {
    color: businessDetailColors.textMuted,
    fontSize: 12,
  },
  hoursValueToday: {
    color: businessDetailColors.charcoal,
    fontWeight: '700',
  },
});
