import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../Typography';
import { ReviewsList } from '../review-card/ReviewsList';
import type { ReviewCardData } from '../review-card/ReviewCard';
import { useBusinessReviews } from '../../hooks/useBusinessReviews';
import { businessDetailColors, businessDetailSpacing } from './styles';

type Props = {
  businessId: string;
  onPressWriteReview: () => void;
};

export function BusinessReviewsSection({ businessId, onPressWriteReview }: Props) {
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError, error, refetch } =
    useBusinessReviews(businessId);
  const reviews = data?.pages.flatMap((page) => page.data) ?? [];

  const normalized: ReviewCardData[] = reviews.map((r) => ({
    id: r.id,
    userId: r.user_id,
    rating: r.rating,
    content: r.body ?? '',
    helpfulCount: 0,
    createdAt: r.created_at,
    user: {
      id: r.user_id,
      name: r.display_name ?? r.username ?? 'Anonymous',
      avatarUrl: r.avatar_url,
    },
    images: r.images?.map((i) => i.url).filter((u): u is string => !!u) ?? [],
  }));

  return (
    <View style={styles.section}>
      <Text style={styles.label}>Community Reviews</Text>

      <ReviewsList
        reviews={normalized}
        loading={isLoading}
        error={isError ? (error instanceof Error ? error.message : 'Failed to load reviews') : null}
        emptyMessage="No reviews yet. Be the first to review this business!"
        realtimeTarget={{ type: 'business', id: businessId }}
        onUpdate={() => {
          void refetch();
        }}
        emptyStateAction={{ label: 'Write First Review', onPress: onPressWriteReview }}
      />

      {reviews.length > 0 && (
        <Pressable style={styles.writeButton} onPress={onPressWriteReview}>
          <Text style={styles.writeButtonText}>Leave a Review</Text>
        </Pressable>
      )}

      {hasNextPage && (
        <Pressable
          style={[styles.loadMoreButton, isFetchingNextPage && styles.loadMoreDisabled]}
          onPress={() => fetchNextPage()}
          disabled={isFetchingNextPage}
        >
          <Text style={styles.loadMoreText}>
            {isFetchingNextPage ? 'Loading...' : 'Load more reviews'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
    gap: 16,
    paddingHorizontal: businessDetailSpacing.pageGutter,
  },
  label: {
    color: businessDetailColors.charcoal,
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
  },
  writeButton: {
    borderRadius: 999,
    backgroundColor: businessDetailColors.coral,
    paddingVertical: 14,
    alignItems: 'center',
  },
  writeButtonText: {
    color: businessDetailColors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  loadMoreButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  loadMoreDisabled: {
    opacity: 0.7,
  },
  loadMoreText: {
    color: businessDetailColors.coral,
    fontSize: 13,
    fontWeight: '700',
  },
});
