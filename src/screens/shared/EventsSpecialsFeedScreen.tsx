import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, View, type ListRenderItem, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useInfiniteQuery } from '@tanstack/react-query';
import type { EventSpecialListItemDto, EventsAndSpecialsResponseDto } from '@sayso/contracts';
import { apiFetch } from '../../lib/api';
import { EventCard } from '../../components/EventCard';
import { EventCardSkeleton } from '../../components/EventCardSkeleton';
import { EmptyState } from '../../components/EmptyState';
import { Text } from '../../components/Typography';
import { FeedFooter } from '../../components/feed/FeedFooter';
import { LoadMoreButton } from '../../components/feed/LoadMoreButton';
import { useGlobalScrollToTop } from '../../hooks/useGlobalScrollToTop';
import { useRealtimeQueryInvalidation } from '../../hooks/useRealtimeQueryInvalidation';
import { TransitionItem } from '../../components/motion/TransitionItem';
import { EventsSpecialsFeedView, eventsSpecialsFeedStyles as s, type ListItem } from './events-specials-feed/EventsSpecialsFeedView';

const REQUEST_LIMIT = 20;
const VISIBLE_CHUNK_SIZE = 12;
const BACK_TO_TOP_THRESHOLD = 900;
const EVENT_FEED_SCROLL_OFFSETS = new Map<string, number>();
const EMPTY_ITEMS: EventSpecialListItemDto[] = [];

type FilterType = 'all' | 'event' | 'special';

function fetchEventsPage(cursor: string | null, filterType: FilterType) {
  const params = new URLSearchParams();
  params.set('limit', String(REQUEST_LIMIT));
  if (cursor) params.set('cursor', cursor);
  if (filterType !== 'all') params.set('type', filterType);
  return apiFetch<EventsAndSpecialsResponseDto>(`/api/events-and-specials?${params.toString()}`);
}

type Props = {
  subtitle: string;
  onScrollY?: (y: number) => void;
};

export function EventsSpecialsFeedScreen({ subtitle, onScrollY }: Props) {
  const listRef = useRef<FlatList<ListItem>>(null);
  const hasRestoredScrollRef = useRef(false);
  const initialOffset = EVENT_FEED_SCROLL_OFFSETS.get('events-specials') ?? 0;

  const [selectedFilter, setSelectedFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showScrollTopButton, setShowScrollTopButton] = useState(initialOffset > BACK_TO_TOP_THRESHOLD);
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(VISIBLE_CHUNK_SIZE);

  const realtimeTargets = useMemo(
    () => [
      {
        key: 'events-feed-events-and-specials',
        table: 'events_and_specials',
        queryKeys: [['events-specials-feed'], ['events-specials-preview']],
      },
      {
        key: 'events-feed-reviews',
        table: 'reviews',
        queryKeys: [['events-specials-feed'], ['events-specials-preview']],
      },
    ],
    []
  );

  useRealtimeQueryInvalidation(realtimeTargets);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    setVisibleCount(VISIBLE_CHUNK_SIZE);
    setLoadMoreError(null);
  }, [selectedFilter, debouncedQuery]);

  const handleScrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  useGlobalScrollToTop({ visible: showScrollTopButton, enabled: true, onScrollToTop: handleScrollToTop });

  const query = useInfiniteQuery({
    queryKey: ['events-specials-feed', REQUEST_LIMIT, selectedFilter],
    initialPageParam: null as string | null,
    queryFn: ({ pageParam }) => fetchEventsPage(pageParam, selectedFilter),
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    staleTime: 30_000,
  });

  const items = useMemo(
    () => query.data?.pages.flatMap((p) => p.items ?? EMPTY_ITEMS) ?? EMPTY_ITEMS,
    [query.data]
  );

  const filteredItems = useMemo(() => {
    if (!debouncedQuery) return items;
    const q = debouncedQuery.toLowerCase();
    return items.filter((item) => {
      const text = `${item.title ?? ''} ${(item as any).location ?? ''} ${item.description ?? ''}`.toLowerCase();
      return text.includes(q);
    });
  }, [items, debouncedQuery]);

  const visibleItems = useMemo(() => filteredItems.slice(0, visibleCount), [filteredItems, visibleCount]);
  const hasNextPage = Boolean(query.hasNextPage);
  const hasBufferedItems = filteredItems.length > visibleCount;

  const listData = useMemo((): ListItem[] => {
    if (selectedFilter !== 'all') return visibleItems;
    const events = visibleItems.filter((i) => i.type === 'event');
    const specials = visibleItems.filter((i) => i.type === 'special');
    const result: ListItem[] = [];
    if (events.length > 0) {
      result.push({ _section: true, title: 'Events', id: 'h-events' });
      result.push(...events);
    }
    if (specials.length > 0) {
      result.push({ _section: true, title: 'Specials', id: 'h-specials' });
      result.push(...specials);
    }
    return result;
  }, [visibleItems, selectedFilter]);

  const countText = useMemo(() => {
    const ev = filteredItems.filter((i) => i.type === 'event').length;
    const sp = filteredItems.filter((i) => i.type === 'special').length;
    if (selectedFilter === 'event') return `${ev} event${ev !== 1 ? 's' : ''}`;
    if (selectedFilter === 'special') return `${sp} special${sp !== 1 ? 's' : ''}`;
    if (ev > 0 && sp > 0) return `${ev} event${ev !== 1 ? 's' : ''} · ${sp} special${sp !== 1 ? 's' : ''}`;
    if (ev > 0) return `${ev} event${ev !== 1 ? 's' : ''}`;
    if (sp > 0) return `${sp} special${sp !== 1 ? 's' : ''}`;
    return '';
  }, [filteredItems, selectedFilter]);

  useEffect(() => {
    if (hasRestoredScrollRef.current || initialOffset <= 0 || listData.length === 0) return;
    hasRestoredScrollRef.current = true;
    requestAnimationFrame(() => {
      listRef.current?.scrollToOffset({ offset: initialOffset, animated: false });
    });
  }, [initialOffset, listData.length]);

  useEffect(() => {
    if (!hasNextPage && !hasBufferedItems) setLoadMoreError(null);
  }, [hasBufferedItems, hasNextPage]);

  const keyExtractor = useCallback(
    (item: ListItem) => ('_section' in item ? item.id : `${item.type}:${item.id}`),
    []
  );

  const renderItem = useCallback<ListRenderItem<ListItem>>(({ item, index }) => {
    if ('_section' in item) {
      return (
        <TransitionItem variant="header" index={index} animate={index < VISIBLE_CHUNK_SIZE}>
          <View style={[s.sectionHeader, index > 0 && s.sectionHeaderGap]}>
            <Text style={s.sectionTitle}>{item.title}</Text>
          </View>
        </TransitionItem>
      );
    }
    return (
      <TransitionItem variant="listItem" index={index} animate={index < VISIBLE_CHUNK_SIZE}>
        <View style={s.cardWrap}>
          <EventCard item={item} />
        </View>
      </TransitionItem>
    );
  }, []);

  const handleRefresh = useCallback(() => {
    setLoadMoreError(null);
    setVisibleCount(VISIBLE_CHUNK_SIZE);
    void query.refetch();
  }, [query]);

  const handleLoadMore = useCallback(async () => {
    if (hasBufferedItems) {
      setVisibleCount((c) => Math.min(c + VISIBLE_CHUNK_SIZE, filteredItems.length));
      return;
    }
    if (query.isFetchingNextPage || !hasNextPage) return;
    setLoadMoreError(null);
    const result = await query.fetchNextPage();
    if (result.isError) {
      setLoadMoreError("Couldn't load more right now. Tap to try again.");
      return;
    }
    setVisibleCount((c) => c + VISIBLE_CHUNK_SIZE);
  }, [hasBufferedItems, hasNextPage, filteredItems.length, query]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = event.nativeEvent.contentOffset.y;
    EVENT_FEED_SCROLL_OFFSETS.set('events-specials', y);
    const shouldShow = y > BACK_TO_TOP_THRESHOLD;
    setShowScrollTopButton((c) => (c === shouldShow ? c : shouldShow));
    onScrollY?.(y);
  }, [onScrollY]);

  const listEmpty = useMemo(() => {
    if (query.isLoading) {
      return (
        <View style={s.skeletonStack}>
          {Array.from({ length: 5 }, (_, i) => <EventCardSkeleton key={i} />)}
        </View>
      );
    }
    if (query.isError) {
      return (
        <EmptyState
          icon="wifi-outline"
          title="Couldn't load events & specials"
          message="Pull to refresh and try again."
        />
      );
    }
    if (debouncedQuery && filteredItems.length === 0) {
      return (
        <EmptyState
          icon="search-outline"
          title={`No results for "${debouncedQuery}"`}
          message="Try a different search term."
        />
      );
    }
    if (selectedFilter === 'event') {
      return (
        <EmptyState
          icon="calendar-outline"
          title="No events yet"
          message="Check back soon for upcoming events."
        />
      );
    }
    if (selectedFilter === 'special') {
      return (
        <EmptyState
          icon="pricetag-outline"
          title="No specials yet"
          message="Check back soon for exclusive deals."
        />
      );
    }
    return (
      <EmptyState
        icon="calendar-outline"
        title="We're curating something special"
        message="Business owners are adding events and specials. Check back soon."
      />
    );
  }, [query.isLoading, query.isError, debouncedQuery, filteredItems.length, selectedFilter]);

  const listFooter = useMemo(() => {
    if (query.isFetchingNextPage) {
      return (
        <View style={s.skeletonStack}>
          {Array.from({ length: 3 }, (_, i) => <EventCardSkeleton key={i} />)}
        </View>
      );
    }
    if (hasBufferedItems || hasNextPage) {
      return (
        <View style={s.loadMoreWrap}>
          {loadMoreError ? <Text style={s.loadMoreError}>{loadMoreError}</Text> : null}
          <LoadMoreButton onPress={() => void handleLoadMore()} />
        </View>
      );
    }
    if (visibleItems.length > 0) return <FeedFooter />;
    return <View style={s.spacer} />;
  }, [handleLoadMore, hasBufferedItems, hasNextPage, loadMoreError, query.isFetchingNextPage, visibleItems.length]);

  return (
    <EventsSpecialsFeedView
      listRef={listRef}
      listData={listData}
      queryLoading={query.isLoading}
      keyExtractor={keyExtractor}
      renderItem={renderItem}
      subtitle={subtitle}
      searchQuery={searchQuery}
      onSearchChange={setSearchQuery}
      selectedFilter={selectedFilter}
      onFilterChange={setSelectedFilter}
      showCount={!query.isLoading && items.length > 0 && !debouncedQuery}
      countText={countText}
      debouncedQuery={debouncedQuery}
      filteredCount={filteredItems.length}
      listEmpty={listEmpty}
      listFooter={listFooter}
      isRefreshing={query.isRefetching && !query.isFetchingNextPage}
      onRefresh={handleRefresh}
      onScroll={handleScroll}
      showBackToTop={showScrollTopButton}
      onScrollToTop={handleScrollToTop}
    />
  );
}
