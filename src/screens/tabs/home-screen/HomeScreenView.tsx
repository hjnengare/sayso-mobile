import { memo } from 'react';
import {
  Animated,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import type { BusinessListItemDto, TopReviewerDto } from '@sayso/contracts';
import { CardSurface } from '../../../components/CardSurface';
import { HeaderDmBellActions } from '../../../components/HeaderDmBellActions';
import { TransitionItem } from '../../../components/motion/TransitionItem';
import { Text } from '../../../components/Typography';
import { HomeBusinessRow } from '../home/HomeBusinessRow';
import { HomeCommunityHighlightsSection } from '../home/HomeCommunityHighlightsSection';
import { HomeEventsSpecialsRow } from '../home/HomeEventsSpecialsRow';
import { HomeSearchBar } from '../home/HomeSearchBar';
import { HomeSearchResults } from '../home/HomeSearchResults';
import { HomeSectionHeader } from '../home/HomeSectionHeader';
import { homeTokens } from '../home/HomeTokens';
import { FROSTED_CARD_BORDER_COLOR } from '../../../styles/cardSurface';
import { getOverlayShadowStyle } from '../../../styles/overlayShadow';
import { CARD_CTA_RADIUS, CARD_RADIUS } from '../../../styles/radii';

const ctaShadowStyle = getOverlayShadowStyle(CARD_CTA_RADIUS);

type Props = {
  user: { id: string } | null;
  homeFeedRef: React.RefObject<ScrollView | null>;
  searchResultsRef: React.RefObject<FlatList<BusinessListItemDto> | null>;
  isSearchActive: boolean;
  searchInput: string;
  setSearchInput: (v: string) => void;
  searchIsFetching: boolean;
  searchBusinesses: BusinessListItemDto[];
  searchIsLoading: boolean;
  searchError: string | null;
  debouncedQuery: string;
  minRating: number | null;
  distanceKm: number | null;
  locationDenied: boolean;
  setMinRating: (v: number | null) => void;
  setDistanceKm: (v: number | null) => void;
  setLocationDenied: (v: boolean) => void;
  handleDistanceChange: (v: number | null) => Promise<void>;
  handleRefresh: () => Promise<void>;
  refreshing: boolean;
  handleScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  headerCollapsed: boolean;
  headerPaddingTop: Animated.AnimatedInterpolation<number>;
  headerPaddingBottom: Animated.AnimatedInterpolation<number>;
  headerRowHeight: Animated.AnimatedInterpolation<number>;
  headerRowOpacity: Animated.AnimatedInterpolation<number>;
  headerRowTranslateY: Animated.AnimatedInterpolation<number>;
  headerRowScale: Animated.AnimatedInterpolation<number>;
  headerMaterialOpacity: Animated.AnimatedInterpolation<number>;
  searchBarMarginTop: Animated.AnimatedInterpolation<number>;
  searchBarTranslateY: Animated.AnimatedInterpolation<number>;
  searchBarScale: Animated.AnimatedInterpolation<number>;
  forYou: {
    businesses: BusinessListItemDto[];
    isLoading: boolean;
    error: string | null;
  };
  trending: {
    data: { businesses: BusinessListItemDto[] } | undefined;
    isLoading: boolean;
    error: Error | null;
  };
  events: {
    items: any[];
    isLoading: boolean;
    error: string | null;
  };
  reviewers: {
    reviewers: TopReviewerDto[];
    mode: 'stage1' | 'normal';
    isLoading: boolean;
    error: string | null;
  };
  recentReviews: {
    reviews: any[];
    isLoading: boolean;
    error: string | null;
  };
  featured: {
    featuredBusinesses: any[];
    isLoading: boolean;
    error: string | null;
  };
  navigateToReviewer: (reviewer: TopReviewerDto) => void;
  onNavigateForYou: () => void;
  onNavigateTrending: () => void;
  onNavigateEvents: () => void;
  onNavigateLeaderboardContributors: () => void;
  onNavigateLeaderboardBusinesses: () => void;
  onNavigateBadges: () => void;
  onNavigateOnboarding: () => void;
};

function HomeScreenViewComponent({
  user,
  homeFeedRef,
  searchResultsRef,
  isSearchActive,
  searchInput,
  setSearchInput,
  searchIsFetching,
  searchBusinesses,
  searchIsLoading,
  searchError,
  debouncedQuery,
  minRating,
  distanceKm,
  locationDenied,
  setMinRating,
  setDistanceKm,
  setLocationDenied,
  handleDistanceChange,
  handleRefresh,
  refreshing,
  handleScroll,
  headerCollapsed,
  headerPaddingTop,
  headerPaddingBottom,
  headerRowHeight,
  headerRowOpacity,
  headerRowTranslateY,
  headerRowScale,
  headerMaterialOpacity,
  searchBarMarginTop,
  searchBarTranslateY,
  searchBarScale,
  forYou,
  trending,
  events,
  reviewers,
  recentReviews,
  featured,
  navigateToReviewer,
  onNavigateForYou,
  onNavigateTrending,
  onNavigateEvents,
  onNavigateLeaderboardContributors,
  onNavigateLeaderboardBusinesses,
  onNavigateBadges,
  onNavigateOnboarding,
}: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[
          styles.headerWrap,
          {
            paddingTop: headerPaddingTop,
            paddingBottom: headerPaddingBottom,
          },
        ]}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.headerMaterial,
            headerCollapsed ? styles.headerMaterialCollapsed : null,
            { opacity: headerMaterialOpacity },
          ]}
        />
        <Animated.View
          pointerEvents={headerCollapsed ? 'none' : 'auto'}
          style={[
            styles.headerRowWrap,
            {
              height: headerRowHeight,
              opacity: headerRowOpacity,
              transform: [{ translateY: headerRowTranslateY }, { scale: headerRowScale }],
            },
          ]}
        >
          <TransitionItem variant="header" index={0}>
            <View style={styles.headerRow}>
              <View style={styles.headerCopy}>
                <Text style={styles.headerTitle}>Sayso</Text>
              </View>
              <HeaderDmBellActions />
            </View>
          </TransitionItem>
        </Animated.View>
        <Animated.View
          style={[
            styles.searchBarWrap,
            {
              marginTop: searchBarMarginTop,
              transform: [{ translateY: searchBarTranslateY }, { scale: searchBarScale }],
            },
          ]}
        >
          <TransitionItem variant="input" index={1}>
            <HomeSearchBar
              value={searchInput}
              onChangeText={setSearchInput}
              onClear={() => setSearchInput('')}
              isFetching={isSearchActive && searchIsFetching}
            />
          </TransitionItem>
        </Animated.View>
      </Animated.View>

      {isSearchActive ? (
        <TransitionItem variant="card" index={2} style={styles.flexOne}>
          <HomeSearchResults
            listRef={searchResultsRef}
            query={debouncedQuery}
            results={searchBusinesses}
            isLoading={searchIsLoading}
            error={searchError}
            minRating={minRating}
            distanceKm={distanceKm}
            locationDenied={locationDenied}
            onSetMinRating={(value) => setMinRating(value)}
            onSetDistanceKm={handleDistanceChange}
            onClearFilters={() => {
              setMinRating(null);
              setDistanceKm(null);
              setLocationDenied(false);
            }}
            onRefresh={() => {
              void handleRefresh();
            }}
            refreshing={refreshing}
            onScroll={handleScroll}
          />
        </TransitionItem>
      ) : (
        <Animated.ScrollView
          ref={homeFeedRef}
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void handleRefresh()} />}
          contentContainerStyle={styles.content}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <TransitionItem variant="card" index={2}>
            <View style={styles.section}>
            <HomeSectionHeader
              title="For You"
              actionLabel={user ? 'See More' : undefined}
              onPress={user ? onNavigateForYou : undefined}
              delay={0}
            />

            {!user ? (
              <CardSurface
                radius={CARD_RADIUS}
                style={styles.guestCardWrap}
                contentStyle={styles.guestCardSurface}
              >
                <LinearGradient
                  colors={[homeTokens.coral, homeTokens.coralDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.guestCard}
                >
                  <View style={styles.guestBadge}>
                    <Text style={styles.guestBadgeText}>For You</Text>
                  </View>
                  <Text style={styles.guestTitle}>Create an account to unlock personalised recommendations.</Text>
                  <View style={styles.guestActions}>
                    <TouchableOpacity
                      style={[styles.primaryGuestButton, ctaShadowStyle]}
                      onPress={onNavigateOnboarding}
                      activeOpacity={0.88}
                    >
                      <Text style={styles.primaryGuestButtonText}>Create Account</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.secondaryGuestButton, ctaShadowStyle]}
                      onPress={onNavigateOnboarding}
                      activeOpacity={0.88}
                    >
                      <Text style={styles.secondaryGuestButtonText}>Sign In</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              </CardSurface>
            ) : forYou.error ? (
              <View style={styles.messageCard}>
                <Text style={styles.messageTitle}>Couldn&apos;t load personalised picks right now.</Text>
                <Text style={styles.messageText}>We&apos;ll retry in the background.</Text>
              </View>
            ) : forYou.isLoading ? (
              <HomeBusinessRow
                items={[]}
                loading
                emptyTitle="Curated from your interests"
                emptyMessage="Based on what you selected, no matches in this section yet. See more on For You or explore Trending."
              />
            ) : forYou.businesses.length > 0 ? (
              <HomeBusinessRow
                items={forYou.businesses}
                loading={false}
                emptyTitle="Curated from your interests"
                emptyMessage="Based on what you selected, no matches in this section yet. See more on For You or explore Trending."
              />
            ) : (
              <View style={styles.messageCard}>
                <Text style={styles.messageTitle}>Curated from your interests</Text>
                <Text style={styles.messageText}>
                  Based on what you selected, no matches in this section yet. See more on For You or explore Trending.
                </Text>
              </View>
            )}
            </View>
          </TransitionItem>

          <TransitionItem variant="card" index={3}>
            <View style={styles.section}>
            <HomeSectionHeader
              title="Trending Now"
              actionLabel="See More"
              onPress={onNavigateTrending}
              delay={100}
            />
            <HomeBusinessRow
              items={trending.data?.businesses ?? []}
              loading={trending.isLoading}
              error={trending.error instanceof Error ? trending.error.message : null}
              emptyTitle="Nothing trending yet"
              emptyMessage="Check back soon for live activity."
            />
            </View>
          </TransitionItem>

          <TransitionItem variant="card" index={4}>
            <View style={styles.section}>
            <HomeSectionHeader
              title="Events & Specials"
              actionLabel="See More"
              onPress={onNavigateEvents}
              delay={200}
            />
            <HomeEventsSpecialsRow
              items={events.items}
              loading={events.isLoading}
              error={events.error}
            />
            </View>
          </TransitionItem>

          <TransitionItem variant="card" index={5}>
            <HomeCommunityHighlightsSection
              reviewers={reviewers.reviewers}
              reviewersMode={reviewers.mode}
              recentReviews={recentReviews.reviews}
              reviewersLoading={reviewers.isLoading || recentReviews.isLoading}
              reviewersError={reviewers.error ?? recentReviews.error}
              featuredBusinesses={featured.featuredBusinesses}
              featuredLoading={featured.isLoading}
              featuredError={featured.error}
              onPressContributors={onNavigateLeaderboardContributors}
              onPressFeatured={onNavigateLeaderboardBusinesses}
              onPressBadges={onNavigateBadges}
              onPressReviewer={navigateToReviewer}
            />
          </TransitionItem>
        </Animated.ScrollView>
      )}

    </SafeAreaView>
  );
}

export const HomeScreenView = memo(HomeScreenViewComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: homeTokens.offWhite,
  },
  flexOne: {
    flex: 1,
  },
  headerWrap: {
    backgroundColor: homeTokens.offWhite,
    position: 'relative',
    overflow: 'hidden',
  },
  headerMaterial: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: homeTokens.coral,
    borderBottomWidth: 1,
    borderBottomColor: FROSTED_CARD_BORDER_COLOR,
  },
  headerMaterialCollapsed: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 18,
    elevation: 6,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    paddingHorizontal: homeTokens.pageGutter,
    position: 'relative',
    zIndex: 1,
  },
  headerRowWrap: {
    justifyContent: 'center',
    overflow: 'hidden',
  },
  headerCopy: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 30,
    fontFamily: 'MonarchParadox',
    color: homeTokens.charcoal,
    letterSpacing: 0.2,
  },
  searchBarWrap: {
    marginHorizontal: homeTokens.pageGutter,
    height: 60,
    padding: 4,
    overflow: 'visible',
    position: 'relative',
    zIndex: 1,
  },
  content: {
    backgroundColor: homeTokens.offWhite,
  },
  section: {
    paddingTop: 18,
    backgroundColor: homeTokens.offWhite,
  },
  scroll: {
    backgroundColor: homeTokens.offWhite,
  },
  guestCardWrap: {
    marginHorizontal: homeTokens.pageGutter,
  },
  guestCardSurface: {
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  guestCard: {
    borderRadius: CARD_RADIUS,
    padding: 20,
  },
  guestBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.92)',
    marginBottom: 14,
  },
  guestBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: homeTokens.coral,
  },
  guestTitle: {
    fontSize: 24,
    lineHeight: 31,
    fontWeight: '700',
    color: homeTokens.white,
    maxWidth: 320,
  },
  guestActions: {
    gap: 12,
    marginTop: 18,
  },
  primaryGuestButton: {
    borderRadius: CARD_CTA_RADIUS,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: homeTokens.white,
  },
  primaryGuestButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: homeTokens.coral,
    textAlign: 'center',
  },
  secondaryGuestButton: {
    borderRadius: CARD_CTA_RADIUS,
    paddingVertical: 14,
    paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  secondaryGuestButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: homeTokens.white,
    textAlign: 'center',
  },
  messageCard: {
    marginHorizontal: homeTokens.pageGutter,
    padding: 20,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: homeTokens.borderSoft,
    backgroundColor: homeTokens.cardBg,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: homeTokens.charcoal,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(45,55,72,0.9)',
    marginTop: 6,
  },
});
