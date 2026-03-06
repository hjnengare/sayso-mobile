import type { Ref } from 'react';
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
import { Text } from '../../../components/Typography';
import { BusinessCard } from '../../../components/BusinessCard';
import { EmptyState } from '../../../components/EmptyState';
import type { BusinessListItemDto } from '@sayso/contracts';
import { homeTokens } from './HomeTokens';

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

const ratingOptions = [4, 4.5];
const distanceOptions = [2, 5, 10];

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
  return (
    <Animated.FlatList
      ref={listRef}
      data={isLoading ? [] : results}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <BusinessCard business={item} />}
      ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.title}>Search Results</Text>
          <Text style={styles.subtitle}>Showing matches for "{query.trim()}"</Text>
          <View style={styles.filters}>
            <View style={styles.filterRow}>
              {ratingOptions.map((value) => (
                <TouchableOpacity
                  key={`rating-${value}`}
                  style={[styles.filterChip, minRating === value ? styles.filterChipActive : null]}
                  onPress={() => onSetMinRating(minRating === value ? null : value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, minRating === value ? styles.filterChipTextActive : null]}>
                    {value}+ stars
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.filterRow}>
              {distanceOptions.map((value) => (
                <TouchableOpacity
                  key={`distance-${value}`}
                  style={[styles.filterChip, distanceKm === value ? styles.filterChipActive : null]}
                  onPress={() => onSetDistanceKm(distanceKm === value ? null : value)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterChipText, distanceKm === value ? styles.filterChipTextActive : null]}>
                    {value} km
                  </Text>
                </TouchableOpacity>
              ))}
              {(minRating != null || distanceKm != null) ? (
                <TouchableOpacity style={styles.resetChip} onPress={onClearFilters} activeOpacity={0.8}>
                  <Text style={styles.resetChipText}>Reset</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          {locationDenied && distanceKm != null ? (
            <Text style={styles.notice}>Location permission is off, so distance filtering could not be applied.</Text>
          ) : null}
        </View>
      }
      ListEmptyComponent={
        isLoading ? null : error ? (
          <EmptyState
            icon="wifi-outline"
            title="Search failed"
            message={error}
          />
        ) : (
          <EmptyState
            icon="storefront-outline"
            title={`No results for "${query.trim()}"`}
            message="Try another search term or loosen the filters."
          />
        )
      }
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      onScroll={onScroll}
      scrollEventThrottle={16}
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    paddingBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: homeTokens.charcoal,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    color: homeTokens.textSecondary,
    marginTop: 4,
  },
  filters: {
    gap: 10,
    marginTop: 16,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: homeTokens.borderSoft,
    backgroundColor: homeTokens.white,
  },
  filterChipActive: {
    backgroundColor: homeTokens.coral,
    borderColor: homeTokens.coral,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: homeTokens.charcoal,
  },
  filterChipTextActive: {
    color: homeTokens.white,
  },
  resetChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: homeTokens.offWhite,
  },
  resetChipText: {
    fontSize: 13,
    fontWeight: '700',
    color: homeTokens.charcoal,
  },
  notice: {
    fontSize: 13,
    lineHeight: 18,
    color: homeTokens.coral,
    marginTop: 12,
  },
});
