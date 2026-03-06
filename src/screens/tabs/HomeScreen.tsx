import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import type { BusinessListItemDto, TopReviewerDto } from '@sayso/contracts';
import { CardSurface } from '../../components/CardSurface';
import { HeaderBellButton } from '../../components/HeaderBellButton';
import { Text } from '../../components/Typography';
import { useEventsSpecialsPreview } from '../../hooks/useEventsSpecialsPreview';
import { useFeaturedBusinesses } from '../../hooks/useFeaturedBusinesses';
import { useForYouBusinesses } from '../../hooks/useForYou';
import { useHomeSearch } from '../../hooks/useHomeSearch';
import { useRecentReviews } from '../../hooks/useRecentReviews';
import { useAuthSession } from '../../hooks/useSession';
import { useTopReviewers } from '../../hooks/useTopReviewers';
import { useTrending } from '../../hooks/useTrending';
import { routes } from '../../navigation/routes';
import { HomeBusinessRow } from './home/HomeBusinessRow';
import { HomeCommunityHighlightsSection } from './home/HomeCommunityHighlightsSection';
import { HomeEventsSpecialsRow } from './home/HomeEventsSpecialsRow';
import { HomeSearchBar } from './home/HomeSearchBar';
import { HomeSearchResults } from './home/HomeSearchResults';
import { HomeSectionHeader } from './home/HomeSectionHeader';
import { homeTokens } from './home/HomeTokens';
import { FROSTED_CARD_BORDER_COLOR } from '../../styles/cardSurface';
import { getOverlayShadowStyle } from '../../styles/overlayShadow';
import { CARD_CTA_RADIUS, CARD_RADIUS } from '../../styles/radii';
import { useGlobalScrollToTop } from '../../hooks/useGlobalScrollToTop';

const ctaShadowStyle = getOverlayShadowStyle(CARD_CTA_RADIUS);

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthSession();
  const headerProgress = useRef(new Animated.Value(1)).current;
  const headerCollapsedRef = useRef(false);
  const homeFeedRef = useRef<ScrollView>(null);
  const searchResultsRef = useRef<FlatList<BusinessListItemDto> | null>(null);
  const scrollTopVisibleRef = useRef(false);

  const [searchInput, setSearchInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [minRating, setMinRating] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [showScrollTopButton, setShowScrollTopButton] = useState(false);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setDebouncedQuery(searchInput.trim());
    }, 250);

    return () => clearTimeout(timeoutId);
  }, [searchInput]);

  const isSearchActive = debouncedQuery.length >= 2;
  const discoveryEnabled = !isSearchActive;

  const forYou = useForYouBusinesses(20, discoveryEnabled);
  const trending = useTrending(20, discoveryEnabled);
  const events = useEventsSpecialsPreview(12, discoveryEnabled);
  const reviewers = useTopReviewers(12, discoveryEnabled);
  const recentReviews = useRecentReviews(10, discoveryEnabled);
  const featured = useFeaturedBusinesses(12, null, discoveryEnabled);
  const search = useHomeSearch({
    query: debouncedQuery,
    minRating,
    distanceKm,
    latitude,
    longitude,
    limit: 20,
  });

  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setMinRating(null);
      setDistanceKm(null);
      setLocationDenied(false);
    }
  }, [debouncedQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      if (isSearchActive) {
        await search.refetch();
      } else {
        await Promise.all([
          forYou.refetch(),
          trending.refetch(),
          events.refetch(),
          reviewers.refetch(),
          recentReviews.refetch(),
          featured.refetch(),
        ]);
      }
    } finally {
      setRefreshing(false);
    }
  };

  const handleDistanceChange = async (nextDistance: number | null) => {
    if (nextDistance == null) {
      setDistanceKm(null);
      setLocationDenied(false);
      return;
    }

    setDistanceKm(nextDistance);

    if (latitude != null && longitude != null) {
      setLocationDenied(false);
      return;
    }

    const permission = await Location.requestForegroundPermissionsAsync();
    if (!permission.granted) {
      setLocationDenied(true);
      return;
    }

    try {
      const currentPosition = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLatitude(currentPosition.coords.latitude);
      setLongitude(currentPosition.coords.longitude);
      setLocationDenied(false);
    } catch {
      setLocationDenied(true);
    }
  };

  const navigateToReviewer = (reviewer: TopReviewerDto) => {
    router.push(routes.reviewer(reviewer.id) as never);
  };

  const setScrollTopVisible = useCallback((visible: boolean) => {
    if (scrollTopVisibleRef.current === visible) {
      return;
    }

    scrollTopVisibleRef.current = visible;
    setShowScrollTopButton(visible);
  }, []);

  const handleGlobalScrollToTop = useCallback(() => {
    if (isSearchActive) {
      searchResultsRef.current?.scrollToOffset({ offset: 0, animated: true });
      return;
    }

    homeFeedRef.current?.scrollTo({ y: 0, animated: true });
  }, [isSearchActive]);

  useGlobalScrollToTop({
    visible: showScrollTopButton,
    enabled: true,
    onScrollToTop: handleGlobalScrollToTop,
  });

  useEffect(() => {
    setScrollTopVisible(false);
  }, [isSearchActive, setScrollTopVisible]);

  const headerPaddingTop = headerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 10],
  });
  const headerPaddingBottom = headerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 14],
  });
  const headerRowHeight = headerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 42],
  });
  const headerRowOpacity = headerProgress.interpolate({
    inputRange: [0, 0.35, 1],
    outputRange: [0, 0.12, 1],
  });
  const headerRowTranslateY = headerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 0],
  });
  const headerRowScale = headerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.982, 1],
  });
  const headerMaterialOpacity = headerProgress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 0.42, 0],
  });
  const searchBarMarginTop = headerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [3, 10],
  });
  const searchBarTranslateY = headerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [-2, 0],
  });
  const searchBarScale = headerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1.008, 1],
  });

  const setHeaderState = useCallback(
    (collapsed: boolean) => {
      if (headerCollapsedRef.current === collapsed) {
        return;
      }

      headerCollapsedRef.current = collapsed;
      setHeaderCollapsed(collapsed);
      Animated.spring(headerProgress, {
        toValue: collapsed ? 0 : 1,
        damping: 30,
        mass: 0.82,
        stiffness: 320,
        overshootClamping: true,
        useNativeDriver: false,
      }).start();
    },
    [headerProgress]
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetY = event.nativeEvent.contentOffset.y;
      setScrollTopVisible(offsetY > 280);

      if (offsetY > 56) {
        setHeaderState(true);
      } else if (offsetY < 20) {
        setHeaderState(false);
      }
    },
    [setHeaderState, setScrollTopVisible]
  );

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.headerWrap,
          {
            paddingTop: headerPaddingTop,
            paddingBottom: headerPaddingBottom,
          },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.headerMaterial,
            headerCollapsed ? styles.headerMaterialCollapsed : null,
            { opacity: headerMaterialOpacity },
          ]}
        />
        <Animated.View
          pointerEvents={headerCollapsed ? 'none' : 'auto'}
          style={[
            styles.headerRowWrap,
            {
              height: headerRowHeight,
              opacity: headerRowOpacity,
              transform: [{ translateY: headerRowTranslateY }, { scale: headerRowScale }],
            },
          ]}
        >
          <View style={styles.headerRow}>
            <View style={styles.headerCopy}>
              <Text style={styles.headerTitle}>Sayso</Text>
            </View>
            <HeaderBellButton />
          </View>
        </Animated.View>
        <Animated.View
          style={[
            styles.searchBarWrap,
            {
              marginTop: searchBarMarginTop,
              transform: [{ translateY: searchBarTranslateY }, { scale: searchBarScale }],
            },
          ]}
        >
          <HomeSearchBar
            value={searchInput}
            onChangeText={setSearchInput}
            onClear={() => setSearchInput('')}
            isFetching={isSearchActive && search.isFetching}
          />
        </Animated.View>
      </Animated.View>

      {isSearchActive ? (
        <HomeSearchResults
          listRef={searchResultsRef}
          query={debouncedQuery}
          results={search.businesses}
          isLoading={search.isLoading}
          error={search.error}
          minRating={minRating}
          distanceKm={distanceKm}
          locationDenied={locationDenied}
          onSetMinRating={(value) => setMinRating(value)}
          onSetDistanceKm={handleDistanceChange}
          onClearFilters={() => {
            setMinRating(null);
            setDistanceKm(null);
            setLocationDenied(false);
          }}
          onRefresh={() => {
            void handleRefresh();
          }}
          refreshing={refreshing}
          onScroll={handleScroll}
        />
      ) : (
        <Animated.ScrollView
          ref={homeFeedRef}
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />}
          contentContainerStyle={styles.content}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <View style={styles.section}>
            <HomeSectionHeader
              title="For You"
              actionLabel={user ? 'See More' : undefined}
              onPress={user ? () => router.push(routes.forYou() as never) : undefined}
              delay={0}
            />

            {!user ? (
              <CardSurface
                radius={CARD_RADIUS}
                style={styles.guestCardWrap}
                contentStyle={styles.guestCardSurface}
              >
                <LinearGradient
                  colors={[homeTokens.coral, homeTokens.coralDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.guestCard}
                >
                  <View style={styles.guestBadge}>
                    <Text style={styles.guestBadgeText}>For You</Text>
                  </View>
                  <Text style={styles.guestTitle}>Create an account to unlock personalised recommendations.</Text>
                  <View style={styles.guestActions}>
                    <TouchableOpacity
                      style={[styles.primaryGuestButton, ctaShadowStyle]}
                      onPress={() => router.push(routes.register() as never)}
                      activeOpacity={0.88}
                    >
                      <Text style={styles.primaryGuestButtonText}>Create Account</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.secondaryGuestButton, ctaShadowStyle]}
                      onPress={() => router.push(routes.login() as never)}
                      activeOpacity={0.88}
                    >
                      <Text style={styles.secondaryGuestButtonText}>Sign In</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </CardSurface>
            ) : forYou.error ? (
              <View style={styles.messageCard}>
                <Text style={styles.messageTitle}>Couldn&apos;t load personalised picks right now.</Text>
                <Text style={styles.messageText}>We&apos;ll retry in the background.</Text>
              </View>
            ) : forYou.isLoading ? (
              <HomeBusinessRow
                items={[]}
                loading
                emptyTitle="Curated from your interests"
                emptyMessage="Based on what you selected, no matches in this section yet. See more on For You or explore Trending."
              />
            ) : forYou.businesses.length > 0 ? (
              <HomeBusinessRow
                items={forYou.businesses}
                loading={false}
                emptyTitle="Curated from your interests"
                emptyMessage="Based on what you selected, no matches in this section yet. See more on For You or explore Trending."
              />
            ) : (
              <View style={styles.messageCard}>
                <Text style={styles.messageTitle}>Curated from your interests</Text>
                <Text style={styles.messageText}>
                  Based on what you selected, no matches in this section yet. See more on For You or explore Trending.
                </Text>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <HomeSectionHeader
              title="Trending Now"
              actionLabel="See More"
              onPress={() => router.push(routes.trending() as never)}
              delay={100}
            />
            <HomeBusinessRow
              items={trending.data?.businesses ?? []}
              loading={trending.isLoading}
              error={trending.error instanceof Error ? trending.error.message : null}
              emptyTitle="Nothing trending yet"
              emptyMessage="Check back soon for live activity."
            />
          </View>

          <View style={styles.section}>
            <HomeSectionHeader
              title="Events & Specials"
              actionLabel="See More"
              onPress={() => router.push(routes.eventsSpecials() as never)}
              delay={200}
            />
            <HomeEventsSpecialsRow
              items={events.items}
              loading={events.isLoading}
              error={events.error}
            />
          </View>

          <HomeCommunityHighlightsSection
            reviewers={reviewers.reviewers}
            reviewersMode={reviewers.mode}
            recentReviews={recentReviews.reviews}
            reviewersLoading={reviewers.isLoading || recentReviews.isLoading}
            reviewersError={reviewers.error ?? recentReviews.error}
            featuredBusinesses={featured.featuredBusinesses}
            featuredLoading={featured.isLoading}
            featuredError={featured.error}
            onPressContributors={() => router.push(routes.leaderboard('contributors') as never)}
            onPressFeatured={() => router.push(routes.leaderboard('businesses') as never)}
            onPressBadges={() => router.push(routes.badges() as never)}
            onPressReviewer={navigateToReviewer}
          />
        </Animated.ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: homeTokens.offWhite,
  },
  headerWrap: {
    backgroundColor: homeTokens.offWhite,
    position: 'relative',
    overflow: 'hidden',
  },
  headerMaterial: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: homeTokens.coral,
    borderBottomWidth: 1,
    borderBottomColor: FROSTED_CARD_BORDER_COLOR,
  },
  headerMaterialCollapsed: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: 20,
    position: 'relative',
    zIndex: 1,
  },
  headerRowWrap: {
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 30,
    fontFamily: 'MonarchParadox',
    color: homeTokens.charcoal,
    letterSpacing: 0.2,
  },
  searchBarWrap: {
    marginHorizontal: 16,
    height: 60,
    padding: 4,
    overflow: 'visible',
    position: 'relative',
    zIndex: 1,
  },
  content: {
    backgroundColor: homeTokens.offWhite,
  },
  section: {
    paddingTop: 18,
    backgroundColor: homeTokens.offWhite,
  },
  scroll: {
    backgroundColor: homeTokens.offWhite,
  },
  guestCardWrap: {
    marginHorizontal: homeTokens.pageGutter,
  },
  guestCardSurface: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  guestCard: {
    borderRadius: CARD_RADIUS,
    padding: 20,
  },
  guestBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    marginBottom: 14,
  },
  guestBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: homeTokens.coral,
  },
  guestTitle: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '700',
    color: homeTokens.white,
    maxWidth: 320,
  },
  guestActions: {
    gap: 12,
    marginTop: 18,
  },
  primaryGuestButton: {
    borderRadius: CARD_CTA_RADIUS,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: homeTokens.white,
  },
  primaryGuestButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: homeTokens.coral,
    textAlign: 'center',
  },
  secondaryGuestButton: {
    borderRadius: CARD_CTA_RADIUS,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  secondaryGuestButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: homeTokens.white,
    textAlign: 'center',
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
});
