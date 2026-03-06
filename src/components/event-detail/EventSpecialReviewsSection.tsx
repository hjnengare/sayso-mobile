import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { EventReviewItem } from '../../hooks/useEventReviews';
import { SkeletonBlock } from '../SkeletonBlock';
import { Text } from '../Typography';
import { businessDetailColors, businessDetailSpacing } from '../business-detail/styles';

type Props = {
  title?: string;
  reviews: EventReviewItem[];
  isLoading?: boolean;
  error?: string | null;
  onPressWriteReview: () => void;
};

function formatReviewDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Recently';
  }
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function EventSpecialReviewsSection({
  title = 'Community Reviews',
  reviews,
  isLoading = false,
  error,
  onPressWriteReview,
}: Props) {
  const isSpecial = title?.toLowerCase().includes('special');
  const emptyBodyText = `No reviews yet. Be the first to review this ${isSpecial ? 'special' : 'event'}!`;
  
  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeading}>{title}</Text>

      {isLoading ? (
        <View style={styles.stack}>
          <SkeletonBlock style={styles.skeletonCard} />
          <SkeletonBlock style={styles.skeletonCard} />
        </View>
      ) : error ? (
        <View style={styles.messageCard}>
          <Text style={styles.messageTitle}>Could not load reviews right now.</Text>
          <Text style={styles.messageBody}>{error}</Text>
          <Pressable style={styles.writeButton} onPress={onPressWriteReview}>
            <Text style={styles.writeButtonText}>Write Review</Text>
          </Pressable>
        </View>
      ) : reviews.length === 0 ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIconWrap}>
            <Ionicons name="chatbubble" size={24} color={businessDetailColors.charcoal} />
          </View>
          <Text style={styles.emptyTitle}>No reviews yet</Text>
          <Text style={styles.emptyBody}>{emptyBodyText}</Text>
          <Pressable style={styles.writeButton} onPress={onPressWriteReview}>
            <Text style={styles.writeButtonText}>Write First Review</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.stack}>
          {reviews.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewTopRow}>
                <Text style={styles.reviewName}>{review.user.name}</Text>
                <Text style={styles.reviewDate}>{formatReviewDate(review.createdAt)}</Text>
              </View>
              <View style={styles.reviewRatingRow}>
                <Ionicons name="star" size={13} color="#F59E0B" />
                <Text style={styles.reviewRatingText}>{review.rating.toFixed(1)}</Text>
              </View>
              <Text style={styles.reviewBody}>{review.content || 'No written review provided.'}</Text>
            </View>
          ))}
          <Pressable style={styles.writeButton} onPress={onPressWriteReview}>
            <Text style={styles.writeButtonText}>Write Review</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: businessDetailSpacing.pageGutter,
    gap: 12,
  },
  sectionHeading: {
    color: businessDetailColors.charcoal,
    fontSize: 23,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  stack: {
    gap: 10,
  },
  skeletonCard: {
    width: '100%',
    height: 140,
    borderRadius: businessDetailSpacing.cardRadius,
    backgroundColor: 'rgba(157,171,155,0.38)',
  },
  messageCard: {
    borderRadius: businessDetailSpacing.cardRadius,
    borderWidth: 1,
    borderColor: businessDetailColors.borderSoft,
    backgroundColor: businessDetailColors.cardTint,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 7,
  },
  messageTitle: {
    color: businessDetailColors.charcoal,
    fontSize: 16,
    fontWeight: '700',
  },
  messageBody: {
    color: businessDetailColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyCard: {
    borderRadius: businessDetailSpacing.cardRadius,
    borderWidth: 1,
    borderColor: businessDetailColors.borderSoft,
    backgroundColor: businessDetailColors.cardTint,
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
    gap: 10,
  },
  emptyIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,224,229,0.78)',
  },
  emptyTitle: {
    color: businessDetailColors.charcoal,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  emptyBody: {
    color: businessDetailColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    maxWidth: 280,
  },
  reviewCard: {
    borderRadius: businessDetailSpacing.cardRadius,
    borderWidth: 1,
    borderColor: businessDetailColors.borderSoft,
    backgroundColor: businessDetailColors.cardTint,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 6,
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  reviewName: {
    color: businessDetailColors.charcoal,
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  reviewDate: {
    color: businessDetailColors.textSubtle,
    fontSize: 12,
    fontWeight: '600',
  },
  reviewRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  reviewRatingText: {
    color: businessDetailColors.charcoal,
    fontSize: 12,
    fontWeight: '700',
  },
  reviewBody: {
    color: businessDetailColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  writeButton: {
    borderRadius: 999,
    backgroundColor: businessDetailColors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    marginTop: 8,
  },
  writeButtonText: {
    color: businessDetailColors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
