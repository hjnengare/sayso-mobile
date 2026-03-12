import { StyleSheet, View } from 'react-native';
import { getOverlayShadowStyle } from '../../styles/overlayShadow';
import { Text } from '../Typography';
import type { EventCountdownState } from './eventCardUtils';

type Props = {
  countdown: EventCountdownState;
};

function getCountdownLabel(countdown: EventCountdownState) {
  if (countdown.status === 'live') {
    return 'Live now';
  }

  if (countdown.status === 'ended') {
    return 'Ended';
  }

  if (countdown.status === 'unknown') {
    return 'Date TBA';
  }

  const parts: string[] = [];

  if (countdown.days > 0) {
    parts.push(`${countdown.days}d`);
  }
  if (countdown.days > 0 || countdown.hours > 0) {
    parts.push(`${countdown.hours}h`);
  }
  parts.push(`${countdown.minutes}m`);

  return parts.join(' ');
}

export function EventCountdownBadge({ countdown }: Props) {
  if (!countdown.show) {
    return null;
  }

  return (
    <View
      style={[
        styles.badge,
        getOverlayShadowStyle(999),
        countdown.status === 'live' ? styles.liveBadge : null,
        countdown.status === 'ended' ? styles.endedBadge : null,
        countdown.status === 'unknown' ? styles.unknownBadge : null,
      ]}
      pointerEvents="none"
    >
      <Text
        style={[
          styles.label,
          countdown.status !== 'upcoming' ? styles.labelStatus : null,
          countdown.status === 'live' || countdown.status === 'ended' ? styles.labelInverted : null,
        ]}
      >
        {getCountdownLabel(countdown)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(229, 224, 229, 0.95)',
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  liveBadge: {
    backgroundColor: 'rgba(125,155,118,0.95)',
  },
  endedBadge: {
    backgroundColor: 'rgba(45,45,45,0.85)',
  },
  unknownBadge: {
    backgroundColor: 'rgba(229, 224, 229, 0.95)',
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(45,45,45,0.9)',
  },
  labelStatus: {
    fontWeight: '600',
  },
  labelInverted: {
    color: '#FFFFFF',
  },
});
