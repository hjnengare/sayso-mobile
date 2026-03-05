import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { BusinessDetail } from '../../hooks/useBusinessDetail';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { useAuthSession } from '../../hooks/useSession';
import { calculatePersonalizationScore } from '../../lib/personalizationService';
import { Text } from '../Typography';
import { businessDetailColors, businessDetailSpacing } from './styles';
import { PercentileChipsSection } from './PercentileChipsSection';

type Props = {
  business: BusinessDetail;
  onPressLogin: () => void;
};

export function PersonalizationInsightsCard({ business, onPressLogin }: Props) {
  const { user } = useAuthSession();
  const { interests, subcategories, dealbreakers } = useUserPreferences(Boolean(user));
  const isGuest = !user;

  const score = useMemo(() => {
    return calculatePersonalizationScore(
      {
        id: business.id,
        primary_category_slug: business.primary_category_slug ?? business.interest_id ?? business.interestId ?? undefined,
        primary_subcategory_slug:
          business.primary_subcategory_slug ?? business.sub_interest_id ?? business.subInterestId ?? undefined,
        interest_id: business.interest_id ?? business.interestId ?? undefined,
        sub_interest_id: business.sub_interest_id ?? business.subInterestId ?? undefined,
        category: business.category_label ?? business.category ?? undefined,
        price_range: business.price_range ?? business.priceRange ?? undefined,
        description: business.description ?? undefined,
        verified: business.verified,
        badge: business.badge ?? undefined,
        image_url: business.image_url ?? undefined,
        uploaded_images: business.uploaded_images ?? undefined,
        average_rating: business.stats?.average_rating ?? business.rating ?? undefined,
        total_reviews: business.stats?.total_reviews ?? business.reviews ?? undefined,
        percentiles: business.stats?.percentiles ?? undefined,
      },
      {
        interestIds: interests.map((item) => item.id),
        subcategoryIds: subcategories.map((item) => item.id),
        dealbreakerIds: dealbreakers.map((item) => item.id),
      }
    );
  }, [business, interests, subcategories, dealbreakers]);

  if (isGuest) {
    return (
      <View style={styles.card}>
        <Text style={styles.heading}>Personalized for You</Text>

        <View style={styles.insightsWrap}>
          <Text style={styles.lockedInsight}>Sign in to see how this matches your interests</Text>
          <Text style={styles.lockedInsight}>Sign in to unlock personalized dealbreaker checks</Text>
          <Text style={styles.lockedInsight}>Sign in to get your tailored recommendations</Text>
        </View>

        <Pressable style={styles.signInButton} onPress={onPressLogin}>
          <Text style={styles.signInText}>Sign in</Text>
        </Pressable>

        <PercentileChipsSection
          punctuality={business.stats?.percentiles?.punctuality}
          costEffectiveness={business.stats?.percentiles?.['cost-effectiveness']}
          friendliness={business.stats?.percentiles?.friendliness}
          trustworthiness={business.stats?.percentiles?.trustworthiness}
        />
      </View>
    );
  }

  const hasPreferences = interests.length > 0 || subcategories.length > 0 || dealbreakers.length > 0;
  if (!hasPreferences) {
    return null;
  }

  const positiveInsights = score.insights
    .filter((insight) => insight.trim().length > 0)
    .filter((insight) => !insight.toLowerCase().startsWith('may not match'));

  if (positiveInsights.length === 0) {
    return null;
  }

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Personalized for You</Text>

      <View style={styles.insightsWrap}>
        {positiveInsights.map((insight, index) => (
          <Text key={`insight-${index}`} style={styles.insightText}>
            {insight}
          </Text>
        ))}
      </View>

      <PercentileChipsSection
        punctuality={business.stats?.percentiles?.punctuality}
        costEffectiveness={business.stats?.percentiles?.['cost-effectiveness']}
        friendliness={business.stats?.percentiles?.friendliness}
        trustworthiness={business.stats?.percentiles?.trustworthiness}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: businessDetailSpacing.cardRadius,
    borderWidth: 1,
    borderColor: businessDetailColors.borderSoft,
    backgroundColor: businessDetailColors.cardTint,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  heading: {
    color: businessDetailColors.charcoal,
    fontSize: 19,
    fontWeight: '700',
  },
  insightsWrap: {
    gap: 7,
  },
  lockedInsight: {
    color: businessDetailColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  insightText: {
    color: businessDetailColors.charcoal,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  signInButton: {
    borderRadius: 999,
    backgroundColor: businessDetailColors.coral,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInText: {
    color: businessDetailColors.white,
    fontSize: 13,
    fontWeight: '700',
  },
});
