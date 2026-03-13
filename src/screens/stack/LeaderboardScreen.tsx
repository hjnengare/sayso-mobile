import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { SkeletonBlock } from '../../components/SkeletonBlock';
import { Text } from '../../components/Typography';
import { BusinessPageHeader } from '../../components/business-detail/BusinessPageHeader';
import { businessDetailSpacing } from '../../components/business-detail/styles';
import {
  ContributorPodium,
  ContributorRow,
  BusinessPodium,
  BusinessRow,
  InterestFilter,
} from '../../components/leaderboard';
import type { FeaturedBusinessDto } from '@sayso/contracts';
import { useTopReviewers } from '../../hooks/useTopReviewers';
import { useFeaturedBusinesses } from '../../hooks/useFeaturedBusinesses';
import { useGlobalScrollToTop } from '../../hooks/useGlobalScrollToTop';
import { useRealtimeQueryInvalidation } from '../../hooks/useRealtimeQueryInvalidation';
import { routes } from '../../navigation/routes';
import { TransitionItem } from '../../components/motion/TransitionItem';

const PAGE_BG = '#E5E0E5';
const CARD_BG = '#9DAB9B';
const CHARCOAL = '#2D2D2D';
const CHARCOAL_70 = 'rgba(45,45,45,0.70)';
const SAGE = '#9DAB9B';
const CORAL = '#722F37';

const INITIAL_VISIBLE = 5;

function normalizeInterestId(id?: string | null): string {
  if (!id || id === 'uncategorized') return 'miscellaneous';
  return id;
}

export default function LeaderboardScreen() {
  const { tab: tabParam } = useLocalSearchParams<{ tab?: 'contributors' | 'businesses' }>();
  const router = useRouter();
  const initialTab = tabParam === 'businesses' ? 'businesses' : 'contributors';

  const [activeTab, setActiveTab] = useState<'contributors' | 'businesses'>(initialTab);
  const [showAllContributors, setShowAllContributors] = useState(false);
  const [showAllBusinesses, setShowAllBusinesses] = useState(false);
  const [selectedInterest, setSelectedInterest] = useState('all');
  const [businessesEnabled, setBusinessesEnabled] = useState(initialTab === 'businesses');

  useEffect(() => {
    if (tabParam === 'businesses' || tabParam === 'contributors') {
      setActiveTab(tabParam);
      if (tabParam === 'businesses') setBusinessesEnabled(true);
    }
  }, [tabParam]);

  // Data
  const { reviewers, isLoading: loadingReviewers, error: reviewersError, refetch: refetchReviewers } = useTopReviewers(20);
  const { featuredBusinesses, isLoading: loadingBusinesses } = useFeaturedBusinesses(50, null, businessesEnabled);

  const realtimeTargets = useMemo(
    () => [
      {
        key: 'leaderboard-reviews',
        table: 'reviews',
        queryKeys: [['top-reviewers'], ['featured-businesses']],
      },
      {
        key: 'leaderboard-review-helpful-votes',
        table: 'review_helpful_votes',
        queryKeys: [['top-reviewers']],
      },
      {
        key: 'leaderboard-businesses',
        table: 'businesses',
        queryKeys: [['featured-businesses']],
      },
    ],
    []
  );

  useRealtimeQueryInvalidation(realtimeTargets);

  // Scroll + header state
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollTopVisibleRef = useRef(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const setScrollTopVisible = useCallback((v: boolean) => {
    if (scrollTopVisibleRef.current === v) return;
    scrollTopVisibleRef.current = v;
    setShowScrollTop(v);
  }, []);

  const handleScrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  useGlobalScrollToTop({ visible: showScrollTop, enabled: true, onScrollToTop: handleScrollToTop });

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    setScrollTopVisible(y > 300);
  }, [setScrollTopVisible]);

  const handleBack = () => {
    if (router.canGoBack()) { router.back(); return; }
    router.replace(routes.home() as never);
  };

  const menuItems = useMemo(() => [
    { key: 'home', label: 'Home', onPress: () => router.push(routes.home() as never) },
    { key: 'trending', label: 'Trending', onPress: () => router.push(routes.trending() as never) },
    { key: 'events', label: 'Events & Specials', onPress: () => router.push(routes.eventsSpecials() as never) },
    { key: 'saved', label: 'Saved', onPress: () => router.push(routes.saved() as never) },
    { key: 'profile', label: 'Profile', onPress: () => router.push(routes.profile() as never) },
  ], [router]);

  // Business filtering + sorting
  const availableInterestIds = useMemo(() => {
    const ids = new Set<string>(
      featuredBusinesses.map(b =>
        normalizeInterestId((b as any).interestId ?? (b as any).interest_id)
      )
    );
    return Array.from(ids).sort();
  }, [featuredBusinesses]);

  const sortedBusinesses = useMemo(() => {
    const filtered = selectedInterest === 'all'
      ? featuredBusinesses
      : featuredBusinesses.filter(b =>
          normalizeInterestId((b as any).interestId ?? (b as any).interest_id) === selectedInterest
        );
    return [...filtered].sort((a: FeaturedBusinessDto, b: FeaturedBusinessDto) => {
      const ra = a.totalRating ?? a.rating ?? 0;
      const rb = b.totalRating ?? b.rating ?? 0;
      return rb - ra;
    });
  }, [featuredBusinesses, selectedInterest]);

  const visibleContributors = showAllContributors ? reviewers : reviewers.slice(0, INITIAL_VISIBLE);
  const visibleBusinesses = showAllBusinesses ? sortedBusinesses : sortedBusinesses.slice(0, INITIAL_VISIBLE);

  const handleTabChange = (tab: 'contributors' | 'businesses') => {
    setActiveTab(tab);
    if (tab === 'businesses' && !businessesEnabled) setBusinessesEnabled(true);
  };

  return (
    <SafeAreaView style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Sticky header */}
      <View
        style={[
          s.stickyHeader,
          {
            backgroundColor: CORAL,
            elevation: 8,
            shadowOpacity: 0.12,
          },
        ]}
      >
        <BusinessPageHeader
          onPressBack={handleBack}
          onPressNotifications={() => router.push(routes.notifications() as never)}
          onPressMessages={() => router.push(routes.dmInbox() as never)}
          menuItems={menuItems}
          collapsed={true}
        />
      </View>

      <ScrollView
        ref={scrollRef}
        style={s.scroll}
        contentContainerStyle={s.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Hero */}
        <TransitionItem variant="header" index={0}>
          <View style={s.hero}>
            <Text style={s.heroTitle}>Community Highlights</Text>
            <Text style={s.heroSub}>
              Celebrate the top contributors and businesses in our community. See who&apos;s making a difference and discover the most loved local spots.
            </Text>
          </View>
        </TransitionItem>

        {/* Tab switcher — matches web: white/80 container, sage active */}
        <TransitionItem variant="input" index={1}>
          <View style={s.tabContainer}>
            <View style={s.tabRow}>
              <Pressable
                style={[s.tab, activeTab === 'contributors' && s.tabActive]}
                onPress={() => handleTabChange('contributors')}
              >
                <Text style={[s.tabText, activeTab === 'contributors' && s.tabTextActive]}>
                  Top Contributors
                </Text>
              </Pressable>
              <Pressable
                style={[s.tab, activeTab === 'businesses' && s.tabActive]}
                onPress={() => handleTabChange('businesses')}
              >
                <Text style={[s.tabText, activeTab === 'businesses' && s.tabTextActive]}>
                  Top Businesses
                </Text>
              </Pressable>
            </View>
          </View>
        </TransitionItem>

        {/* Main card — sage background matching web card-bg */}
        <TransitionItem variant="card" index={2}>
          <View style={s.card}>
            {activeTab === 'contributors' ? (
              <>
                {loadingReviewers ? (
                  <View style={s.skeletonWrap}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <View key={i} style={s.skeletonRow}>
                        <View style={s.skeletonLeft}>
                          <SkeletonBlock style={s.skeletonBadge} />
                          <SkeletonBlock style={s.skeletonAvatar} />
                          <View style={s.skeletonIdentity}>
                            <SkeletonBlock style={s.skeletonName} />
                            <SkeletonBlock style={s.skeletonSub} />
                          </View>
                        </View>
                        <View style={s.skeletonRight}>
                          <SkeletonBlock style={s.skeletonPill} />
                          <SkeletonBlock style={s.skeletonTiny} />
                        </View>
                      </View>
                    ))}
                  </View>
                ) : reviewersError ? (
                  <View style={s.emptyWrap}>
                    <Text style={s.emptyText}>Couldn&apos;t load leaderboard.</Text>
                    <Pressable style={s.retryBtn} onPress={() => void refetchReviewers()}>
                      <Text style={s.retryText}>Retry</Text>
                    </Pressable>
                  </View>
                ) : reviewers.length === 0 ? (
                  <View style={s.emptyWrap}>
                    <View style={s.emptyIcon}>
                      <Ionicons name="trophy-outline" size={36} color={CHARCOAL_70} />
                    </View>
                    <Text style={s.emptyText}>No contributors yet. Be the first to write a review!</Text>
                  </View>
                ) : (
                  <>
                    <ContributorPodium reviewers={reviewers} />
                    <View style={s.list}>
                      {visibleContributors.map((r: (typeof reviewers)[number], i: number) => (
                        <ContributorRow key={r.id} reviewer={r} rank={i + 1} />
                      ))}
                    </View>
                    {reviewers.length > INITIAL_VISIBLE && (
                      <Pressable
                        style={s.expandBtn}
                        onPress={() => setShowAllContributors(v => !v)}
                      >
                        {showAllContributors && <Ionicons name="chevron-up" size={15} color="#fff" />}
                        <Text style={s.expandText}>
                          {showAllContributors ? 'Show Less' : 'View Full Leaderboard'}
                        </Text>
                        {!showAllContributors && <Ionicons name="chevron-down" size={15} color="#fff" />}
                      </Pressable>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                {availableInterestIds.length > 0 && (
                  <InterestFilter
                    availableIds={availableInterestIds}
                    selected={selectedInterest}
                    onSelect={setSelectedInterest}
                  />
                )}

                {loadingBusinesses ? (
                  <View style={s.skeletonWrap}>
                    {Array.from({ length: 5 }, (_, i) => (
                      <View key={i} style={s.skeletonRow}>
                        <View style={s.skeletonLeft}>
                          <SkeletonBlock style={s.skeletonBadge} />
                          <SkeletonBlock style={s.skeletonAvatar} />
                          <View style={s.skeletonIdentity}>
                            <SkeletonBlock style={s.skeletonName} />
                            <SkeletonBlock style={s.skeletonSub} />
                          </View>
                        </View>
                        <View style={s.skeletonRight}>
                          <SkeletonBlock style={s.skeletonPill} />
                          <SkeletonBlock style={s.skeletonTiny} />
                        </View>
                      </View>
                    ))}
                  </View>
                ) : sortedBusinesses.length === 0 ? (
                  <View style={s.emptyWrap}>
                    <View style={s.emptyIcon}>
                      <Ionicons name="storefront-outline" size={36} color={CHARCOAL_70} />
                    </View>
                    <Text style={s.emptyText}>No businesses yet.</Text>
                  </View>
                ) : (
                  <>
                    <BusinessPodium businesses={sortedBusinesses} />
                    <View style={s.list}>
                      {visibleBusinesses.map((b, i) => (
                        <BusinessRow key={b.id} business={b} rank={i + 1} />
                      ))}
                    </View>
                    {sortedBusinesses.length > INITIAL_VISIBLE && (
                      <Pressable
                        style={s.expandBtn}
                        onPress={() => setShowAllBusinesses(v => !v)}
                      >
                        {showAllBusinesses && <Ionicons name="chevron-up" size={15} color="#fff" />}
                        <Text style={s.expandText}>
                          {showAllBusinesses ? 'Show Less' : 'View Full Leaderboard'}
                        </Text>
                        {!showAllBusinesses && <Ionicons name="chevron-down" size={15} color="#fff" />}
                      </Pressable>
                    )}
                  </>
                )}
              </>
            )}
          </View>
        </TransitionItem>

        {/* Badge section — coral/navbar-bg background matching web */}
        <TransitionItem variant="cta" index={3}>
          <View style={s.badgeSection}>
            <Text style={s.badgeSectionTitle}>What Do Your Badges Mean?</Text>
            <Text style={s.badgeSectionSub}>Learn about all the badges you can earn</Text>
            <View style={s.badgeBtns}>
              <Pressable
                style={s.badgePrimaryBtn}
                onPress={() => router.push(routes.badges() as never)}
              >
                <Ionicons name="ribbon-outline" size={14} color={CORAL} />
                <Text style={s.badgePrimaryText}>View badge guide</Text>
              </Pressable>
              <Pressable
                style={s.badgeSecondaryBtn}
                onPress={() => router.push(routes.achievements() as never)}
              >
                <Ionicons name="trophy-outline" size={14} color="#fff" />
                <Text style={s.badgeSecondaryText}>Achievements</Text>
              </Pressable>
            </View>
          </View>
        </TransitionItem>
      </ScrollView>

    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PAGE_BG,
  },
  stickyHeader: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    zIndex: 50,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },

  // Hero
  hero: {
    paddingHorizontal: businessDetailSpacing.pageGutter,
    paddingTop: 28,
    paddingBottom: 28,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: CHARCOAL,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 8,
  },
  heroSub: {
    fontSize: 14,
    lineHeight: 20,
    color: CHARCOAL_70,
    textAlign: 'center',
    maxWidth: 320,
  },

  // Tabs — white/80 container with border, sage active (mirrors web Tabs.tsx)
  tabContainer: {
    paddingHorizontal: businessDetailSpacing.pageGutter,
    marginBottom: 12,
    alignItems: 'center',
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.80)',
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(45,45,45,0.20)',
    padding: 4,
    gap: 4,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
  },
  tabActive: {
    backgroundColor: SAGE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: CHARCOAL_70,
  },
  tabTextActive: {
    color: '#fff',
  },

  // Main card — sage card-bg with white/20 border (mirrors web card wrapper)
  card: {
    marginHorizontal: businessDetailSpacing.pageGutter,
    backgroundColor: CARD_BG,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.20)',
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  // List
  list: {
    gap: 8,
    marginTop: 16,
  },

  // Expand button — sage gradient, white text, rounded-full (mirrors web)
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 16,
    alignSelf: 'center',
    backgroundColor: SAGE,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: SAGE,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 10,
    elevation: 4,
  },
  expandText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },

  // Empty / loading
  skeletonWrap: {
    gap: 8,
    paddingVertical: 8,
  },
  skeletonRow: {
    minHeight: 72,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  skeletonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  skeletonBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  skeletonIdentity: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  skeletonName: {
    width: '62%',
    height: 13,
    borderRadius: 7,
  },
  skeletonSub: {
    width: '38%',
    height: 10,
    borderRadius: 6,
  },
  skeletonRight: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 8,
  },
  skeletonPill: {
    width: 58,
    height: 20,
    borderRadius: 999,
  },
  skeletonTiny: {
    width: 52,
    height: 10,
    borderRadius: 6,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 12,
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: PAGE_BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: CHARCOAL_70,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },
  retryBtn: {
    backgroundColor: CARD_BG,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 999,
    marginTop: 4,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },

  // Badge section — coral/navbar-bg background (mirrors web)
  badgeSection: {
    marginTop: 20,
    marginHorizontal: businessDetailSpacing.pageGutter,
    backgroundColor: CORAL,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 4,
  },
  badgeSectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  badgeSectionSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
    marginBottom: 12,
  },
  badgeBtns: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  badgePrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  badgePrimaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: CORAL,
  },
  badgeSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
  },
  badgeSecondaryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
  },
});
