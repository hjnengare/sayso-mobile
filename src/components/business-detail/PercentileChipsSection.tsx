import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Typography';
import { businessDetailColors } from './styles';

type Props = {
  punctuality?: number;
  costEffectiveness?: number;
  friendliness?: number;
  trustworthiness?: number;
};

function normalizeValue(value?: number): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value) || value === 0) {
    return null;
  }
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getValueColor(value: number | null): string {
  if (value === null) return 'rgba(45,55,72,0.25)';
  if (value >= 80) return '#2E7D32';
  if (value >= 60) return '#7D9B76';
  if (value >= 40) return '#F59E0B';
  return '#C0392B';
}

type Metric = {
  key: string;
  label: string;
  value: number | null;
  icon: React.ComponentProps<typeof Ionicons>['name'] | null;
  customIcon?: string;
};

export function PercentileChipsSection({
  punctuality,
  costEffectiveness,
  friendliness,
  trustworthiness,
}: Props) {
  const metrics: Metric[] = [
    { key: 'punctuality', label: 'Punctuality', value: normalizeValue(punctuality), icon: 'time' },
    { key: 'cost', label: 'Value for Money', value: normalizeValue(costEffectiveness), icon: null, customIcon: 'R' },
    { key: 'friendliness', label: 'Friendliness', value: normalizeValue(friendliness), icon: 'happy' },
    { key: 'trustworthiness', label: 'Trustworthiness', value: normalizeValue(trustworthiness), icon: 'shield-checkmark' },
  ];

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.title}>Performance Insights</Text>
        <Text style={styles.caption}>Based on reviews</Text>
      </View>

      <View style={styles.grid}>
        {metrics.map((metric) => {
          const color = getValueColor(metric.value);
          const isEmpty = metric.value === null;

          return (
            <View key={metric.key} style={styles.chip}>
              {metric.icon ? (
                <Ionicons name={metric.icon} size={24} color={color} />
              ) : (
                <Text style={[styles.customIcon, { color }]}>{metric.customIcon}</Text>
              )}
              <Text style={styles.chipLabel}>{metric.label}</Text>
              <Text style={[styles.chipValue, { color: isEmpty ? 'rgba(45,55,72,0.25)' : businessDetailColors.charcoal }]}>
                {isEmpty ? '—' : `${metric.value}%`}
              </Text>
            </View>
          );
        })}
      </View>

      <View style={styles.footerRow}>
        <Ionicons name="checkmark-circle" size={12} color={businessDetailColors.sage} />
        <Text style={styles.footer}>Community verified metrics from verified reviews</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: businessDetailColors.charcoal,
    fontSize: 20,
    fontWeight: '700',
  },
  caption: {
    color: businessDetailColors.textSubtle,
    fontSize: 12,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'column',
    gap: 8,
  },
  chip: {
    width: '100%',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.38)',
    alignItems: 'center',
    gap: 8,
  },
  customIcon: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 26,
  },
  chipLabel: {
    color: businessDetailColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  chipValue: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
    color: businessDetailColors.textMuted,
  },
  footerRow: {
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.34)',
    paddingTop: 10,
  },
  footer: {
    color: businessDetailColors.textSubtle,
    fontSize: 11,
    lineHeight: 16,
  },
});
