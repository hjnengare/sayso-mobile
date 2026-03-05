import { StyleSheet, View } from 'react-native';
import { FROSTED_CARD_BORDER_COLOR } from '../../styles/cardSurface';
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
    left: -10,
    top: -8,
    width: 150,
    height: 108,
    overflow: 'hidden',
  },
  ribbon: {
    position: 'absolute',
    left: -44,
    top: 22,
    width: 228,
    paddingVertical: 7,
    paddingHorizontal: 18,
    backgroundColor: NAVBAR_BG_90,
    borderWidth: 1,
    borderColor: FROSTED_CARD_BORDER_COLOR,
    transform: [{ rotate: '-44deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
});
