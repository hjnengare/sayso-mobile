import { memo } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, View, type ListRenderItem, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { EventSpecialListItemDto } from '@sayso/contracts';
import { EventCard } from '../../../components/EventCard';
import { EventCardSkeleton } from '../../../components/EventCardSkeleton';
import { EmptyState } from '../../../components/EmptyState';
import { TransitionItem } from '../../../components/motion/TransitionItem';
import { ScrollToTopFab } from '../../../components/ScrollToTopFab';
import { Text } from '../../../components/Typography';
import { FeedFooter } from '../../../components/feed/FeedFooter';
import { LoadMoreButton } from '../../../components/feed/LoadMoreButton';
import { HomeSearchBar } from '../../tabs/home/HomeSearchBar';
import { APP_PAGE_GUTTER } from '../../../styles/layout';

const SAGE = '#9DAB9B';
const CHARCOAL = '#2D2D2D';

type FilterType = 'all' | 'event' | 'special';
type SectionHeaderItem = { _section: true; title: string; id: string };
export type ListItem = EventSpecialListItemDto | SectionHeaderItem;

const FILTER_OPTIONS: { value: FilterType; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'event', label: 'Events' },
  { value: 'special', label: 'Specials' },
];

type HeaderProps = {
  subtitle: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  queryLoading: boolean;
  selectedFilter: FilterType;
  onFilterChange: (f: FilterType) => void;
  showCount: boolean;
  countText: string;
  debouncedQuery: string;
  filteredCount: number;
};

function FeedListHeader({
  subtitle,
  searchQuery,
  onSearchChange,
  queryLoading,
  selectedFilter,
  onFilterChange,
  showCount,
  countText,
  debouncedQuery,
  filteredCount,
}: HeaderProps) {
  return (
    <View>
      <TransitionItem variant="header" index={0}>
        <View style={s.hero}>
          <Text style={s.heroTitle}>Events & Specials</Text>
          <Text style={s.heroSubtitle}>{subtitle}</Text>
        </View>
      </TransitionItem>

      <TransitionItem variant="input" index={1}>
        <View style={s.searchWrap}>
          <HomeSearchBar
            value={searchQuery}
            onChangeText={onSearchChange}
            onClear={() => onSearchChange('')}
            isFetching={queryLoading && debouncedQuery.length > 0}
          />
        </View>
      </TransitionItem>

      <TransitionItem variant="card" index={2}>
        <View style={s.filterRow}>
          {FILTER_OPTIONS.map((opt) => (
            <Pressable
              key={opt.value}
              style={[s.filterPill, selectedFilter === opt.value && s.filterPillActive]}
              onPress={() => onFilterChange(opt.value)}
            >
              <Text style={[s.filterPillText, selectedFilter === opt.value && s.filterPillTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </TransitionItem>

      {debouncedQuery.length > 0 ? (
        <TransitionItem variant="card" index={3}>
          <Text style={s.countText}>
            {filteredCount > 0
              ? `${filteredCount} result${filteredCount !== 1 ? 's' : ''} for "${debouncedQuery}"`
              : `No results for "${debouncedQuery}"`}
          </Text>
        </TransitionItem>
      ) : showCount ? (
        <TransitionItem variant="card" index={3}>
          <Text style={s.countText}>{countText}</Text>
        </TransitionItem>
      ) : null}
    </View>
  );
}

type Props = {
  listRef: React.RefObject<FlatList<ListItem> | null>;
  listData: ListItem[];
  queryLoading: boolean;
  keyExtractor: (item: ListItem) => string;
  renderItem: ListRenderItem<ListItem>;
  subtitle: string;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  selectedFilter: FilterType;
  onFilterChange: (f: FilterType) => void;
  showCount: boolean;
  countText: string;
  debouncedQuery: string;
  filteredCount: number;
  listEmpty: React.ReactElement;
  listFooter: React.ReactElement;
  isRefreshing: boolean;
  onRefresh: () => void;
  onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  showBackToTop: boolean;
  onScrollToTop: () => void;
};

function EventsSpecialsFeedViewComponent({
  listRef,
  listData,
  queryLoading,
  keyExtractor,
  renderItem,
  subtitle,
  searchQuery,
  onSearchChange,
  selectedFilter,
  onFilterChange,
  showCount,
  countText,
  debouncedQuery,
  filteredCount,
  listEmpty,
  listFooter,
  isRefreshing,
  onRefresh,
  onScroll,
  showBackToTop,
  onScrollToTop,
}: Props) {
  return (
    <View style={s.container}>
      <FlatList<ListItem>
        ref={listRef}
        data={queryLoading ? [] : listData}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        ListHeaderComponent={
          <FeedListHeader
            subtitle={subtitle}
            searchQuery={searchQuery}
            onSearchChange={onSearchChange}
            queryLoading={queryLoading}
            selectedFilter={selectedFilter}
            onFilterChange={onFilterChange}
            showCount={showCount}
            countText={countText}
            debouncedQuery={debouncedQuery}
            filteredCount={filteredCount}
          />
        }
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        contentContainerStyle={s.list}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
        initialNumToRender={8}
        windowSize={5}
        removeClippedSubviews
        maxToRenderPerBatch={10}
        onScroll={onScroll}
        scrollEventThrottle={32}
        showsVerticalScrollIndicator={false}
      />
      <ScrollToTopFab visible={showBackToTop} onPress={onScrollToTop} />
    </View>
  );
}

export const EventsSpecialsFeedView = memo(EventsSpecialsFeedViewComponent);

const s = StyleSheet.create({
  container: { flex: 1 },
  list: { flexGrow: 1, paddingHorizontal: APP_PAGE_GUTTER, paddingTop: 8, paddingBottom: 24 },
  hero: {
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: CHARCOAL,
    textAlign: 'center',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(45,45,45,0.65)',
    textAlign: 'center',
    maxWidth: 320,
  },
  searchWrap: {
    marginBottom: 12,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 10,
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.80)',
    borderWidth: 1,
    borderColor: 'rgba(45,45,45,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterPillActive: {
    backgroundColor: SAGE,
    borderColor: SAGE,
  },
  filterPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: CHARCOAL,
  },
  filterPillTextActive: {
    color: '#fff',
  },
  countText: {
    fontSize: 12,
    color: 'rgba(45,45,45,0.55)',
    marginBottom: 10,
  },
  sectionHeader: {
    paddingVertical: 6,
  },
  sectionHeaderGap: {
    marginTop: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: CHARCOAL,
  },
  cardWrap: {
    marginBottom: 12,
  },
  skeletonStack: { gap: 12, paddingTop: 4 },
  loadMoreWrap: { paddingVertical: 4, gap: 6 },
  loadMoreError: {
    fontSize: 13,
    lineHeight: 18,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 12,
  },
  spacer: { height: 12 },
});

export const eventsSpecialsFeedStyles = s;
