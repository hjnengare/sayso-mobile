import { ScrollView, StyleSheet, View } from 'react-native';
import { SkeletonBlock } from '../SkeletonBlock';
import { businessDetailSpacing } from '../business-detail/styles';

export function EventSpecialSkeleton() {
  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.column}>
        <SkeletonBlock style={styles.hero} />
        <SkeletonBlock style={styles.title} />
        <SkeletonBlock style={styles.meta} />

        <SkeletonBlock style={styles.cardLarge} />
        <SkeletonBlock style={styles.cardMedium} />
        <SkeletonBlock style={styles.cardMedium} />
        <SkeletonBlock style={styles.cardLarge} />
      </View>

      <View style={styles.fullWidth}>
        <SkeletonBlock style={styles.fullCard} />
        <SkeletonBlock style={styles.fullCard} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingTop: 8,
    paddingBottom: 26,
    gap: 12,
  },
  column: {
    marginHorizontal: businessDetailSpacing.pageGutter,
    gap: 10,
  },
  hero: {
    width: '100%',
    height: 286,
    borderRadius: 10,
  },
  title: {
    width: '86%',
    height: 32,
    borderRadius: 12,
  },
  meta: {
    width: '66%',
    height: 22,
    borderRadius: 999,
  },
  cardLarge: {
    width: '100%',
    height: 190,
    borderRadius: 12,
  },
  cardMedium: {
    width: '100%',
    height: 160,
    borderRadius: 12,
  },
  fullWidth: {
    marginHorizontal: businessDetailSpacing.pageGutter,
    gap: 10,
  },
  fullCard: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
});
