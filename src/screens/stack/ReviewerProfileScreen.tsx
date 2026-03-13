import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { apiFetch } from '../../lib/api';
import { getBadgeById } from '../../lib/badgeMappings';
import { getBadgeImage } from '../../lib/badgeImages';
import { SkeletonBlock } from '../../components/SkeletonBlock';
import { Text } from '../../components/Typography';

const GRID = 8;

const C = {
  page: '#E5E0E5',
  card: '#9DAB9B',
  charcoal: '#2D2D2D',
  charcoal70: 'rgba(45,45,45,0.7)',
  charcoal60: 'rgba(45,45,45,0.6)',
  charcoal50: 'rgba(45,45,45,0.5)',
  white: '#FFFFFF',
  wine: '#722F37',
  sage: '#7D9B76',
  amber: '#F59E0B',
  blue: '#3B82F6',
};

interface ReviewerReview {
  id: string;
  businessId: string;
  businessName: string;
  businessImageUrl?: string | null;
  businessType: string;
  rating: number;
  text: string;
  date: string;
  likes: number;
  tags: string[];
}

interface ReviewerBadge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedDate: string;
  badge_group?: string;
}

interface ReviewerProfile {
  id: string;
  name: string;
  profilePicture: string;
  reviewCount: number;
  rating: number;
  badge?: 'top' | 'verified' | 'local';
  trophyBadge?: 'gold' | 'silver' | 'bronze' | 'rising-star' | 'community-favorite';
  location: string;
  memberSince: string;
  helpfulVotes: number;
  badgesCount: number;
  impactScore: number;
  averageRating: number;
  reviews: ReviewerReview[];
  badges: ReviewerBadge[];
}

interface ApiResponse {
  reviewer: ReviewerProfile;
}

function StarRating({ rating, size = 14 }: { rating: number; size?: number }) {
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color={C.wine}
        />
      ))}
    </View>
  );
}

function StatCard({
  icon,
  label,
  value,
  delay,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  delay: number;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(GRID * 1.5)).current;

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);
    Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 280, easing: ease, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 280, easing: ease, useNativeDriver: true }),
      ]),
    ]).start();
  }, [delay, opacity, translateY]);

  return (
    <Animated.View style={[styles.statCard, { opacity, transform: [{ translateY }] }]}>
      <View style={styles.statIconWrap}>
        <Ionicons name={icon} size={16} color={C.charcoal60} />
      </View>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </Animated.View>
  );
}

function ReviewCard({ review }: { review: ReviewerReview }) {
  return (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <View style={styles.reviewBizInfo}>
          {review.businessImageUrl ? (
            <Image source={{ uri: review.businessImageUrl }} style={styles.reviewBizImg} />
          ) : (
            <View style={[styles.reviewBizImg, styles.reviewBizImgFallback]}>
              <Ionicons name="storefront" size={14} color={C.charcoal50} />
            </View>
          )}
          <View style={styles.reviewBizText}>
            <Text style={styles.reviewBizName}>{review.businessName}</Text>
            <Text style={styles.reviewBizType}>{review.businessType}</Text>
          </View>
        </View>
        <View style={styles.reviewRatingWrap}>
          <StarRating rating={review.rating} size={12} />
        </View>
      </View>
      <Text style={styles.reviewText} numberOfLines={4}>{review.text}</Text>
      <View style={styles.reviewFooter}>
        <Text style={styles.reviewDate}>{review.date}</Text>
        {review.likes > 0 && (
          <View style={styles.reviewLikes}>
            <Ionicons name="thumbs-up-outline" size={12} color={C.charcoal50} />
            <Text style={styles.reviewLikesText}>{review.likes}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ReviewerSkeleton() {
  return (
    <ScrollView style={styles.skeletonRoot} contentContainerStyle={styles.skeletonContent}>
      <View style={styles.skeletonHeaderCard}>
        <View style={styles.skeletonAvatarRow}>
          <SkeletonBlock style={styles.skeletonAvatar} />
          <View style={styles.skeletonHeaderText}>
            <SkeletonBlock style={styles.skeletonNameLine} />
            <SkeletonBlock style={styles.skeletonMetaLine} />
            <SkeletonBlock style={styles.skeletonMetaLine2} />
          </View>
        </View>
      </View>
      <View style={styles.skeletonStatRow}>
        {[0, 1, 2, 3].map((i) => (
          <SkeletonBlock key={i} style={styles.skeletonStatCard} />
        ))}
      </View>
      {[0, 1].map((i) => (
        <SkeletonBlock key={i} style={styles.skeletonReviewCard} />
      ))}
    </ScrollView>
  );
}

export default function ReviewerProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [imgError, setImgError] = useState(false);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(GRID * 2)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(GRID * 2)).current;

  const { data, isLoading, error } = useQuery({
    queryKey: ['reviewer-profile', id],
    queryFn: () => apiFetch<ApiResponse>(`/api/reviewers/${id}`),
    enabled: Boolean(id),
    staleTime: 60_000,
  });

  const reviewer = data?.reviewer ?? null;

  useEffect(() => {
    if (!reviewer) return;
    const ease = Easing.out(Easing.cubic);
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 260, easing: ease, useNativeDriver: true }),
      Animated.timing(headerY, { toValue: 0, duration: 260, easing: ease, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.delay(80),
      Animated.parallel([
        Animated.timing(contentOpacity, { toValue: 1, duration: 280, easing: ease, useNativeDriver: true }),
        Animated.timing(contentY, { toValue: 0, duration: 280, easing: ease, useNativeDriver: true }),
      ]),
    ]).start();
  }, [reviewer, headerOpacity, headerY, contentOpacity, contentY]);

  const displayedReviews = showAllReviews
    ? (reviewer?.reviews ?? [])
    : (reviewer?.reviews ?? []).slice(0, 2);

  return (
    <View style={[styles.root, { backgroundColor: C.page }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Back button */}
      <View style={[styles.backBtnWrap, { top: insets.top + GRID * 1.5 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={C.charcoal} />
        </Pressable>
      </View>

      {isLoading ? (
        <ReviewerSkeleton />
      ) : error || !reviewer ? (
        <View style={styles.errorState}>
          <Ionicons name="person-outline" size={48} color={C.charcoal50} />
          <Text style={styles.errorTitle}>Reviewer not found</Text>
          <Text style={styles.errorSubtitle}>This profile may have been removed or is unavailable.</Text>
          <Pressable style={styles.errorBack} onPress={() => router.back()}>
            <Text style={styles.errorBackText}>Go back</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + GRID * 8, paddingBottom: insets.bottom + GRID * 4 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Header Card */}
          <Animated.View
            style={[
              styles.headerCard,
              { opacity: headerOpacity, transform: [{ translateY: headerY }] },
            ]}
          >
            <View style={styles.profileRow}>
              {/* Avatar */}
              <View style={styles.avatarWrap}>
                {!imgError && reviewer.profilePicture ? (
                  <Image
                    source={{ uri: reviewer.profilePicture }}
                    style={styles.avatar}
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <View style={[styles.avatar, styles.avatarFallback]}>
                    <Ionicons name="person" size={40} color={C.charcoal50} />
                  </View>
                )}
                {reviewer.badge === 'verified' && (
                  <View style={[styles.badgeDot, styles.badgeDotVerified]}>
                    <Ionicons name="checkmark" size={10} color={C.white} strokeWidth={3} />
                  </View>
                )}
                {reviewer.badge === 'top' && (
                  <View style={[styles.badgeDot, styles.badgeDotTop]}>
                    <Ionicons name="trophy" size={10} color={C.white} />
                  </View>
                )}
              </View>

              {/* Info */}
              <View style={styles.profileInfo}>
                <View style={styles.nameRow}>
                  <Text style={styles.reviewerName}>{reviewer.name}</Text>
                  {reviewer.trophyBadge && (
                    <View style={[styles.trophyBadge, styles[`trophyBadge_${reviewer.trophyBadge}` as keyof typeof styles] as object]}>
                      <Text style={styles.trophyBadgeText}>
                        {reviewer.trophyBadge.replace('-', ' ')}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="location-outline" size={13} color={C.charcoal60} />
                  <Text style={styles.metaText}>{reviewer.location}</Text>
                </View>
                <View style={styles.metaRow}>
                  <Ionicons name="calendar-outline" size={13} color={C.charcoal60} />
                  <Text style={styles.metaText}>Member since {reviewer.memberSince}</Text>
                </View>
                <View style={styles.ratingRow}>
                  <StarRating rating={reviewer.averageRating} size={14} />
                  <Text style={styles.ratingValue}>{reviewer.averageRating.toFixed(1)}</Text>
                  <Text style={styles.reviewCountText}>· {reviewer.reviewCount} reviews</Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Stats Grid */}
          <Animated.View
            style={[
              styles.statsGrid,
              { opacity: contentOpacity, transform: [{ translateY: contentY }] },
            ]}
          >
            <StatCard icon="thumbs-up-outline" label="Helpful" value={reviewer.helpfulVotes.toLocaleString('en-US')} delay={0} />
            <StatCard icon="ribbon-outline" label="Badges" value={reviewer.badgesCount.toLocaleString('en-US')} delay={60} />
            <StatCard icon="trending-up-outline" label="Impact" value={reviewer.impactScore.toLocaleString('en-US')} delay={120} />
            <StatCard icon="star-outline" label="Rating" value={reviewer.averageRating.toFixed(1)} delay={180} />
          </Animated.View>

          {/* Badges Section */}
          {reviewer.badges && reviewer.badges.length > 0 && (
            <Animated.View
              style={[
                styles.section,
                { opacity: contentOpacity, transform: [{ translateY: contentY }] },
              ]}
            >
              <Text style={styles.sectionTitle}>
                Badges & Achievements ({reviewer.badges.length})
              </Text>
              <View style={styles.badgesGrid}>
                {reviewer.badges.map((badge) => {
                  const mapping = getBadgeById(badge.id);
                  const imgSource = mapping
                    ? getBadgeImage(mapping.imageKey)
                    : { uri: badge.icon };
                  return (
                  <View key={badge.id} style={styles.badgeItem}>
                    <Image source={imgSource} style={styles.badgePng} />
                    <View style={styles.badgeInfo}>
                      <Text style={styles.badgeName}>{badge.name}</Text>
                      <Text style={styles.badgeEarned}>Earned {badge.earnedDate}</Text>
                    </View>
                  </View>
                  );
                })}
              </View>
            </Animated.View>
          )}

          {/* Reviews Section */}
          <Animated.View
            style={[
              styles.section,
              { opacity: contentOpacity, transform: [{ translateY: contentY }] },
            ]}
          >
            <Text style={styles.sectionTitle}>Reviews by {reviewer.name}</Text>
            {reviewer.reviews.length === 0 ? (
              <View style={styles.emptyReviews}>
                <Text style={styles.emptyReviewsText}>No reviews yet.</Text>
              </View>
            ) : (
              <>
                {displayedReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} />
                ))}
                {reviewer.reviews.length > 2 && (
                  <Pressable
                    style={({ pressed }) => [
                      styles.showMoreBtn,
                      pressed ? styles.showMoreBtnPressed : null,
                    ]}
                    onPress={() => setShowAllReviews((v) => !v)}
                  >
                    <Text style={styles.showMoreBtnText}>
                      {showAllReviews
                        ? 'Show less'
                        : `Show all ${reviewer.reviews.length} reviews`}
                    </Text>
                    <Ionicons
                      name={showAllReviews ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={C.wine}
                    />
                  </Pressable>
                )}
              </>
            )}
          </Animated.View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backBtnWrap: {
    position: 'absolute',
    left: GRID * 2,
    zIndex: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(45,45,45,0.08)',
  },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: GRID * 2,
    gap: GRID * 2,
  },

  // Header card
  headerCard: {
    backgroundColor: '#9DAB9B',
    borderRadius: 12,
    padding: GRID * 2.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 18,
    elevation: 5,
  },
  profileRow: {
    flexDirection: 'row',
    gap: GRID * 2,
    alignItems: 'flex-start',
  },
  avatarWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 999,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  avatarFallback: {
    backgroundColor: 'rgba(45,45,45,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeDotVerified: {
    backgroundColor: '#3B82F6',
    bottom: 0,
    right: 0,
  },
  badgeDotTop: {
    backgroundColor: '#F59E0B',
    top: 0,
    right: 0,
  },
  profileInfo: {
    flex: 1,
    gap: GRID * 0.75,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: GRID,
  },
  reviewerName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2D2D',
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  trophyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  trophyBadge_gold: { backgroundColor: '#FEF3C7' },
  trophyBadge_silver: { backgroundColor: '#F3F4F6' },
  trophyBadge_bronze: { backgroundColor: '#FEF0E7' },
  'trophyBadge_rising-star': { backgroundColor: '#EDE9FE' },
  'trophyBadge_community-favorite': { backgroundColor: '#FCE7F3' },
  trophyBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#2D2D2D',
    textTransform: 'capitalize',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 13,
    color: 'rgba(45,45,45,0.7)',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  starRow: {
    flexDirection: 'row',
    gap: 1,
  },
  ratingValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  reviewCountText: {
    fontSize: 13,
    color: 'rgba(45,45,45,0.6)',
  },

  // Stats
  statsGrid: {
    flexDirection: 'row',
    gap: GRID,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#9DAB9B',
    borderRadius: 12,
    padding: GRID * 1.5,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  statIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(45,45,45,0.7)',
    fontWeight: '500',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
    letterSpacing: -0.3,
  },

  // Sections
  section: {
    gap: GRID * 1.5,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2D2D2D',
    letterSpacing: -0.2,
  },

  // Badge items
  badgesGrid: {
    backgroundColor: '#9DAB9B',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  badgeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: GRID * 2,
    gap: GRID * 1.5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.25)',
  },
  badgePng: {
    width: 36,
    height: 36,
    flexShrink: 0,
  },
  badgeIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeInfo: {
    flex: 1,
    gap: 2,
  },
  badgeName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  badgeEarned: {
    fontSize: 12,
    color: 'rgba(45,45,45,0.6)',
  },

  // Reviews
  reviewCard: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderRadius: 12,
    padding: GRID * 2,
    gap: GRID,
    borderWidth: 1,
    borderColor: 'rgba(45,45,45,0.06)',
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: GRID,
  },
  reviewBizInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GRID,
    flex: 1,
  },
  reviewBizImg: {
    width: 36,
    height: 36,
    borderRadius: 8,
  },
  reviewBizImgFallback: {
    backgroundColor: 'rgba(45,45,45,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewBizText: {
    flex: 1,
    gap: 2,
  },
  reviewBizName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  reviewBizType: {
    fontSize: 12,
    color: 'rgba(45,45,45,0.6)',
  },
  reviewRatingWrap: {
    flexShrink: 0,
  },
  reviewText: {
    fontSize: 14,
    color: 'rgba(45,45,45,0.8)',
    lineHeight: 20,
  },
  reviewFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reviewDate: {
    fontSize: 12,
    color: 'rgba(45,45,45,0.5)',
  },
  reviewLikes: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reviewLikesText: {
    fontSize: 12,
    color: 'rgba(45,45,45,0.5)',
  },

  showMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: GRID * 0.75,
    paddingVertical: GRID * 1.5,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(114,47,55,0.2)',
  },
  showMoreBtnPressed: {
    opacity: 0.8,
  },
  showMoreBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#722F37',
  },

  emptyReviews: {
    paddingVertical: GRID * 3,
    alignItems: 'center',
  },
  emptyReviewsText: {
    fontSize: 14,
    color: 'rgba(45,45,45,0.5)',
  },

  // Error state
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: GRID * 4,
    gap: GRID * 1.5,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: 14,
    color: 'rgba(45,45,45,0.6)',
    textAlign: 'center',
    lineHeight: 20,
  },
  errorBack: {
    marginTop: GRID,
    paddingHorizontal: GRID * 3,
    paddingVertical: GRID * 1.5,
    borderRadius: 999,
    backgroundColor: '#722F37',
  },
  errorBackText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  // Skeleton
  skeletonRoot: { flex: 1 },
  skeletonContent: {
    paddingHorizontal: GRID * 2,
    paddingTop: GRID * 10,
    paddingBottom: GRID * 4,
    gap: GRID * 2,
  },
  skeletonHeaderCard: {
    backgroundColor: '#9DAB9B',
    borderRadius: 12,
    padding: GRID * 2.5,
  },
  skeletonAvatarRow: {
    flexDirection: 'row',
    gap: GRID * 2,
    alignItems: 'flex-start',
  },
  skeletonAvatar: {
    width: 88,
    height: 88,
    borderRadius: 999,
  },
  skeletonHeaderText: {
    flex: 1,
    gap: GRID,
    paddingTop: GRID,
  },
  skeletonNameLine: {
    height: 20,
    borderRadius: 999,
    width: '60%',
  },
  skeletonMetaLine: {
    height: 12,
    borderRadius: 999,
    width: '80%',
  },
  skeletonMetaLine2: {
    height: 12,
    borderRadius: 999,
    width: '50%',
  },
  skeletonStatRow: {
    flexDirection: 'row',
    gap: GRID,
  },
  skeletonStatCard: {
    flex: 1,
    height: 88,
    borderRadius: 12,
  },
  skeletonReviewCard: {
    height: 120,
    borderRadius: 12,
  },
});
