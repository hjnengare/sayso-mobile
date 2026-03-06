import { Pressable, StyleSheet, View } from 'react-native';
import type { EventSpecialOccurrence } from '../../hooks/useEventSpecialDetail';
import { Text } from '../Typography';
import { businessDetailColors, businessDetailSpacing } from '../business-detail/styles';

type Props = {
  currentStartISO?: string;
  currentEndISO?: string;
  occurrences: EventSpecialOccurrence[];
  onPressDate: (occurrenceId: string) => void;
};

function parseDate(value?: string) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function toLabel(startISO?: string, endISO?: string) {
  const start = parseDate(startISO);
  if (!start) return null;

  const startLabel = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const end = parseDate(endISO);
  if (!end) return startLabel;

  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  if (sameDay) return startLabel;

  const endLabel = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${startLabel} - ${endLabel}`;
}

export function EventSpecialMoreDatesCard({
  currentStartISO,
  currentEndISO,
  occurrences,
  onPressDate,
}: Props) {
  const currentLabel = toLabel(currentStartISO, currentEndISO);

  const unique = occurrences.reduce<Array<{ id: string; label: string }>>((acc, row) => {
    const label = toLabel(row.startDateISO, row.endDateISO);
    if (!label) return acc;
    if (label === currentLabel) return acc;
    if (acc.some((item) => item.label === label)) return acc;
    acc.push({ id: row.id, label });
    return acc;
  }, []);

  if (unique.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>More dates</Text>

      {unique.map((item) => (
        <View key={item.id} style={styles.row}>
          <Text style={styles.dateText}>{item.label}</Text>
          <Pressable onPress={() => onPressDate(item.id)}>
            <Text style={styles.viewText}>View</Text>
          </Pressable>
        </View>
      ))}
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
  },
  row: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateText: {
    color: businessDetailColors.textMuted,
    fontSize: 14,
    flex: 1,
  },
  viewText: {
    color: businessDetailColors.coral,
    fontSize: 14,
    fontWeight: '700',
  },
});
