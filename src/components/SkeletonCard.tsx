import { StyleSheet, View } from 'react-native';
import { CardSurface } from './CardSurface';
import { CARD_CTA_RADIUS, CARD_RADIUS } from '../styles/radii';
import { SkeletonBlock } from './SkeletonBlock';

export function SkeletonCard() {
  return (
    <CardSurface radius={CARD_RADIUS} material="frosted" contentStyle={styles.frostedSurface}>
      <SkeletonBlock style={styles.image} variant="strong" />
      <View style={styles.body}>
        <SkeletonBlock style={styles.titleLine} />
        <SkeletonBlock style={styles.subtitleLine} />
        <SkeletonBlock style={styles.ratingLine} />
        <SkeletonBlock style={styles.detailLine} />
        <SkeletonBlock style={styles.cta} variant="strong" />
      </View>
    </CardSurface>
  );
}

const styles = StyleSheet.create({
  frostedSurface: {
    backgroundColor: 'rgba(157,171,155,0.72)',
    borderColor: 'rgba(255,255,255,0.34)',
  },
  image: {
    width: '100%',
    height: 220,
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    alignItems: 'center',
    backgroundColor: 'rgba(157,171,155,0.32)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.34)',
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
  detailLine: {
    height: 22,
    borderRadius: 11,
    width: '64%',
    marginTop: 10,
  },
  cta: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: CARD_CTA_RADIUS,
    width: '100%',
  },
});
