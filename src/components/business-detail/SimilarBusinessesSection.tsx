import { ScrollView, StyleSheet, View } from 'react-native';
import { BusinessCard } from '../BusinessCard';
import { SkeletonCard } from '../SkeletonCard';
import { Text } from '../Typography';
import { useSimilarBusinesses } from '../../hooks/useSimilarBusinesses';
import { businessDetailColors, businessDetailSpacing } from './styles';

type Props = {
  businessId: string;
};

export function SimilarBusinessesSection({ businessId }: Props) {
  const { businesses, isLoading } = useSimilarBusinesses(businessId, { limit: 3, radiusKm: 50 });

  if (!isLoading && businesses.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.titleWrap}>
        <Text style={styles.pretitle}>Similar Businesses</Text>
        <Text style={styles.title}>You Might Also Like</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rowContent}>
        {isLoading
          ? [1, 2, 3].map((item) => (
              <View key={`similar-skeleton-${item}`} style={styles.cardWrap}>
                <SkeletonCard />
              </View>
            ))
          : businesses.map((business) => (
              <BusinessCard key={`similar-business-${business.id}`} business={business} style={styles.cardWrap} />
            ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
    paddingBottom: 8,
    gap: 10,
  },
  titleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pretitle: {
    color: businessDetailColors.textSubtle,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  title: {
    color: businessDetailColors.charcoal,
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  rowContent: {
    paddingHorizontal: businessDetailSpacing.pageGutter,
    gap: 12,
    paddingBottom: 4,
  },
  cardWrap: {
    width: 320,
  },
});
