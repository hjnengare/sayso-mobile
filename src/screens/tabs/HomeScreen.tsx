import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, FlatList, ScrollView, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import type { BusinessListItemDto, TopReviewerDto } from '@sayso/contracts';
import { useEventsSpecialsPreview } from '../../hooks/useEventsSpecialsPreview';
import { useFeaturedBusinesses } from '../../hooks/useFeaturedBusinesses';
import { useForYouBusinesses } from '../../hooks/useForYou';
import { useHomeSearch } from '../../hooks/useHomeSearch';
import { useRecentReviews } from '../../hooks/useRecentReviews';
import { useAuthSession } from '../../hooks/useSession';
import { useTopReviewers } from '../../hooks/useTopReviewers';
import { useTrending } from '../../hooks/useTrending';
import { routes } from '../../navigation/routes';
import { useGlobalScrollToTop } from '../../hooks/useGlobalScrollToTop';
import { useRealtimeQueryInvalidation } from '../../hooks/useRealtimeQueryInvalidation';
import { HomeScreenView } from './home-screen/HomeScreenView';

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

  const realtimeTargets = useMemo(
    () => [
      {
        key: 'home-businesses',
        table: 'businesses',
        queryKeys: [['for-you'], ['trending'], ['featured-businesses'], ['home-search']],
      },
      {
        key: 'home-events-and-specials',
        table: 'events_and_specials',
        queryKeys: [['events-specials-preview']],
      },
      {
        key: 'home-reviews',
        table: 'reviews',
        queryKeys: [['recent-reviews'], ['top-reviewers'], ['trending'], ['for-you'], ['featured-businesses']],
      },
      {
        key: 'home-review-helpful-votes',
        table: 'review_helpful_votes',
        queryKeys: [['recent-reviews'], ['top-reviewers']],
      },
    ],
    []
  );

  useRealtimeQueryInvalidation(realtimeTargets);

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

  const navigateToBusinessFromSuggestion = useCallback((id: string) => {
    router.push(routes.businessDetail(id) as never);
  }, [router]);

  const activeFilterCount = (minRating != null ? 1 : 0) + (distanceKm != null ? 1 : 0);

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
    <HomeScreenView
      user={user ? { id: user.id } : null}
      homeFeedRef={homeFeedRef}
      searchResultsRef={searchResultsRef}
      isSearchActive={isSearchActive}
      searchInput={searchInput}
      setSearchInput={setSearchInput}
      searchIsFetching={search.isFetching}
      searchBusinesses={search.businesses}
      searchIsLoading={search.isLoading}
      searchError={search.error}
      debouncedQuery={debouncedQuery}
      minRating={minRating}
      distanceKm={distanceKm}
      locationDenied={locationDenied}
      setMinRating={setMinRating}
      setDistanceKm={setDistanceKm}
      setLocationDenied={setLocationDenied}
      handleDistanceChange={handleDistanceChange}
      handleRefresh={handleRefresh}
      refreshing={refreshing}
      handleScroll={handleScroll}
      headerCollapsed={headerCollapsed}
      headerPaddingTop={headerPaddingTop}
      headerPaddingBottom={headerPaddingBottom}
      headerRowHeight={headerRowHeight}
      headerRowOpacity={headerRowOpacity}
      headerRowTranslateY={headerRowTranslateY}
      headerRowScale={headerRowScale}
      headerMaterialOpacity={headerMaterialOpacity}
      searchBarMarginTop={searchBarMarginTop}
      searchBarTranslateY={searchBarTranslateY}
      searchBarScale={searchBarScale}
      forYou={{ businesses: forYou.businesses, isLoading: forYou.isLoading, error: forYou.error }}
      trending={{ data: trending.data, isLoading: trending.isLoading, error: trending.error instanceof Error ? trending.error : null }}
      events={{ items: events.items, isLoading: events.isLoading, error: events.error }}
      reviewers={{ reviewers: reviewers.reviewers, mode: reviewers.mode, isLoading: reviewers.isLoading, error: reviewers.error }}
      recentReviews={{ reviews: recentReviews.reviews, isLoading: recentReviews.isLoading, error: recentReviews.error }}
      featured={{ featuredBusinesses: featured.featuredBusinesses, isLoading: featured.isLoading, error: featured.error }}
      activeFilterCount={activeFilterCount}
      onSelectSuggestion={navigateToBusinessFromSuggestion}
      navigateToReviewer={navigateToReviewer}
      onNavigateForYou={() => router.push(routes.forYou() as never)}
      onNavigateTrending={() => router.push(routes.trending() as never)}
      onNavigateEvents={() => router.push(routes.eventsSpecials() as never)}
      onNavigateLeaderboardContributors={() => router.push(routes.leaderboard('contributors') as never)}
      onNavigateLeaderboardBusinesses={() => router.push(routes.leaderboard('businesses') as never)}
      onNavigateBadges={() => router.push(routes.badges() as never)}
      onNavigateOnboarding={() => router.push(routes.onboarding() as never)}
    />
  );
}
