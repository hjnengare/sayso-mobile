import { StyleSheet, View } from 'react-native';
import { Text } from '../Typography';
import { businessDetailColors } from './styles';

type Props = {
  punctuality?: number;
  costEffectiveness?: number;
  friendliness?: number;
  trustworthiness?: number;
};

function normalizeValue(value?: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function PercentileChipsSection({
  punctuality,
  costEffectiveness,
  friendliness,
  trustworthiness,
}: Props) {
  const chips = [
    { key: 'punctuality', label: 'Punctuality', value: normalizeValue(punctuality) },
    { key: 'cost-effectiveness', label: 'Value', value: normalizeValue(costEffectiveness) },
    { key: 'friendliness', label: 'Friendliness', value: normalizeValue(friendliness) },
    { key: 'trustworthiness', label: 'Trust', value: normalizeValue(trustworthiness) },
  ];

  return (
    <View style={styles.wrap}>
      <Text style={styles.caption}>Based on reviews</Text>
      <View style={styles.chipRow}>
        {chips.map((chip) => (
          <View key={chip.key} style={styles.chip}>
            <Text style={styles.chipValue}>{chip.value}%</Text>
            <Text style={styles.chipLabel}>{chip.label}</Text>
          </View>
        ))}
      </View>
      <Text style={styles.footer}>Community verified metrics from submitted reviews</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  caption: {
    color: businessDetailColors.textSubtle,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.7,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    minWidth: 74,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(229,224,229,0.68)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  chipValue: {
    color: businessDetailColors.charcoal,
    fontSize: 14,
    fontWeight: '800',
  },
  chipLabel: {
    color: businessDetailColors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  footer: {
    color: businessDetailColors.textSubtle,
    fontSize: 11,
    lineHeight: 16,
  },
});
