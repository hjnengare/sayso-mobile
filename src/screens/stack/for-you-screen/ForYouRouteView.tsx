import { memo } from 'react';
import { FlatList, Pressable, SafeAreaView, StyleSheet, TouchableOpacity, View, type ListRenderItem, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Stack } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import type { BusinessListItemDto, PaginatedBusinessFeedResponseDto } from '@sayso/contracts';
import { BusinessFeed } from '../../../components/feed/BusinessFeed';
import { BusinessCard } from '../../../components/BusinessCard';
import { EmptyState } from '../../../components/EmptyState';
import { SkeletonBusinessCard } from '../../../components/feed/SkeletonBusinessCard';
import { ScrollToTopFab } from '../../../components/ScrollToTopFab';
import { HeaderDmBellActions } from '../../../components/HeaderDmBellActions';
import { TransitionItem } from '../../../components/motion/TransitionItem';
import { Text } from '../../../components/Typography';
import { homeTokens } from '../../tabs/home/HomeTokens';

const REQUEST_LIMIT = 120;
const VISIBLE_CHUNK_SIZE = 12;

type Props = {
  userId: string | null;
  isSearching: boolean;
  showBackToTop: boolean;
  listRef: React.RefObject<FlatList<BusinessListItemDto> | null>;
  keyExtractor: (item: BusinessListItemDto) => string;
  renderItem: ListRenderItem<BusinessListItemDto>;
  searchResults: BusinessListItemDto[];
  searchLoading: boolean;
  searchError: boolean;
  debouncedQuery: string;
  heroSection: React.ReactElement;
  resultsHeader: React.ReactElement;
  searchEmpty: React.ReactElement;
  handleSearchScroll: (e: NativeSyntheticEvent<NativeScrollEvent>) => void;
  preferencesLoading: boolean;
  preferencesError: string | null;
  hasPreferences: boolean;
  fetchForYouPage: (cursor: string | null) => Promise<PaginatedBusinessFeedResponseDto>;
  preferenceIds: { interests: string[]; subcategories: string[]; dealbreakers: string[] };
  handleScrollY: (y: number) => void;
  onPressOnboarding: () => void;
};

function ForYouRouteViewComponent({
  userId,
  isSearching,
  showBackToTop,
  listRef,
  keyExtractor,
  renderItem,
  searchResults,
  searchLoading,
  searchError,
  debouncedQuery,
  heroSection,
  resultsHeader,
  searchEmpty,
  handleSearchScroll,
  preferencesLoading,
  preferencesError,
  hasPreferences,
  fetchForYouPage,
  preferenceIds,
  handleScrollY,
  onPressOnboarding,
}: Props) {
  if (!userId) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'For You' }} />
        <View style={styles.guestHeader}>
          <TransitionItem variant="header" index={0} style={styles.headerCopy}>
            <View>
              <Text style={styles.heroTitle}>Curated Just For You</Text>
              <Text style={styles.heroDesc}>Personalized discovery starts after sign-in.</Text>
            </View>
          </TransitionItem>
          <TransitionItem variant="card" index={1}>
            <HeaderDmBellActions />
          </TransitionItem>
        </View>

        <TransitionItem variant="card" index={2}>
          <LinearGradient
            colors={[homeTokens.coral, homeTokens.coralDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.guestCard}
          >
            <Text style={styles.guestTitle}>Create an account to unlock personalised recommendations.</Text>
            <TouchableOpacity style={styles.guestPrimary} onPress={onPressOnboarding} activeOpacity={0.88}>
              <Text style={styles.guestPrimaryText}>Create Account</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.guestSecondary} onPress={onPressOnboarding} activeOpacity={0.88}>
              <Text style={styles.guestSecondaryText}>Sign In</Text>
            </TouchableOpacity>
          </LinearGradient>
        </TransitionItem>
      </SafeAreaView>
    );
  }

  if (isSearching) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'For You', headerRight: () => <HeaderDmBellActions /> }} />
        <View style={styles.fullFlex}>
          <FlatList
            ref={listRef}
            data={searchLoading ? [] : searchResults}
            keyExtractor={keyExtractor}
            renderItem={renderItem}
            ItemSeparatorComponent={ItemSeparator}
            ListHeaderComponent={resultsHeader}
            ListEmptyComponent={searchEmpty}
            ListFooterComponent={<View style={styles.footerSpacer} />}
            contentContainerStyle={styles.list}
            onScroll={handleSearchScroll}
            scrollEventThrottle={32}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
          <ScrollToTopFab visible={showBackToTop} onPress={() => listRef.current?.scrollToOffset({ offset: 0, animated: true })} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'For You', headerRight: () => <HeaderDmBellActions /> }} />

      {preferencesLoading ? (
        <View style={styles.loadingList}>
          <View style={styles.loadingHeader}>{heroSection}</View>
          <TransitionItem variant="card" index={3}>
            <View style={styles.personalizingPill}>
              <Ionicons name="sparkles" size={13} color={homeTokens.coral} />
              <Text style={styles.personalizingText}>Personalizing your feed...</Text>
            </View>
          </TransitionItem>
          {Array.from({ length: 5 }, (_, index) => (
            <SkeletonBusinessCard key={`for-you-loading-${index}`} />
          ))}
        </View>
      ) : preferencesError ? (
        <>
          <View style={styles.loadingHeader}>{heroSection}</View>
          <EmptyState icon="wifi-outline" title="Couldn't load personalised picks right now." message={preferencesError} />
        </>
      ) : !hasPreferences ? (
        <>
          <View style={styles.loadingHeader}>{heroSection}</View>
          <EmptyState
            icon="sparkles-outline"
            title="Curated from your interests"
            message="Based on what you selected, no matches in this feed yet."
          />
        </>
      ) : (
        <BusinessFeed
          feedKey="for-you"
          queryKey={['for-you', userId, preferenceIds, REQUEST_LIMIT]}
          horizontalPadding={4}
          listHeaderTop={heroSection}
          onScrollY={handleScrollY}
          errorTitle="Couldn't load personalised picks right now."
          emptyTitle="Curated from your interests"
          emptyMessage="Based on what you selected, no matches in this feed yet."
          requestLimit={REQUEST_LIMIT}
          visibleChunkSize={VISIBLE_CHUNK_SIZE}
          fetchPage={fetchForYouPage}
        />
      )}
    </SafeAreaView>
  );
}

function ItemSeparator() {
  return <View style={styles.separator} />;
}

export const ForYouRouteView = memo(ForYouRouteViewComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: homeTokens.offWhite,
  },
  fullFlex: {
    flex: 1,
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
  personalizingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    marginHorizontal: 4,
    marginBottom: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(232,90,79,0.10)',
  },
  personalizingText: {
    fontSize: 12,
    fontWeight: '600',
    color: homeTokens.coral,
  },
  loadingList: {
    flex: 1,
    gap: 12,
    paddingHorizontal: 4,
    paddingTop: 8,
  },
  loadingHeader: {
    paddingHorizontal: 0,
  },
  list: {
    flexGrow: 1,
    paddingHorizontal: 4,
    paddingTop: 4,
    paddingBottom: 16,
  },
  separator: {
    height: 12,
  },
  footerSpacer: {
    height: 32,
  },
  guestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 4,
    paddingTop: 8,
    paddingBottom: 4,
  },
  headerCopy: {
    flex: 1,
  },
  guestCard: {
    marginHorizontal: 4,
    marginTop: 16,
    borderRadius: 28,
    padding: 20,
    gap: 12,
  },
  guestTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: '700',
    color: homeTokens.white,
  },
  guestPrimary: {
    marginTop: 8,
    borderRadius: 999,
    backgroundColor: homeTokens.white,
    paddingVertical: 14,
  },
  guestPrimaryText: {
    textAlign: 'center',
    color: homeTokens.coral,
    fontSize: 14,
    fontWeight: '700',
  },
  guestSecondary: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    paddingVertical: 14,
  },
  guestSecondaryText: {
    textAlign: 'center',
    color: homeTokens.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
