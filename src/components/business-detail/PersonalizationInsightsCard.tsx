import { useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BusinessDetail } from '../../hooks/useBusinessDetail';
import { useUserPreferences } from '../../hooks/useUserPreferences';
import { useAuthSession } from '../../hooks/useSession';
import { calculatePersonalizationScore } from '../../lib/personalizationService';
import { Text } from '../Typography';
import { businessDetailColors, businessDetailSpacing } from './styles';

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

  const LOCKED_INSIGHTS = [
    'See how this business matches your interests',
    'Unlock personalised dealbreaker checks',
    'Get tailored recommendations just for you',
  ];

  if (isGuest) {
    return (
      <View style={styles.card}>
        <View style={styles.headingRow}>
          <View style={styles.infoIconWrap}>
            <Ionicons name="information" size={12} color={businessDetailColors.charcoal} />
          </View>
          <Text style={styles.heading}>Personalized for You</Text>
        </View>

        <View style={styles.insightsWrap}>
          {LOCKED_INSIGHTS.map((insight, index) => (
            <View key={index} style={styles.insightRow}>
              <View style={styles.lockIconWrap}>
                <Ionicons name="lock-closed" size={10} color={businessDetailColors.charcoal} />
              </View>
              <Text style={styles.lockedInsight}>{insight}</Text>
            </View>
          ))}
        </View>

        <Pressable style={styles.signInButton} onPress={onPressLogin}>
          <Text style={styles.signInText}>Sign in</Text>
        </Pressable>

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
      <View style={styles.headingRow}>
        <View style={styles.infoIconWrap}>
          <Ionicons name="information" size={12} color={businessDetailColors.charcoal} />
        </View>
        <Text style={styles.heading}>Personalized for You</Text>
      </View>

      <View style={styles.insightsWrap}>
        {positiveInsights.map((insight, index) => (
          <View key={`insight-${index}`} style={styles.insightRow}>
            <View style={styles.checkIconWrap}>
              <Ionicons name="checkmark" size={10} color={businessDetailColors.charcoal} />
            </View>
            <Text style={styles.insightText}>{insight}</Text>
          </View>
        ))}
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: businessDetailSpacing.cardRadius,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    backgroundColor: businessDetailColors.coral,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  headingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    color: businessDetailColors.white,
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
  },
  insightsWrap: {
    gap: 8,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  lockIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  lockedInsight: {
    flex: 1,
    color: 'rgba(255,255,255,0.86)',
    fontSize: 14,
    lineHeight: 20,
  },
  insightText: {
    flex: 1,
    color: businessDetailColors.white,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600',
  },
  signInButton: {
    borderRadius: 999,
    backgroundColor: businessDetailColors.white,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInText: {
    color: businessDetailColors.coral,
    fontSize: 16,
    fontWeight: '700',
  },
});
