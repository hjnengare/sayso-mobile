import { StyleSheet, View } from 'react-native';
import { NAVBAR_BG_90 } from '../../styles/colors';
import { getOverlayShadowStyle } from '../../styles/overlayShadow';
import { Text } from '../Typography';

type Props = {
  label: string | null;
};

export function EventDateRibbon({ label }: Props) {
  if (!label) {
    return null;
  }

  return (
    <View style={styles.wrap} pointerEvents="none">
      <View style={[styles.ribbon, getOverlayShadowStyle(18)]}>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: -1,
    top: -1,
    width: 150,
    height: 120,
    overflow: 'hidden',
  },
  ribbon: {
    position: 'absolute',
    left: -40,
    top: 22,
    width: 250,
    paddingVertical: 9,
    paddingHorizontal: 18,
    backgroundColor: NAVBAR_BG_90,
    transform: [{ rotate: '-50deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
});
