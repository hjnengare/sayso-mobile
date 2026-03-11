import { memo } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { ScrollToTopFab } from '../../../components/ScrollToTopFab';
import { TransitionItem } from '../../../components/motion/TransitionItem';
import { TrendingMapView } from '../TrendingMapView';
import { businessDetailColors, businessDetailSpacing } from '../../../components/business-detail/styles';
import type { TrendingScreenViewProps } from './types';

function ItemSeparator() {
  return <View style={styles.separator} />;
}

function TrendingScreenViewComponent({
  isMapMode,
  listHeader,
  mapBusinesses,
  userLocation,
  isLoading,
  visibleBusinesses,
  keyExtractor,
  renderItem,
  listEmpty,
  listFooter,
  isRefetching,
  handleRefresh,
  handleScroll,
  onScrollToTop,
  showBackToTop,
  listRef,
}: TrendingScreenViewProps) {
  return (
    <View style={styles.container}>
      {isMapMode && listHeader}

      {isMapMode ? (
        <TransitionItem variant="card" index={5} style={styles.mapTransition}>
          <View style={styles.mapWrap}>
            <TrendingMapView businesses={mapBusinesses} userLocation={userLocation} />
          </View>
        </TransitionItem>
      ) : (
        <FlatList
          ref={listRef}
          data={isLoading ? [] : visibleBusinesses}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ItemSeparatorComponent={ItemSeparator}
          ListHeaderComponent={listHeader}
          ListEmptyComponent={listEmpty}
          ListFooterComponent={listFooter}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={handleRefresh} />}
          onScroll={handleScroll}
          scrollEventThrottle={32}
          showsVerticalScrollIndicator={false}
          initialNumToRender={8}
          windowSize={5}
          removeClippedSubviews
        />
      )}

      {!isMapMode ? <ScrollToTopFab visible={showBackToTop} onPress={onScrollToTop} /> : null}
    </View>
  );
}

export const TrendingScreenView = memo(TrendingScreenViewComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: businessDetailColors.page,
  },
  list: {
    paddingHorizontal: businessDetailSpacing.pageGutter,
    paddingTop: 4,
    paddingBottom: 4,
    flexGrow: 1,
  },
  mapWrap: {
    flex: 1,
    paddingHorizontal: businessDetailSpacing.pageGutter,
    paddingBottom: 8,
  },
  mapTransition: {
    flex: 1,
  },
  separator: {
    height: 12,
  },
});
