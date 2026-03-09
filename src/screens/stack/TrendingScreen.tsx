import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  FlatList,
  Pressable,
  ScrollView,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BusinessListItemDto } from '@sayso/contracts';
import { EmptyState } from '../../components/EmptyState';
import { TransitionItem } from '../../components/motion/TransitionItem';
import { Text } from '../../components/Typography';
import { BusinessCard } from '../../components/BusinessCard';
import { SkeletonBusinessCard } from '../../components/feed/SkeletonBusinessCard';
import { useTrending } from '../../hooks/useTrending';
import { useBusinessSearch } from '../../hooks/useBusinessSearch';
import { useRealtimeQueryInvalidation } from '../../hooks/useRealtimeQueryInvalidation';
import { businessDetailColors } from '../../components/business-detail/styles';
import { TrendingScreenView } from './trending-screen/TrendingScreenView';
import { styles } from './trending-screen/trendingStyles';
import { HomeSearchBar } from '../tabs/home/HomeSearchBar';

const VISIBLE_CHUNK = 12;
const BACK_TO_TOP_THRESHOLD = 900;

const DISTANCE_OPTIONS = [1, 5, 10, 20] as const;
const RATING_OPTIONS = [3.0, 3.5, 4.0, 4.5] as const;

type FilterState = {
  minRating: number | null;
  radiusKm: number | null;
};

const NAVBAR_BG = '#722F37';
const SCROLL_COLOR_THRESHOLD = 60;

export default function TrendingScreen() {
  const navigation = useNavigation();
  const headerCollapsedRef = useRef(false);
  const pendingScrollYRef = useRef(0);
  const scrollRafRef = useRef<number | null>(null);

  // Search
  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Filters
  const [filters, setFilters] = useState<FilterState>({ minRating: null, radiusKm: null });
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // View mode
  const [isMapMode, setIsMapMode] = useState(false);

  // Pagination / scroll
  const [visibleCount, setVisibleCount] = useState(VISIBLE_CHUNK);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const listRef = useRef<FlatList<BusinessListItemDto>>(null);
  const isSearching = debouncedQuery.trim().length >= 1;
  const hasFilters = filters.minRating !== null || filters.radiusKm !== null;

  // ── Data ──────────────────────────────────────────────────────────────────
  const trendingQuery = useTrending(50, !isSearching);
  const searchQuery = useBusinessSearch({
    query: debouncedQuery,
    minRating: filters.minRating,
    radiusKm: filters.radiusKm,
    lat: userLocation?.lat ?? null,
    lng: userLocation?.lng ?? null,
  });

  const allBusinesses = useMemo(
    () => (isSearching ? (searchQuery.data ?? []) : (trendingQuery.data?.businesses ?? [])),
    [isSearching, searchQuery.data, trendingQuery.data]
  );

  const isLoading = isSearching ? searchQuery.isLoading : trendingQuery.isLoading;
  const isError = isSearching ? searchQuery.isError : trendingQuery.isError;
  const isRefetching =
    (trendingQuery.isRefetching || searchQuery.isRefetching) && !isLoading;

  const visibleBusinesses = useMemo(
    () => allBusinesses.slice(0, visibleCount),
    [allBusinesses, visibleCount]
  );
  const hasMore = visibleCount < allBusinesses.length;

  const mapBusinesses = useMemo(
    () => allBusinesses.filter((b) => b.lat != null && b.lng != null),
    [allBusinesses]
  );

  const realtimeTargets = useMemo(
    () => [
      {
        key: 'trending-businesses',
        table: 'businesses',
        queryKeys: [['trending'], ['business-search']],
      },
      {
        key: 'trending-reviews',
        table: 'reviews',
        queryKeys: [['trending'], ['business-search']],
      },
      {
        key: 'trending-review-helpful-votes',
        table: 'review_helpful_votes',
        queryKeys: [['trending']],
      },
    ],
    []
  );

  useRealtimeQueryInvalidation(realtimeTargets);

  // Reset visible count when mode/query changes
  useEffect(() => {
    setVisibleCount(VISIBLE_CHUNK);
  }, [isSearching, debouncedQuery]);

  // Refetch when app returns to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') return;
      if (isSearching) void searchQuery.refetch();
      else void trendingQuery.refetch();
    });
    return () => sub.remove();
  }, [isSearching, searchQuery, trendingQuery]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleInputChange = useCallback((text: string) => {
    setInputValue(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(text);
      setVisibleCount(VISIBLE_CHUNK);
    }, 300);
  }, []);

  const handleClearSearch = useCallback(() => {
    setInputValue('');
    setDebouncedQuery('');
    setVisibleCount(VISIBLE_CHUNK);
  }, []);

  const handleDistanceSelect = useCallback(
    (km: number) => {
      const next = filters.radiusKm === km ? null : km;
      setFilters((prev) => ({ ...prev, radiusKm: next }));
      if (next !== null && !userLocation) {
        void (async () => {
          const { granted } = await Location.requestForegroundPermissionsAsync();
          if (!granted) return;
          const pos = await Location.getCurrentPositionAsync({});
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        })();
      }
    },
    [filters.radiusKm, userLocation]
  );

  const handleRatingSelect = useCallback((rating: number) => {
    setFilters((prev) => ({ ...prev, minRating: prev.minRating === rating ? null : rating }));
  }, []);

  const handleClearFilters = useCallback(() => {
    setFilters({ minRating: null, radiusKm: null });
    setUserLocation(null);
  }, []);

  const handleRefresh = useCallback(() => {
    setVisibleCount(VISIBLE_CHUNK);
    if (isSearching) void searchQuery.refetch();
    else void trendingQuery.refetch();
  }, [isSearching, searchQuery, trendingQuery]);

  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + VISIBLE_CHUNK, allBusinesses.length));
  }, [allBusinesses.length]);

  const applyScrollState = useCallback(
    (y: number) => {
      const shouldShowBackToTop = y > BACK_TO_TOP_THRESHOLD;
      setShowBackToTop((current) => (current === shouldShowBackToTop ? current : shouldShowBackToTop));

      const collapsed = y > SCROLL_COLOR_THRESHOLD;
      if (collapsed === headerCollapsedRef.current) return;
      headerCollapsedRef.current = collapsed;
      navigation.setOptions({
        headerStyle: {
          backgroundColor: collapsed ? NAVBAR_BG : businessDetailColors.page,
        },
        headerTintColor: collapsed ? '#FFFFFF' : businessDetailColors.charcoal,
      });
    },
    [navigation]
  );

  const handleScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      pendingScrollYRef.current = e.nativeEvent.contentOffset.y;
      if (scrollRafRef.current != null) return;
      scrollRafRef.current = requestAnimationFrame(() => {
        scrollRafRef.current = null;
        applyScrollState(pendingScrollYRef.current);
      });
    },
    [applyScrollState]
  );

  useEffect(() => {
    return () => {
      if (scrollRafRef.current != null) {
        cancelAnimationFrame(scrollRafRef.current);
      }
    };
  }, []);

  const keyExtractor = useCallback((item: BusinessListItemDto) => item.id, []);
  const renderItem = useCallback<ListRenderItem<BusinessListItemDto>>(
    ({ item, index }) => (
      <TransitionItem variant="listItem" index={index}>
        <BusinessCard business={item} />
      </TransitionItem>
    ),
    []
  );

  // ── Sub-components ────────────────────────────────────────────────────────
  const listHeader = useMemo(() => (
    <View>
      {/* Hero */}
      <TransitionItem variant="header" index={0}>
        <View style={styles.hero}>
          <Text style={styles.heroTitle}>Trending Now</Text>
          <Text style={styles.heroDesc}>See what's hot right now!</Text>
        </View>
      </TransitionItem>

      {/* Search bar */}
      <TransitionItem variant="input" index={1}>
        <View style={styles.searchWrap}>
          <HomeSearchBar
            value={inputValue}
            onChangeText={handleInputChange}
            onClear={handleClearSearch}
            isFetching={isSearching && searchQuery.isFetching}
          />
        </View>
      </TransitionItem>

      {/* Inline filters — visible when searching */}
      {isSearching && (
        <TransitionItem variant="card" index={2}>
          <View style={styles.filtersWrap}>
          <View style={styles.filterGroup}>
            <View style={styles.filterLabelRow}>
              <Ionicons name="location-outline" size={13} color={businessDetailColors.textMuted} />
              <Text style={styles.filterLabelText}>Distance</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
              {DISTANCE_OPTIONS.map((km) => {
                const active = filters.radiusKm === km;
                return (
                  <Pressable
                    key={km}
                    style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
                    onPress={() => handleDistanceSelect(km)}
                  >
                    <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextInactive]}>
                      {km} km
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.filterGroup}>
            <View style={styles.filterLabelRow}>
              <Ionicons name="star" size={13} color={businessDetailColors.textMuted} />
              <Text style={styles.filterLabelText}>Min Rating</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pillRow}>
              {RATING_OPTIONS.map((r) => {
                const active = filters.minRating === r;
                return (
                  <Pressable
                    key={r}
                    style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
                    onPress={() => handleRatingSelect(r)}
                  >
                    <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextInactive]}>
                      {r.toFixed(1)}+
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
          </View>
        </TransitionItem>
      )}

      {/* Active filter badges */}
      {hasFilters && (
        <TransitionItem variant="card" index={3}>
          <View style={styles.activeBadgesRow}>
          {filters.minRating !== null && (
            <Pressable
              style={styles.activeBadge}
              onPress={() => setFilters((prev) => ({ ...prev, minRating: null }))}
            >
              <Text style={styles.activeBadgeText}>★ {filters.minRating.toFixed(1)}+</Text>
              <Ionicons name="close" size={11} color={businessDetailColors.white} />
            </Pressable>
          )}
          {filters.radiusKm !== null && (
            <Pressable
              style={styles.activeBadge}
              onPress={() => setFilters((prev) => ({ ...prev, radiusKm: null }))}
            >
              <Text style={styles.activeBadgeText}>{filters.radiusKm} km</Text>
              <Ionicons name="close" size={11} color={businessDetailColors.white} />
            </Pressable>
          )}
          <Pressable style={styles.clearBadge} onPress={handleClearFilters}>
            <Text style={styles.clearBadgeText}>Clear all</Text>
          </Pressable>
          </View>
        </TransitionItem>
      )}

      {/* List / Map toggle */}
      <TransitionItem variant="card" index={4}>
        <View style={styles.toggleRow}>
          <View style={styles.togglePill}>
            <Pressable
              style={[styles.toggleBtn, !isMapMode && styles.toggleBtnActiveList]}
              onPress={() => setIsMapMode(false)}
            >
              <Ionicons
                name="list-outline"
                size={14}
                color={!isMapMode ? businessDetailColors.white : businessDetailColors.charcoal}
              />
              <Text style={[styles.toggleBtnText, !isMapMode ? styles.toggleBtnTextActive : styles.toggleBtnTextInactive]}>
                List
              </Text>
            </Pressable>
            <Pressable
              style={[styles.toggleBtn, isMapMode && styles.toggleBtnActiveMap]}
              onPress={() => setIsMapMode(true)}
            >
              <Ionicons
                name="map-outline"
                size={14}
                color={isMapMode ? businessDetailColors.white : businessDetailColors.charcoal}
              />
              <Text style={[styles.toggleBtnText, isMapMode ? styles.toggleBtnTextActive : styles.toggleBtnTextInactive]}>
                Map
              </Text>
            </Pressable>
          </View>
        </View>
      </TransitionItem>
    </View>
  ), [
    inputValue, handleInputChange, handleClearSearch,
    isSearching, filters, hasFilters,
    handleDistanceSelect, handleRatingSelect, handleClearFilters,
    isMapMode, searchQuery.isFetching,
  ]);

  const listFooter = useMemo(() => {
    if (isLoading) return null;
    if (hasMore) {
      return (
        <Pressable style={styles.loadMoreBtn} onPress={handleLoadMore}>
          <Text style={styles.loadMoreText}>Load More</Text>
        </Pressable>
      );
    }
    return <View style={styles.footerSpacer} />;
  }, [isLoading, hasMore, handleLoadMore]);

  const listEmpty = useMemo(() => {
    if (isLoading) {
      return (
        <View style={styles.skeletonStack}>
          {Array.from({ length: 5 }, (_, i) => (
            <SkeletonBusinessCard key={i} />
          ))}
        </View>
      );
    }
    if (isError) {
      return (
        <EmptyState
          icon="wifi-outline"
          title="Couldn't load businesses"
          message="Pull to refresh and try again."
        />
      );
    }
    if (isSearching) {
      return (
        <EmptyState
          icon="search-outline"
          title={`No results for "${debouncedQuery}"`}
          message="Try adjusting your search or filters."
        />
      );
    }
    return (
      <EmptyState
        icon="storefront-outline"
        title="No trending businesses yet"
        message="Check back shortly for updated recommendations."
      />
    );
  }, [isLoading, isError, isSearching, debouncedQuery]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <TrendingScreenView
      isMapMode={isMapMode}
      listHeader={listHeader}
      mapBusinesses={mapBusinesses}
      userLocation={userLocation}
      isLoading={isLoading}
      visibleBusinesses={visibleBusinesses}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      listEmpty={listEmpty}
      listFooter={listFooter}
      isRefetching={isRefetching}
      handleRefresh={handleRefresh}
      handleScroll={handleScroll}
      onScrollToTop={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
      showBackToTop={showBackToTop}
      listRef={listRef}
    />
  );
}
