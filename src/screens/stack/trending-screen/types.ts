import type { BusinessListItemDto } from '@sayso/contracts';
import type { NativeSyntheticEvent, NativeScrollEvent, ListRenderItem } from 'react-native';

export type TrendingFilterState = {
  minRating: number | null;
  radiusKm: number | null;
};

export type TrendingScreenViewProps = {
  isMapMode: boolean;
  listHeader: React.ReactElement;
  mapBusinesses: BusinessListItemDto[];
  userLocation: { lat: number; lng: number } | null;
  isLoading: boolean;
  visibleBusinesses: BusinessListItemDto[];
  keyExtractor: (item: BusinessListItemDto) => string;
  renderItem: ListRenderItem<BusinessListItemDto>;
  listEmpty: React.ReactElement;
  listFooter: React.ReactElement | null;
  isRefetching: boolean;
  handleRefresh: () => void;
  handleScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  onScrollToTop: () => void;
  showBackToTop: boolean;
  listRef: React.RefObject<import('react-native').FlatList<BusinessListItemDto> | null>;
};
