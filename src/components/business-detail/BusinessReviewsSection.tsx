import { Pressable, StyleSheet, View } from 'react-native';
import { CardSurface } from '../CardSurface';
import { StarRating } from '../StarRating';
import { Text } from '../Typography';
import { useBusinessReviews } from '../../hooks/useBusinessReviews';
import { CARD_RADIUS } from '../../styles/radii';
import { businessDetailColors, businessDetailSpacing } from './styles';

type Props = {
  businessId: string;
  onPressWriteReview: () => void;
};

function formatDate(value: string) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return 'Recently';
  }
  return parsed.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function BusinessReviewsSection({ businessId, onPressWriteReview }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useBusinessReviews(businessId);
  const reviews = data?.pages.flatMap((page) => page.data) ?? [];

  return (
    <View style={styles.section}>
      <View style={styles.titleWrap}>
        <Text style={styles.label}>Community Reviews</Text>
      </View>

      <View style={styles.cardWrap}>
        {isLoading ? (
          <Text style={styles.loadingText}>Loading reviews...</Text>
        ) : reviews.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No reviews yet</Text>
            <Text style={styles.emptyBody}>Be the first to review this business.</Text>
            <Pressable style={styles.emptyAction} onPress={onPressWriteReview}>
              <Text style={styles.emptyActionText}>Write First Review</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.reviewsStack}>
            {reviews.map((review) => (
              <CardSurface key={review.id} radius={CARD_RADIUS} contentStyle={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerWrap}>
                    <View style={styles.reviewerAvatar}>
                      <Text style={styles.reviewerAvatarText}>
                        {(review.display_name || review.username || 'U').slice(0, 1).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.reviewerName}>{review.display_name || review.username || 'Anonymous'}</Text>
                      <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
                    </View>
                  </View>
                  <StarRating value={review.rating} size={13} />
                </View>
                {review.body ? <Text style={styles.reviewBody}>{review.body}</Text> : null}
              </CardSurface>
            ))}

            <Pressable style={styles.writeReviewButton} onPress={onPressWriteReview}>
              <Text style={styles.writeReviewButtonText}>Leave a Review</Text>
            </Pressable>

            {hasNextPage ? (
              <Pressable
                style={[styles.loadMoreButton, isFetchingNextPage ? styles.loadMoreButtonDisabled : null]}
                onPress={() => fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                <Text style={styles.loadMoreText}>{isFetchingNextPage ? 'Loading...' : 'Load more reviews'}</Text>
              </Pressable>
            ) : (
              <Text style={styles.reviewCountText}>
                Showing {reviews.length} review{reviews.length === 1 ? '' : 's'}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
    gap: 12,
  },
  titleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: businessDetailColors.charcoal,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  cardWrap: {
    marginHorizontal: businessDetailSpacing.pageGutter,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
    backgroundColor: businessDetailColors.cardTint,
    paddingHorizontal: 10,
    paddingVertical: 10,
  },
  loadingText: {
    color: businessDetailColors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  emptyWrap: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 18,
    paddingHorizontal: 10,
  },
  emptyTitle: {
    color: businessDetailColors.charcoal,
    fontSize: 17,
    fontWeight: '700',
  },
  emptyBody: {
    color: businessDetailColors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  emptyAction: {
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: businessDetailColors.coral,
    paddingHorizontal: 18,
    paddingVertical: 11,
  },
  emptyActionText: {
    color: businessDetailColors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  reviewsStack: {
    gap: 9,
  },
  reviewCard: {
    paddingHorizontal: 12,
    paddingVertical: 11,
    gap: 8,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  reviewerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  reviewerAvatar: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,224,229,0.8)',
  },
  reviewerAvatarText: {
    color: businessDetailColors.charcoal,
    fontSize: 13,
    fontWeight: '700',
  },
  reviewerName: {
    color: businessDetailColors.charcoal,
    fontSize: 13,
    fontWeight: '700',
  },
  reviewDate: {
    color: businessDetailColors.textSubtle,
    fontSize: 11,
  },
  reviewBody: {
    color: businessDetailColors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  writeReviewButton: {
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: businessDetailColors.coral,
    paddingVertical: 12,
    alignItems: 'center',
  },
  writeReviewButtonText: {
    color: businessDetailColors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  loadMoreButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  loadMoreButtonDisabled: {
    opacity: 0.7,
  },
  loadMoreText: {
    color: businessDetailColors.coral,
    fontSize: 13,
    fontWeight: '700',
  },
  reviewCountText: {
    color: businessDetailColors.textSubtle,
    fontSize: 12,
    textAlign: 'center',
    paddingTop: 2,
  },
});
