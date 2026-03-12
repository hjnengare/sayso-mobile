import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CARD_CTA_RADIUS, CARD_RADIUS } from '../styles/radii';
import { SkeletonBlock } from './SkeletonBlock';

const CARD_GRADIENT = ['#9DAB9B', '#9DAB9B', 'rgba(157,171,155,0.95)'] as const;

export function SkeletonCard() {
  return (
    <View style={styles.card}>
      <LinearGradient colors={CARD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardSurface}>
        <SkeletonBlock style={styles.image} variant="strong">
          <SkeletonBlock style={styles.badge} variant="soft" />
          <SkeletonBlock style={styles.ratingBadge} />
        </SkeletonBlock>
        <View style={styles.body}>
          <SkeletonBlock style={styles.titleLine} />
          <SkeletonBlock style={styles.subtitleLine} />
          <SkeletonBlock style={styles.ratingLine} />
          <View style={styles.pillRow}>
            <SkeletonBlock style={styles.pill} />
            <SkeletonBlock style={[styles.pill, styles.pillShort]} />
          </View>
          <SkeletonBlock style={styles.cta} variant="strong" />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#9DAB9B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  cardSurface: {
    width: '100%',
  },
  image: {
    position: 'relative',
    width: '100%',
    height: 280,
  },
  badge: {
    position: 'absolute',
    top: 14,
    left: 14,
    width: 22,
    height: 22,
    borderRadius: 999,
  },
  ratingBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 56,
    height: 28,
    borderRadius: 999,
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(157,171,155,0.10)',
  },
  titleLine: {
    height: 22,
    borderRadius: 10,
    width: '76%',
  },
  subtitleLine: {
    height: 13,
    borderRadius: 6,
    width: '52%',
    marginTop: 9,
  },
  ratingLine: {
    height: 12,
    borderRadius: 6,
    width: '34%',
    marginTop: 8,
  },
  pillRow: {
    width: '100%',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  pill: {
    height: 22,
    borderRadius: 11,
    width: 118,
  },
  pillShort: {
    width: 82,
  },
  cta: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: CARD_CTA_RADIUS,
    width: '100%',
  },
});
