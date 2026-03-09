import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import type { FeaturedBusinessDto, RecentReviewDto, TopReviewerDto } from '@sayso/contracts';
import { CardSurface } from '../../../components/CardSurface';
import { SkeletonBlock } from '../../../components/SkeletonBlock';
import { Text } from '../../../components/Typography';
import { ReviewerCard } from '../../../components/reviewer-card/ReviewerCard';
import { COMMUNITY_BADGE_MARQUEE_ASSETS } from '../../../lib/communityBadgeMarqueeAssets';
import { HomeSectionHeader } from './HomeSectionHeader';
import { HomeBusinessRow } from './HomeBusinessRow';
import { homeTokens } from './HomeTokens';
import { CARD_RADIUS } from '../../../styles/radii';
import { NAVBAR_BG_COLOR } from '../../../styles/colors';

type Props = {
  reviewers: TopReviewerDto[];
  reviewersMode?: 'stage1' | 'normal';
  recentReviews: RecentReviewDto[];
  reviewersLoading: boolean;
  reviewersError?: string | null;
  featuredBusinesses: FeaturedBusinessDto[];
  featuredLoading: boolean;
  featuredError?: string | null;
  onPressContributors: () => void;
  onPressFeatured: () => void;
  onPressBadges: () => void;
  onPressReviewer: (reviewer: TopReviewerDto) => void;
};

function CommunityBadgeMarquee() {
  const translateX = useRef(new Animated.Value(0)).current;
  const [trackWidth, setTrackWidth] = useState(0);
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  const handleTrackLayout = useCallback((event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width / 2;
    if (nextWidth <= 0) {
      return;
    }
    setTrackWidth((current) => (Math.abs(current - nextWidth) > 1 ? nextWidth : current));
  }, []);

  useEffect(() => {
    if (trackWidth <= 0) {
      return;
    }

    loopRef.current?.stop();
    translateX.stopAnimation(() => {
      translateX.setValue(0);
      const duration = 8_000;
      const useNativeDriver = Platform.OS !== 'web';
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: -trackWidth,
            duration,
            easing: Easing.linear,
            useNativeDriver,
            isInteraction: false,
          }),
          Animated.timing(translateX, {
            toValue: 0,
            duration: 0,
            useNativeDriver,
            isInteraction: false,
          }),
        ])
      );

      loopRef.current = loop;
      loop.start();
    });

    return () => {
      loopRef.current?.stop();
    };
  }, [trackWidth, translateX]);

  return (
    <View style={styles.badgeMarqueeContainer}>
      <View style={styles.badgeMarqueeViewport} accessibilityLabel="Badge previews" pointerEvents="none">
        <Animated.View style={[styles.badgeTrack, { transform: [{ translateX }] }]} onLayout={handleTrackLayout}>
          <View style={styles.badgeTrackGroup}>
            {COMMUNITY_BADGE_MARQUEE_ASSETS.map((badge) => (
              <View key={badge.id} style={styles.badgeChip}>
                <Image source={badge.asset} style={styles.badgeChipIcon} contentFit="contain" />
                <Text style={styles.badgeChipLabel}>{badge.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.badgeTrackGroup}>
            {COMMUNITY_BADGE_MARQUEE_ASSETS.map((badge) => (
              <View key={`${badge.id}-clone`} style={styles.badgeChip}>
                <Image source={badge.asset} style={styles.badgeChipIcon} contentFit="contain" />
                <Text style={styles.badgeChipLabel}>{badge.label}</Text>
              </View>
            ))}
          </View>
        </Animated.View>
      </View>
    </View>
  );
}


export function HomeCommunityHighlightsSection({
  reviewers,
  reviewersMode = 'stage1',
  recentReviews,
  reviewersLoading,
  reviewersError,
  featuredBusinesses,
  featuredLoading,
  featuredError,
  onPressContributors,
  onPressFeatured,
  onPressBadges,
  onPressReviewer,
}: Props) {
  const contributorsHeading = reviewersMode === 'normal' ? 'Top Contributors' : 'Early Voices';
  const showContributorsAction = reviewers.length > 0 && !reviewersLoading;
  
  const badgesAnimValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animateBadgesEntrance = () => {
      Animated.sequence([
        Animated.delay(800), // Wait a bit before starting
        Animated.parallel([
          Animated.timing(badgesAnimValue, {
            toValue: 1,
            duration: 600,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    };

    // Only animate if we're showing the empty state (no reviewers)
    if (reviewers.length === 0 && !reviewersLoading && !reviewersError) {
      animateBadgesEntrance();
    }
  }, [reviewers.length, reviewersLoading, reviewersError, badgesAnimValue]);

  const badgesAnimatedStyle = {
    opacity: badgesAnimValue,
    transform: [
      {
        translateY: badgesAnimValue.interpolate({
          inputRange: [0, 1],
          outputRange: [10, 0],
        }),
      },
    ],
  };

  return (
    <View style={styles.section}>
      <HomeSectionHeader title="Community Highlights" />

      <View style={styles.subsection}>
        <View style={styles.subsectionTop}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{contributorsHeading}</Text>
          </View>
          {showContributorsAction ? (
            <TouchableOpacity style={styles.subsectionActionButton} onPress={onPressContributors} activeOpacity={0.8}>
              <Text style={styles.subsectionAction}>See More</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        {reviewersLoading ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.row}
            contentContainerStyle={styles.rowContent}
          >
            {[1, 2, 3].map((item) => (
              <CardSurface
                key={`reviewer-skeleton-${item}`}
                radius={16}
                style={{ width: 240 }}
                contentStyle={{ minHeight: 260, padding: 16 }}
              >
                <View style={styles.reviewerCardSkeleton}>
                  <SkeletonBlock style={styles.reviewerSkeletonAvatar} />
                  <SkeletonBlock style={styles.reviewerSkeletonTitle} />
                  <SkeletonBlock style={styles.reviewerSkeletonSub} />
                  <SkeletonBlock style={styles.reviewerSkeletonLine} />
                  <SkeletonBlock style={styles.reviewerSkeletonLineShort} />
                  <View style={styles.reviewerSkeletonPillRow}>
                    <SkeletonBlock style={styles.reviewerSkeletonPill} />
                    <SkeletonBlock style={styles.reviewerSkeletonPill} />
                  </View>
                </View>
              </CardSurface>
            ))}
          </ScrollView>
        ) : reviewersError ? (
          <View style={styles.messageCard}>
            <Text style={styles.messageTitle}>Top contributors are unavailable right now.</Text>
            <Text style={styles.messageText}>{reviewersError}</Text>
          </View>
        ) : reviewers.length === 0 ? (
          <View style={styles.emptyContributorsCard}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoWordmark}>Sayso</Text>
              <Animated.Text style={[styles.badgesScript, badgesAnimatedStyle]}>
                badges
              </Animated.Text>
            </View>
            <Text style={styles.emptyContributorsTitle}>Be among the first voices shaping Sayso.</Text>
            <Text style={styles.emptyContributorsBody}>
              Write your first review and help set the standard for what is worth discovering.
            </Text>
            <TouchableOpacity style={styles.exploreBadgesButton} onPress={onPressBadges} activeOpacity={0.88}>
              <Text style={styles.exploreBadgesText}>Explore badges</Text>
              <Ionicons name="arrow-forward" size={15} color={homeTokens.white} />
            </TouchableOpacity>
            <CommunityBadgeMarquee />
          </View>
        ) : (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.row}
            contentContainerStyle={styles.rowContent}
          >
            {reviewers.map((reviewer) => {
              const latestReview = recentReviews.find((item) => item.reviewer.id === reviewer.id);
              return (
                <ReviewerCard
                  key={reviewer.id}
                  variant="reviewer"
                  reviewer={reviewer}
                  latestReview={latestReview}
                />
              );
            })}
          </ScrollView>
        )}
      </View>

      <View style={styles.subsection}>
        <View style={styles.subsectionTop}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>Featured Businesses</Text>
          </View>
          <TouchableOpacity style={styles.subsectionActionButton} onPress={onPressFeatured} activeOpacity={0.8}>
            <Text style={styles.subsectionAction}>See More</Text>
          </TouchableOpacity>
        </View>

        <HomeBusinessRow
          items={featuredBusinesses}
          loading={featuredLoading}
          error={featuredError}
          emptyTitle="Curated by trust and completeness."
          emptyMessage="As the community grows, this will highlight rising businesses worth exploring."
          contentPaddingBottom={0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingTop: 18,
    paddingBottom: Platform.OS === 'web' ? 100 : 50,
    backgroundColor: homeTokens.offWhite,
  },
  subsection: {
    marginTop: 4,
    marginBottom: 18,
    backgroundColor: homeTokens.offWhite,
  },
  subsectionTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: homeTokens.pageGutter,
    marginBottom: 14,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: homeTokens.sageWash,
    borderWidth: 1,
    borderColor: 'rgba(125, 155, 118, 0.28)',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '700',
    color: homeTokens.sageDark,
  },
  subsectionAction: {
    fontSize: 14,
    fontWeight: '600',
    color: homeTokens.charcoal,
  },
  subsectionActionButton: {
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  row: {
    overflow: 'visible',
    backgroundColor: homeTokens.offWhite,
  },
  rowContent: {
    paddingHorizontal: homeTokens.pageGutter,
    paddingTop: 4,
    paddingBottom: 18,
    gap: 14,
    backgroundColor: homeTokens.offWhite,
  },
  reviewerCardSkeleton: {
    flex: 1,
    minHeight: 148,
    gap: 10,
  },
  reviewerSkeletonAvatar: {
    width: 56,
    height: 56,
    borderRadius: 12,
  },
  reviewerSkeletonTitle: {
    width: '72%',
    height: 14,
    borderRadius: 7,
  },
  reviewerSkeletonSub: {
    width: '48%',
    height: 11,
    borderRadius: 6,
  },
  reviewerSkeletonLine: {
    width: '100%',
    height: 10,
    borderRadius: 6,
  },
  reviewerSkeletonLineShort: {
    width: '78%',
    height: 10,
    borderRadius: 6,
  },
  reviewerSkeletonPillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  reviewerSkeletonPill: {
    width: 80,
    height: 24,
    borderRadius: 999,
  },
  messageCard: {
    marginHorizontal: homeTokens.pageGutter,
    padding: 20,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: homeTokens.borderSoft,
    backgroundColor: homeTokens.cardBg,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: homeTokens.charcoal,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(45,55,72,0.9)',
    marginTop: 6,
  },
  emptyContributorsCard: {
    marginHorizontal: homeTokens.pageGutter,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 22,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(92, 37, 43, 0.46)',
    backgroundColor: NAVBAR_BG_COLOR,
    alignItems: 'center',
  },
  emptyContributorsTitle: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    color: homeTokens.white,
    textAlign: 'center',
  },
  emptyContributorsBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.84)',
    textAlign: 'center',
    maxWidth: 320,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: 2,
    marginBottom: 16,
  },
  logoWordmark: {
    fontSize: 26,
    lineHeight: 26,
    fontFamily: 'MonarchParadox',
    letterSpacing: 0.2,
    textTransform: 'none',
    color: homeTokens.white,
  },
  badgesScript: {
    fontSize: 16,
    lineHeight: 16,
    fontStyle: 'italic',
    fontWeight: '400',
    color: homeTokens.white,
  },
  exploreBadgesButton: {
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: NAVBAR_BG_COLOR,
  },
  exploreBadgesText: {
    fontSize: 13,
    fontWeight: '700',
    color: homeTokens.white,
  },
  badgeMarqueeContainer: {
    marginTop: 18,
    marginHorizontal: -20,
    alignSelf: 'stretch',
    backgroundColor: NAVBAR_BG_COLOR,
  },
  badgeMarqueeViewport: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: NAVBAR_BG_COLOR,
  },
  badgeTrack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeTrackGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 6,
    paddingBottom: 4,
  },
  badgeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(45, 55, 72, 0.1)',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 2,
  },
  badgeChipIcon: {
    width: 18,
    height: 18,
  },
  badgeChipLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: 'rgba(45, 55, 72, 0.8)',
  },
});
