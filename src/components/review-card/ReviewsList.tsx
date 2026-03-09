import { useEffect, useMemo, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ReviewCard, type ReviewCardData } from './ReviewCard';
import { Text } from '../Typography';
import { supabase } from '../../lib/supabase';

interface ReviewsListProps {
  reviews: ReviewCardData[];
  loading?: boolean;
  error?: string | null;
  emptyMessage?: string;
  realtimeTarget?: {
    type: 'business' | 'event';
    id: string;
  };
  onUpdate?: () => void;
  emptyStateAction?: {
    label: string;
    onPress: () => void;
    disabled?: boolean;
  };
}

const C = {
  charcoal: '#2D2D2D',
  charcoal60: 'rgba(45,45,45,0.60)',
  coral: '#722F37',
  white: '#FFFFFF',
  offWhite: '#E5E0E5',
  cardBg: 'rgba(157,171,155,0.20)',
  sageBorder: 'rgba(125,155,118,0.05)',
};

function SkeletonPulse({ style }: { style: object }) {
  return <View style={[skeletonStyles.block, style]} />;
}

const skeletonStyles = StyleSheet.create({
  block: {
    backgroundColor: 'rgba(157,171,155,0.20)',
    borderRadius: 6,
  },
});

function ReviewSkeleton() {
  return (
    <View style={styles.skeletonCard}>
      <View style={styles.skeletonRow}>
        <SkeletonPulse style={styles.skeletonAvatar} />
        <View style={styles.skeletonContent}>
          <View style={styles.skeletonHeaderRow}>
            <SkeletonPulse style={styles.skeletonName} />
            <View style={styles.skeletonStarsRow}>
              {[...Array(5)].map((_, i) => (
                <SkeletonPulse key={i} style={styles.skeletonStar} />
              ))}
            </View>
          </View>
          <SkeletonPulse style={styles.skeletonLine} />
          <SkeletonPulse style={styles.skeletonLineShort} />
          <SkeletonPulse style={styles.skeletonLineShorter} />
        </View>
      </View>
    </View>
  );
}

export function ReviewsList({
  reviews,
  loading = false,
  error = null,
  emptyMessage = 'No reviews yet. Be the first to share your experience!',
  realtimeTarget,
  onUpdate,
  emptyStateAction,
}: ReviewsListProps) {
  const reviewIdSet = useMemo(() => new Set(reviews.map((review) => review.id)), [reviews]);
  const helpfulRefreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!realtimeTarget?.id || !onUpdate) return;

    const reviewFilterColumn = realtimeTarget.type === 'event' ? 'event_id' : 'business_id';
    const reviewsChannel = supabase
      .channel(`mobile-reviews-${realtimeTarget.type}-${realtimeTarget.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reviews',
          filter: `${reviewFilterColumn}=eq.${realtimeTarget.id}`,
        },
        () => {
          onUpdate();
        }
      )
      .subscribe();

    const helpfulVotesChannel = supabase
      .channel(`mobile-review-helpful-${realtimeTarget.type}-${realtimeTarget.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'review_helpful_votes',
        },
        (payload) => {
          const candidateId =
            (payload.new as { review_id?: string } | null)?.review_id ??
            (payload.old as { review_id?: string } | null)?.review_id;
          if (!candidateId || !reviewIdSet.has(candidateId)) return;

          if (helpfulRefreshTimerRef.current) {
            clearTimeout(helpfulRefreshTimerRef.current);
          }
          helpfulRefreshTimerRef.current = setTimeout(() => {
            onUpdate();
            helpfulRefreshTimerRef.current = null;
          }, 300);
        }
      )
      .subscribe();

    return () => {
      if (helpfulRefreshTimerRef.current) {
        clearTimeout(helpfulRefreshTimerRef.current);
        helpfulRefreshTimerRef.current = null;
      }
      supabase.removeChannel(reviewsChannel);
      supabase.removeChannel(helpfulVotesChannel);
    };
  }, [onUpdate, realtimeTarget?.id, realtimeTarget?.type, reviewIdSet]);

  if (loading) {
    return (
      <View style={styles.stack}>
        <ReviewSkeleton />
        <ReviewSkeleton />
        <ReviewSkeleton />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorCard}>
        <Ionicons name="alert-circle" size={24} color="#EF4444" />
        <Text style={styles.errorTitle}>Unable to load reviews</Text>
        <Text style={styles.errorBody}>{error}</Text>
      </View>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <View style={styles.emptyIconCircle}>
          <Ionicons name="chatbubble-outline" size={32} color={C.charcoal60} />
        </View>
        <Text style={styles.emptyTitle}>No reviews yet</Text>
        <Text style={styles.emptyBody}>{emptyMessage}</Text>
        {emptyStateAction && (
          <Pressable
            style={[
              styles.emptyAction,
              emptyStateAction.disabled && styles.emptyActionDisabled,
            ]}
            onPress={emptyStateAction.onPress}
            disabled={emptyStateAction.disabled}
          >
            <Text style={styles.emptyActionText}>{emptyStateAction.label}</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={styles.stack}>
      {reviews.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
      <Text style={styles.countText}>
        Showing {reviews.length} review{reviews.length !== 1 ? 's' : ''}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {
    gap: 24,
  },
  // Loading skeleton
  skeletonCard: {
    backgroundColor: 'rgba(229,224,229,0.95)',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: C.sageBorder,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    flexShrink: 0,
  },
  skeletonContent: {
    flex: 1,
    gap: 10,
  },
  skeletonHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  skeletonName: {
    height: 18,
    width: 96,
    borderRadius: 4,
  },
  skeletonStarsRow: {
    flexDirection: 'row',
    gap: 3,
  },
  skeletonStar: {
    width: 16,
    height: 16,
    borderRadius: 3,
  },
  skeletonLine: {
    height: 14,
    width: '100%',
    borderRadius: 4,
  },
  skeletonLineShort: {
    height: 14,
    width: '75%',
    borderRadius: 4,
  },
  skeletonLineShorter: {
    height: 14,
    width: '50%',
    borderRadius: 4,
  },
  // Error state
  errorCard: {
    backgroundColor: 'rgba(254,242,242,0.9)',
    borderWidth: 1,
    borderColor: 'rgba(254,202,202,1)',
    borderRadius: 8,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#991B1B',
  },
  errorBody: {
    fontSize: 13,
    color: '#DC2626',
    textAlign: 'center',
  },
  // Empty state
  emptyWrap: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(229,224,229,0.80)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: C.charcoal,
  },
  emptyBody: {
    fontSize: 14,
    fontWeight: '500',
    color: C.charcoal60,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 300,
  },
  emptyAction: {
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: C.coral,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  emptyActionDisabled: {
    backgroundColor: 'rgba(45,45,45,0.20)',
  },
  emptyActionText: {
    color: C.white,
    fontSize: 14,
    fontWeight: '700',
  },
  // Count footer
  countText: {
    fontSize: 13,
    color: C.charcoal60,
    textAlign: 'center',
    paddingTop: 4,
  },
});
