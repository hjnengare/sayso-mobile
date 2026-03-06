import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
  type ListRenderItem,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import type { BusinessListItemDto } from '@sayso/contracts';
import { EmptyState } from '../../components/EmptyState';
import { Text } from '../../components/Typography';
import { BusinessCard } from '../../components/BusinessCard';
import { SkeletonBusinessCard } from '../../components/feed/SkeletonBusinessCard';
import { useTrending } from '../../hooks/useTrending';
import { useBusinessSearch } from '../../hooks/useBusinessSearch';
import { businessDetailColors } from '../../components/business-detail/styles';
import { TrendingMapView } from './TrendingMapView';

const VISIBLE_CHUNK = 12;
const BACK_TO_TOP_THRESHOLD = 900;

const DISTANCE_OPTIONS = [1, 5, 10, 20] as const;
const RATING_OPTIONS = [3.0, 3.5, 4.0, 4.5] as const;

type FilterState = {
  minRating: number | null;
  radiusKm: number | null;
};

function ItemSeparator() {
  return <View style={styles.separator} />;
}

export default function TrendingScreen() {
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

  const handleScroll = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setShowBackToTop(e.nativeEvent.contentOffset.y > BACK_TO_TOP_THRESHOLD);
  }, []);

  const keyExtractor = useCallback((item: BusinessListItemDto) => item.id, []);
  const renderItem = useCallback<ListRenderItem<BusinessListItemDto>>(
    ({ item }) => <BusinessCard business={item} />,
    []
  );

  // ── Sub-components ────────────────────────────────────────────────────────
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
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchWrap}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={businessDetailColors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={inputValue}
            onChangeText={handleInputChange}
            placeholder="Search trending businesses..."
            placeholderTextColor={businessDetailColors.textSubtle}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            clearButtonMode="never"
          />
          {inputValue.length > 0 && (
            <Pressable onPress={handleClearSearch} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={businessDetailColors.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Inline filters — visible when searching */}
      {isSearching && (
        <View style={styles.filtersWrap}>
          {/* Distance */}
          <View style={styles.filterGroup}>
            <View style={styles.filterLabelRow}>
              <Ionicons name="location-outline" size={13} color={businessDetailColors.textMuted} />
              <Text style={styles.filterLabelText}>Distance</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillRow}
            >
              {DISTANCE_OPTIONS.map((km) => {
                const active = filters.radiusKm === km;
                return (
                  <Pressable
                    key={km}
                    style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
                    onPress={() => handleDistanceSelect(km)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        active ? styles.pillTextActive : styles.pillTextInactive,
                      ]}
                    >
                      {km} km
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Rating */}
          <View style={styles.filterGroup}>
            <View style={styles.filterLabelRow}>
              <Ionicons name="star" size={13} color={businessDetailColors.textMuted} />
              <Text style={styles.filterLabelText}>Min Rating</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.pillRow}
            >
              {RATING_OPTIONS.map((r) => {
                const active = filters.minRating === r;
                return (
                  <Pressable
                    key={r}
                    style={[styles.pill, active ? styles.pillActive : styles.pillInactive]}
                    onPress={() => handleRatingSelect(r)}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        active ? styles.pillTextActive : styles.pillTextInactive,
                      ]}
                    >
                      {r.toFixed(1)}+
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </View>
      )}

      {/* Active filter badges */}
      {hasFilters && (
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
      )}

      {/* List / Map toggle */}
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
            <Text
              style={[
                styles.toggleBtnText,
                !isMapMode ? styles.toggleBtnTextActive : styles.toggleBtnTextInactive,
              ]}
            >
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
            <Text
              style={[
                styles.toggleBtnText,
                isMapMode ? styles.toggleBtnTextActive : styles.toggleBtnTextInactive,
              ]}
            >
              Map
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Content */}
      {isMapMode ? (
        <TrendingMapView businesses={mapBusinesses} userLocation={userLocation} />
      ) : (
        <FlatList
          ref={listRef}
          data={isLoading ? [] : visibleBusinesses}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ItemSeparatorComponent={ItemSeparator}
          ListEmptyComponent={listEmpty}
          ListFooterComponent={listFooter}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />
          }
          onScroll={handleScroll}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          windowSize={5}
          removeClippedSubviews
        />
      )}

      {/* Back to top */}
      {showBackToTop && !isMapMode && (
        <Pressable
          style={({ pressed }) => [styles.backToTop, pressed && styles.backToTopPressed]}
          onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })}
        >
          <Text style={styles.backToTopText}>↑ Top</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: businessDetailColors.page,
  },

  // Search bar
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(45,55,72,0.12)',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: businessDetailColors.charcoal,
    fontFamily: 'Urbanist_500Medium',
    padding: 0,
  },

  // Inline filters
  filtersWrap: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 10,
  },
  filterGroup: {
    gap: 6,
  },
  filterLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  filterLabelText: {
    fontSize: 12,
    fontWeight: '600',
    color: businessDetailColors.textMuted,
  },
  pillRow: {
    gap: 8,
    paddingRight: 4,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillActive: {
    backgroundColor: businessDetailColors.coral,
    borderColor: businessDetailColors.coral,
  },
  pillInactive: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderColor: 'rgba(45,55,72,0.18)',
  },
  pillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextActive: {
    color: businessDetailColors.white,
  },
  pillTextInactive: {
    color: businessDetailColors.charcoal,
  },

  // Active filter badges
  activeBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingBottom: 8,
    gap: 8,
    alignItems: 'center',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: businessDetailColors.sage,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: businessDetailColors.white,
  },
  clearBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(45,55,72,0.2)',
  },
  clearBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: businessDetailColors.textMuted,
  },

  // List / Map toggle
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  togglePill: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: 999,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(45,55,72,0.1)',
  },
  toggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  toggleBtnActiveList: {
    backgroundColor: businessDetailColors.cardBg,
  },
  toggleBtnActiveMap: {
    backgroundColor: businessDetailColors.coral,
  },
  toggleBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  toggleBtnTextActive: {
    color: businessDetailColors.white,
  },
  toggleBtnTextInactive: {
    color: businessDetailColors.charcoal,
  },

  // List
  list: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 80,
    flexGrow: 1,
  },
  separator: {
    height: 12,
  },
  skeletonStack: {
    gap: 12,
    paddingTop: 4,
  },
  loadMoreBtn: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.8)',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(45,55,72,0.12)',
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: businessDetailColors.charcoal,
  },
  footerSpacer: {
    height: 24,
  },


  // Back to top
  backToTop: {
    position: 'absolute',
    right: 20,
    bottom: 28,
    minHeight: 44,
    paddingHorizontal: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(45,55,72,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  backToTopPressed: {
    opacity: 0.92,
  },
  backToTopText: {
    fontSize: 13,
    fontWeight: '700',
    color: businessDetailColors.charcoal,
  },
});
