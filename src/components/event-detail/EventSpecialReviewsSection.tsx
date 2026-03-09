import { Pressable, StyleSheet, View } from 'react-native';
import type { EventReviewItem } from '../../hooks/useEventReviews';
import { ReviewsList } from '../review-card/ReviewsList';
import type { ReviewCardData } from '../review-card/ReviewCard';
import { Text } from '../Typography';
import { businessDetailColors, businessDetailSpacing } from '../business-detail/styles';

type Props = {
  title?: string;
  targetId: string;
  reviews: EventReviewItem[];
  isLoading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  onPressWriteReview: () => void;
};

export function EventSpecialReviewsSection({
  title = 'Community Reviews',
  targetId,
  reviews,
  isLoading = false,
  error,
  onRefresh,
  onPressWriteReview,
}: Props) {
  const isSpecial = title?.toLowerCase().includes('special');
  const emptyMessage = `No reviews yet. Be the first to review this ${isSpecial ? 'special' : 'event'}!`;

  const normalized: ReviewCardData[] = reviews.map((r) => ({
    id: r.id,
    userId: r.userId,
    rating: r.rating,
    title: r.title,
    content: r.content,
    tags: r.tags,
    helpfulCount: r.helpfulCount,
    createdAt: r.createdAt,
    user: {
      id: r.user.id,
      name: r.user.name,
      avatarUrl: r.user.avatarUrl,
    },
    images: r.images,
  }));

  return (
    <View style={styles.section}>
      <Text style={styles.sectionHeading}>{title}</Text>

      <ReviewsList
        reviews={normalized}
        loading={isLoading}
        error={error}
        emptyMessage={emptyMessage}
        realtimeTarget={{ type: 'event', id: targetId }}
        onUpdate={onRefresh}
        emptyStateAction={{ label: 'Write First Review', onPress: onPressWriteReview }}
      />

      {reviews.length > 0 && (
        <Pressable style={styles.writeButton} onPress={onPressWriteReview}>
          <Text style={styles.writeButtonText}>Write Review</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: businessDetailSpacing.pageGutter,
    gap: 16,
  },
  sectionHeading: {
    color: businessDetailColors.charcoal,
    fontSize: 23,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.2,
  },
  writeButton: {
    borderRadius: 999,
    backgroundColor: businessDetailColors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  writeButtonText: {
    color: businessDetailColors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
