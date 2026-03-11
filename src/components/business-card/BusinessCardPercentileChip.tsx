import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Typography';

type Props = {
  label: 'punctuality' | 'cost-effectiveness' | 'friendliness' | 'trustworthiness';
  value?: number;
};

type IconName = ComponentProps<typeof Ionicons>['name'];

function getIconName(label: Props['label']): IconName {
  switch (label) {
    case 'punctuality':
      return 'time';
    case 'cost-effectiveness':
      return 'cash';
    case 'friendliness':
      return 'happy';
    case 'trustworthiness':
      return 'shield-checkmark';
    default:
      return 'checkmark-circle';
  }
}

function getAccessibilityLabel(label: Props['label'], value: number | undefined) {
  const title = label.replace(/-/g, ' ');
  if (!value) {
    return `${title} insights coming soon`;
  }

  return `${title} ${value} percent`;
}

export function BusinessCardPercentileChip({ label, value }: Props) {
  const isPlaceholder = !value;

  return (
    <View
      accessible
      accessibilityRole="text"
      accessibilityLabel={getAccessibilityLabel(label, value)}
      style={[styles.chip, isPlaceholder ? styles.chipPlaceholder : null]}
    >
      <Ionicons
        name={getIconName(label)}
        size={12}
        color={isPlaceholder ? 'rgba(45,45,45,0.42)' : 'rgba(45,45,45,0.74)'}
      />
      <Text style={[styles.text, isPlaceholder ? styles.textPlaceholder : null]}>
        {isPlaceholder ? '—' : `${value}%`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(45,45,45,0.045)',
  },
  chipPlaceholder: {
    backgroundColor: 'rgba(45,45,45,0.03)',
  },
  text: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(45,45,45,0.74)',
  },
  textPlaceholder: {
    color: 'rgba(45,45,45,0.42)',
  },
});
