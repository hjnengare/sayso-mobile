import { useCallback, useEffect, useRef, useState, type Ref } from 'react';
import {
  Animated,
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../../components/Typography';
import { BusinessCard } from '../../../components/BusinessCard';
import type { BusinessListItemDto } from '@sayso/contracts';
import { homeTokens } from './HomeTokens';
import { APP_PAGE_GUTTER } from '../../../styles/layout';

type Props = {
  query: string;
  results: BusinessListItemDto[];
  isLoading: boolean;
  error?: string | null;
  minRating: number | null;
  distanceKm: number | null;
  locationDenied: boolean;
  onSetMinRating: (value: number | null) => void;
  onSetDistanceKm: (value: number | null) => void;
  onClearFilters: () => void;
  onRefresh: () => void;
  refreshing: boolean;
  onScroll?: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  listRef?: Ref<FlatList<BusinessListItemDto>>;
};

const ratingOptions = [
  { label: '4+', value: 4 },
  { label: '4.5+', value: 4.5 },
];

const distanceOptions = [
  { label: '1 km', value: 1 },
  { label: '3 km', value: 3 },
  { label: '5 km', value: 5 },
  { label: '10 km', value: 10 },
];

export function HomeSearchResults({
  query,
  results,
  isLoading,
  error,
  minRating,
  distanceKm,
  locationDenied,
  onSetMinRating,
  onSetDistanceKm,
  onClearFilters,
  onRefresh,
  refreshing,
  onScroll,
  listRef,
}: Props) {
  const hasFilters = minRating != null || distanceKm != null;
  const internalRef = useRef<FlatList<BusinessListItemDto>>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [backToTopVisible, setBackToTopVisible] = useState(false);

  // Merge the external listRef with our internal ref
  const mergedRef = useCallback(
    (node: FlatList<BusinessListItemDto> | null) => {
      (internalRef as React.MutableRefObject<FlatList<BusinessListItemDto> | null>).current = node;
      if (typeof listRef === 'function') {
        (listRef as (node: FlatList<BusinessListItemDto> | null) => void)(node);
      } else if (listRef) {
        (listRef as React.MutableRefObject<FlatList<BusinessListItemDto> | null>).current = node;
      }
    },
    [listRef]
  );

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: backToTopVisible ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [backToTopVisible, fadeAnim]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setBackToTopVisible(event.nativeEvent.contentOffset.y > 300);
      onScroll?.(event);
    },
    [onScroll]
  );

  return (
    <View style={styles.wrapper}>
      <Animated.FlatList
        ref={mergedRef}
      data={isLoading ? [] : results}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <BusinessCard business={item} />}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.header}>
          {/* Title row — matches web flex row: title left, clear filters right */}
          <View style={styles.titleRow}>
            <View style={styles.titleColumn}>
              <Text style={styles.modeLabel}>Search Mode</Text>
              <Text style={styles.title}>Results for &ldquo;{query.trim()}&rdquo;</Text>
            </View>
            {hasFilters ? (
              <TouchableOpacity onPress={onClearFilters} activeOpacity={0.8} style={styles.clearButton}>
                <Text style={styles.clearButtonText}>Clear filters</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Filter groups — Distance then Rating, each with label above pills */}
          <View style={styles.filters}>
            <View>
              <Text style={styles.filterLabel}>Distance</Text>
              <View style={styles.filterPills}>
                {distanceOptions.map(({ label, value }) => (
                  <TouchableOpacity
                    key={`distance-${value}`}
                    style={[styles.filterChip, distanceKm === value ? styles.filterChipActive : null]}
                    onPress={() => onSetDistanceKm(distanceKm === value ? null : value)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterChipText, distanceKm === value ? styles.filterChipTextActive : null]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text style={styles.filterLabel}>Rating</Text>
              <View style={styles.filterPills}>
                {ratingOptions.map(({ label, value }) => (
                  <TouchableOpacity
                    key={`rating-${value}`}
                    style={[styles.filterChip, minRating === value ? styles.filterChipActive : null]}
                    onPress={() => onSetMinRating(minRating === value ? null : value)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.filterChipText, minRating === value ? styles.filterChipTextActive : null]}>
                      {label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {locationDenied && distanceKm != null ? (
            <Text style={styles.notice}>Location permission is off, so distance filtering could not be applied.</Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        isLoading ? null : error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              No matches found for &ldquo;{query.trim()}&rdquo;. Try adjusting your spelling or filters.
            </Text>
          </View>
        )
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      onScroll={handleScroll}
      scrollEventThrottle={16}
    />

    {/* Back to top — fades in after 300px of scroll */}
    <Animated.View
      style={[styles.backToTopBtn, { opacity: fadeAnim }]}
      pointerEvents={backToTopVisible ? 'auto' : 'none'}
    >
      <TouchableOpacity
        onPress={() => internalRef.current?.scrollToOffset({ offset: 0, animated: true })}
        activeOpacity={0.88}
        accessibilityLabel="Back to top"
        style={styles.backToTopInner}
      >
        <Ionicons name="arrow-up" size={16} color={homeTokens.white} />
        <Text style={styles.backToTopText}>Top</Text>
      </TouchableOpacity>
    </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  content: {
    paddingHorizontal: APP_PAGE_GUTTER,
    paddingTop: 16,
    paddingBottom: 32,
  },
  header: {
    paddingBottom: 16,
  },
  // ─── Title row ───────────────────────────────────────────────────────────────
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleColumn: {
    flex: 1,
    gap: 2,
  },
  modeLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: 'rgba(45,45,45,0.60)',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: homeTokens.charcoal,
    letterSpacing: -0.3,
  },
  clearButton: {
    paddingBottom: 2,
    flexShrink: 0,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(45,45,45,0.80)',
    textDecorationLine: 'underline',
  },
  // ─── Filter section ──────────────────────────────────────────────────────────
  filters: {
    gap: 12,
    marginTop: 16,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    color: 'rgba(45,45,45,0.60)',
  },
  filterPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: homeTokens.borderSoft,
    backgroundColor: 'rgba(255,255,255,0.60)',
  },
  filterChipActive: {
    backgroundColor: 'rgba(157,171,155,0.92)',
    borderColor: 'rgba(157,171,155,0.50)',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(45,45,45,0.70)',
  },
  filterChipTextActive: {
    color: homeTokens.white,
  },
  // ─── Notice ──────────────────────────────────────────────────────────────────
  notice: {
    fontSize: 13,
    lineHeight: 18,
    color: homeTokens.coral,
    marginTop: 12,
  },
  // ─── Empty state ─────────────────────────────────────────────────────────────
  emptyBox: {
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(45,45,45,0.10)',
    backgroundColor: homeTokens.white,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  emptyText: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(45,45,45,0.70)',
  },
  // ─── Back to top ─────────────────────────────────────────────────────────────
  backToTopBtn: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  backToTopInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: homeTokens.coral,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
  },
  backToTopText: {
    fontSize: 13,
    fontWeight: '600',
    color: homeTokens.white,
  },
  // ─── Error state ─────────────────────────────────────────────────────────────
  errorBox: {
    marginTop: 24,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(114,47,55,0.30)',
    backgroundColor: 'rgba(114,47,55,0.10)',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  errorText: {
    fontSize: 14,
    lineHeight: 20,
    color: homeTokens.coral,
  },
});
