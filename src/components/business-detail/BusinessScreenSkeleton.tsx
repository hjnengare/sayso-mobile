import { ScrollView, StyleSheet, View } from 'react-native';
import { SkeletonBlock } from '../SkeletonBlock';
import { businessDetailColors, businessDetailSpacing } from './styles';

export function BusinessScreenSkeleton() {
  return (
    <>
      <View style={styles.stickyHeader}>
        <View style={styles.headerRow}>
          <SkeletonBlock style={styles.headerButton} />
          <SkeletonBlock style={styles.headerTitle} />
          <View style={styles.headerActions}>
            <SkeletonBlock style={styles.headerButton} />
            <SkeletonBlock style={styles.headerButton} />
          </View>
        </View>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mainColumn}>
          <SkeletonBlock style={styles.hero} />

          <View style={styles.card}>
            <SkeletonBlock style={styles.titleLine} />
            <SkeletonBlock style={styles.metaLine} />
            <SkeletonBlock style={styles.metaShort} />
          </View>

          <View style={styles.card}>
            <SkeletonBlock style={styles.bodyLine} />
            <SkeletonBlock style={styles.bodyLine} />
            <SkeletonBlock style={styles.bodyShort} />
          </View>

          <View style={styles.card}>
            <SkeletonBlock style={styles.rowLine} />
            <SkeletonBlock style={styles.rowLine} />
            <SkeletonBlock style={styles.rowLine} />
          </View>

          <View style={styles.card}>
            <SkeletonBlock style={styles.photoGrid} />
          </View>

          <View style={styles.card}>
            <SkeletonBlock style={styles.mapBlock} />
            <SkeletonBlock style={styles.ctaLine} />
          </View>

          <View style={styles.card}>
            <SkeletonBlock style={styles.ctaButton} />
          </View>

          <View style={styles.card}>
            <SkeletonBlock style={styles.rowLine} />
            <SkeletonBlock style={styles.rowLine} />
          </View>

          <View style={styles.card}>
            <SkeletonBlock style={styles.contactLine} />
            <SkeletonBlock style={styles.contactLine} />
            <SkeletonBlock style={styles.contactLine} />
          </View>
        </View>

        <View style={styles.fullSection}>
          <SkeletonBlock style={styles.railCard} />
          <SkeletonBlock style={styles.railCard} />
        </View>

        <View style={styles.fullSection}>
          <SkeletonBlock style={styles.reviewCard} />
          <SkeletonBlock style={styles.reviewCard} />
        </View>

        <View style={styles.fullSection}>
          <SkeletonBlock style={styles.railCard} />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  stickyHeader: {
    paddingHorizontal: businessDetailSpacing.pageGutter,
    paddingTop: 14,
    paddingBottom: 12,
    backgroundColor: businessDetailColors.coral,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.24)',
  },
  headerTitle: {
    flex: 1,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 6,
    paddingBottom: 26,
    gap: 16,
  },
  mainColumn: {
    marginHorizontal: businessDetailSpacing.pageGutter,
    gap: 14,
  },
  card: {
    borderRadius: businessDetailSpacing.cardRadius,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    backgroundColor: 'rgba(157,171,155,0.32)',
    padding: 14,
    gap: 10,
  },
  hero: {
    height: 246,
    backgroundColor: 'rgba(45,55,72,0.22)',
  },
  titleLine: {
    width: '72%',
    height: 22,
    borderRadius: 10,
  },
  metaLine: {
    width: '52%',
    height: 13,
    borderRadius: 7,
  },
  metaShort: {
    width: '35%',
    height: 12,
    borderRadius: 6,
  },
  bodyLine: {
    width: '100%',
    height: 12,
    borderRadius: 6,
  },
  bodyShort: {
    width: '76%',
    height: 12,
    borderRadius: 6,
  },
  rowLine: {
    width: '100%',
    height: 14,
    borderRadius: 7,
  },
  photoGrid: {
    width: '100%',
    height: 170,
    borderRadius: 10,
  },
  mapBlock: {
    width: '100%',
    height: 200,
    borderRadius: 10,
  },
  ctaLine: {
    width: '55%',
    height: 12,
    borderRadius: 6,
  },
  ctaButton: {
    width: '100%',
    height: 44,
    borderRadius: 999,
  },
  contactLine: {
    width: '68%',
    height: 12,
    borderRadius: 6,
  },
  fullSection: {
    marginHorizontal: businessDetailSpacing.pageGutter,
    gap: 10,
  },
  railCard: {
    width: '100%',
    height: 118,
    borderRadius: businessDetailSpacing.cardRadius,
  },
  reviewCard: {
    width: '100%',
    height: 150,
    borderRadius: businessDetailSpacing.cardRadius,
  },
});
