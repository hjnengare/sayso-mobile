import { StyleSheet, View } from 'react-native';
import type { EventSpecialListItemDto } from '@sayso/contracts';
import { Text } from '../Typography';

type Props = {
  item: EventSpecialListItemDto;
};

type PillTone = 'sage' | 'coral' | 'amber';

type Pill = {
  label: string;
  tone: PillTone;
};

function getPills(item: EventSpecialListItemDto): Pill[] {
  const pills: Pill[] = [];

  if (typeof item.occurrencesCount === 'number' && item.occurrencesCount > 1) {
    pills.push({
      label: `${item.occurrencesCount} dates available`,
      tone: 'sage',
    });
  }

  if (item.type === 'event' && !item.businessId && !item.isExternalEvent) {
    pills.push({
      label: 'Community-hosted event',
      tone: 'coral',
    });
  }

  if (item.availabilityStatus === 'sold_out') {
    pills.push({
      label: 'Sold Out',
      tone: 'coral',
    });
  } else if (item.availabilityStatus === 'limited') {
    pills.push({
      label: 'Limited Spots',
      tone: 'amber',
    });
  }

  return pills;
}

export function EventStatusPills({ item }: Props) {
  const pills = getPills(item);

  return (
    <View style={styles.wrap}>
      {pills.map((pill, index) => (
        <View
          key={`${pill.label}-${index}`}
          style={[
            styles.pill,
            pill.tone === 'sage' ? styles.sagePill : null,
            pill.tone === 'coral' ? styles.coralPill : null,
            pill.tone === 'amber' ? styles.amberPill : null,
          ]}
        >
          <Text
            style={[
              styles.pillLabel,
              pill.tone === 'sage' ? styles.sageLabel : null,
              pill.tone === 'coral' ? styles.coralLabel : null,
              pill.tone === 'amber' ? styles.amberLabel : null,
            ]}
          >
            {pill.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
    minHeight: 26,
  },
  pill: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  sagePill: {
    backgroundColor: 'rgba(157,171,155,0.10)',
  },
  sageLabel: {
    color: '#7D9B76',
  },
  coralPill: {
    backgroundColor: 'rgba(114,47,55,0.10)',
  },
  coralLabel: {
    color: '#722F37',
  },
  amberPill: {
    backgroundColor: 'rgba(217, 119, 6, 0.12)',
  },
  amberLabel: {
    color: '#B45309',
  },
});
