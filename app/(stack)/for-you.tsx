import { useCallback, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type ListRenderItem, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { useNavigation } from 'expo-router';
import type { BusinessListItemDto, PaginatedBusinessFeedResponseDto } from '@sayso/contracts';
import { BusinessCard } from '../../src/components/BusinessCard';
import { EmptyState } from '../../src/components/EmptyState';
import { SkeletonBusinessCard } from '../../src/components/feed/SkeletonBusinessCard';
import { Text } from '../../src/components/Typography';
import { useAuthSession } from '../../src/hooks/useSession';
import { useUserPreferences } from '../../src/hooks/useUserPreferences';
import { useBusinessSearch } from '../../src/hooks/useBusinessSearch';
import { useRealtimeQueryInvalidation } from '../../src/hooks/useRealtimeQueryInvalidation';
import { apiFetch } from '../../src/lib/api';
import { routes } from '../../src/navigation/routes';
import { homeTokens } from '../../src/screens/tabs/home/HomeTokens';
import { TransitionItem } from '../../src/components/motion/TransitionItem';
import { ForYouRouteView } from '../../src/screens/stack/for-you-screen/ForYouRouteView';
import { HomeSearchBar } from '../../src/screens/tabs/home/HomeSearchBar';

const REQUEST_LIMIT = 120;
const VISIBLE_CHUNK_SIZE = 12;
const NAVBAR_BG = '#722F37';
const SCROLL_COLOR_THRESHOLD = 60;
const BACK_TO_TOP_THRESHOLD = 900;

export default function ForYouRoute() {
  const router = useRouter();
  const navigation = useNavigation();
  const headerCollapsedRef = useRef(false);
  const { user } = useAuthSession();
  const preferences = useUserPreferences(Boolean(user));

  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSearching = debouncedQuery.trim().length >= 1;

  const [showBackToTop, setShowBackToTop] = useState(false);
  const listRef = useRef<import('react-native').FlatList<BusinessListItemDto>>(null);

  const searchQuery = useBusinessSearch({ query: debouncedQuery });
  const searchResults = searchQuery.data ?? [];

  const realtimeTargets = useMemo(
    () => [
      {
        key: 'for-you-businesses',
        table: 'businesses',
        queryKeys: [['for-you'], ['business-search']],
      },
      {
        key: 'for-you-reviews',
        table: 'reviews',
        queryKeys: [['for-you'], ['business-search']],
      },
      {
        key: 'for-you-review-helpful-votes',
        table: 'review_helpful_votes',
        queryKeys: [['for-you']],
      },
    ],
    []
  );

  useRealtimeQueryInvalidation(realtimeTargets);

  const preferenceIds = useMemo(
    () => ({
      interests: preferences.interests.map((item) => item.id),
      subcategories: preferences.subcategories.map((item) => item.id),
      dealbreakers: preferences.dealbreakers.map((item) => item.id),
    }),
    [preferences.dealbreakers, preferences.interests, preferences.subcategories]
  );

  const hasPreferences =
    preferenceIds.interests.length > 0 ||
    preferenceIds.subcategories.length > 0 ||
    preferenceIds.dealbreakers.length > 0;

  const handleInputChange = useCallback((text: string) => {
    setInputValue(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedQuery(text), 300);
  }, []);

  const handleClearSearch = useCallback(() => {
    setInputValue('');
    setDebouncedQuery('');
  }, []);

  const handleScrollY = useCallback(
    (y: number) => {
      const collapsed = y > SCROLL_COLOR_THRESHOLD;
      if (collapsed === headerCollapsedRef.current) return;
      headerCollapsedRef.current = collapsed;
      navigation.setOptions({
        headerStyle: {
          backgroundColor: collapsed ? NAVBAR_BG : homeTokens.offWhite,
        },
        headerTintColor: collapsed ? '#FFFFFF' : homeTokens.charcoal,
      });
    },
    [navigation]
  );

  const handleSearchScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = e.nativeEvent.contentOffset.y;
      const shouldShow = y > BACK_TO_TOP_THRESHOLD;
      setShowBackToTop((current) => (current === shouldShow ? current : shouldShow));
      handleScrollY(y);
    },
    [handleScrollY]
  );

  const fetchForYouPage = useCallback(
    (cursor: string | null) => {
      const params = new URLSearchParams();
      params.set('limit', String(REQUEST_LIMIT));
      params.set('feed_strategy', 'mixed');
      if (preferenceIds.interests.length > 0) {
        params.set('interest_ids', preferenceIds.interests.join(','));
      }
      if (preferenceIds.subcategories.length > 0) {
        params.set('sub_interest_ids', preferenceIds.subcategories.join(','));
      }
      if (preferenceIds.dealbreakers.length > 0) {
        params.set('dealbreakers', preferenceIds.dealbreakers.join(','));
      }
      if (cursor) {
        params.set('cursor', cursor);
      }
      return apiFetch<PaginatedBusinessFeedResponseDto>(`/api/businesses?${params.toString()}`);
    },
    [preferenceIds]
  );

  const keyExtractor = useCallback((item: BusinessListItemDto) => item.id, []);
  const renderItem = useCallback<ListRenderItem<BusinessListItemDto>>(
    ({ item, index }) => (
      <TransitionItem variant="listItem" index={index + 1} animate={index < VISIBLE_CHUNK_SIZE}>
        <BusinessCard business={item} />
      </TransitionItem>
    ),
    []
  );

  const heroSection = useMemo(
    () => (
      <View style={styles.heroSection}>
        <TransitionItem variant="header" index={0}>
          <Text style={styles.heroTitle}>Curated Just For You</Text>
          <Text style={styles.heroDesc}>
            Businesses tailored to your interests and preferences — a personalised discovery feed for your next outing.
          </Text>
        </TransitionItem>
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
      </View>
    ),
    [inputValue, handleInputChange, handleClearSearch, isSearching, searchQuery.isFetching]
  );

  const resultsHeader = useMemo(
    () => (
      <View>
        {heroSection}
        {searchQuery.data !== undefined && (
          <TransitionItem variant="card" index={2}>
            <Text style={styles.resultsCount}>
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''} for &ldquo;{debouncedQuery}&rdquo;
            </Text>
          </TransitionItem>
        )}
      </View>
    ),
    [debouncedQuery, heroSection, searchQuery.data, searchResults.length]
  );

  const searchEmpty = useMemo(() => {
    if (searchQuery.isLoading) {
      return (
        <View style={styles.skeletonStack}>
          {Array.from({ length: 5 }, (_, i) => (
            <SkeletonBusinessCard key={i} />
          ))}
        </View>
      );
    }

    if (searchQuery.isError) {
      return <EmptyState icon="wifi-outline" title="Couldn't load results" message="Pull to refresh and try again." />;
    }

    return (
      <EmptyState
        icon="search-outline"
        title={`No results for "${debouncedQuery}"`}
        message="Try a different search term."
      />
    );
  }, [debouncedQuery, searchQuery.isError, searchQuery.isLoading]);

  return (
    <ForYouRouteView
      userId={user?.id ?? null}
      isSearching={isSearching}
      showBackToTop={showBackToTop}
      listRef={listRef}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      searchResults={searchResults}
      searchLoading={searchQuery.isLoading}
      searchError={searchQuery.isError}
      debouncedQuery={debouncedQuery}
      heroSection={heroSection}
      resultsHeader={resultsHeader}
      searchEmpty={searchEmpty}
      handleSearchScroll={handleSearchScroll}
      preferencesLoading={preferences.isLoading}
      preferencesError={preferences.error}
      hasPreferences={hasPreferences}
      fetchForYouPage={fetchForYouPage}
      preferenceIds={preferenceIds}
      handleScrollY={handleScrollY}
      onPressOnboarding={() => router.push(routes.onboarding() as never)}
    />
  );
}

const styles = StyleSheet.create({
  heroSection: {
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 4,
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: homeTokens.charcoal,
  },
  heroDesc: {
    fontSize: 15,
    lineHeight: 22,
    color: homeTokens.textSecondary,
    marginTop: 6,
    marginBottom: 2,
  },
  searchWrap: {
    paddingTop: 12,
    paddingBottom: 4,
  },
  resultsCount: {
    fontSize: 13,
    color: homeTokens.textSecondary,
    paddingHorizontal: 4,
    paddingBottom: 8,
  },
  skeletonStack: {
    gap: 12,
  },
});
