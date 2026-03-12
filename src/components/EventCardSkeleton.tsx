import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CARD_CTA_RADIUS, CARD_RADIUS } from '../styles/radii';
import { SkeletonBlock } from './SkeletonBlock';

type Props = {
  style?: StyleProp<ViewStyle>;
};

const CARD_GRADIENT = ['#9DAB9B', '#9DAB9B', 'rgba(157,171,155,0.95)'] as const;

export function EventCardSkeleton({ style }: Props) {
  return (
    <View style={[styles.card, style]}>
      <LinearGradient colors={CARD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardSurface}>
        <SkeletonBlock style={styles.media} variant="strong">
          <SkeletonBlock style={styles.ribbon} variant="soft" />
          <SkeletonBlock style={styles.ratingBadge} />
        </SkeletonBlock>
        <View style={styles.body}>
          <SkeletonBlock style={styles.title} />
          <SkeletonBlock style={styles.descriptionLineLarge} />
          <SkeletonBlock style={styles.descriptionLineSmall} />
          <View style={styles.pillRow}>
            <SkeletonBlock style={styles.pill} />
            <SkeletonBlock style={styles.pillShort} />
          </View>
          <SkeletonBlock style={styles.reviewCount} />
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
  media: {
    height: 280,
  },
  ribbon: {
    position: 'absolute',
    left: -42,
    top: 18,
    width: 180,
    height: 28,
    borderRadius: 8,
    transform: [{ rotate: '-44deg' }],
  },
  ratingBadge: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 52,
    height: 28,
    borderRadius: 999,
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
    backgroundColor: 'rgba(157,171,155,0.10)',
  },
  title: {
    height: 18,
    borderRadius: 8,
    width: '76%',
  },
  descriptionLineLarge: {
    height: 12,
    borderRadius: 6,
    width: '100%',
    marginTop: 9,
  },
  descriptionLineSmall: {
    height: 12,
    borderRadius: 6,
    width: '72%',
    marginTop: 7,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  pill: {
    width: 118,
    height: 28,
    borderRadius: 999,
  },
  pillShort: {
    width: 86,
    height: 28,
    borderRadius: 999,
  },
  reviewCount: {
    width: 92,
    height: 14,
    borderRadius: 7,
    alignSelf: 'center',
    marginTop: 12,
  },
  cta: {
    minHeight: 46,
    borderRadius: CARD_CTA_RADIUS,
    marginTop: 12,
  },
});
