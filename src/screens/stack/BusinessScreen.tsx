import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  InteractionManager,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { EmptyState } from '../../components/EmptyState';
import { Text } from '../../components/Typography';
import {
  BusinessActionCard,
  BusinessContactCard,
  BusinessContactInfoCard,
  BusinessDescriptionCard,
  BusinessDetailsCard,
  BusinessHeroCarousel,
  BusinessInfoBlock,
  BusinessLocationCard,
  BusinessOwnedEventsSection,
  BusinessPageHeader,
  BusinessPerformanceInsightsCard,
  BusinessPhotoGrid,
  BusinessReviewsSection,
  BusinessScreenSkeleton,
  ContactBusinessModal,
  type BusinessHeaderMenuItem,
  PersonalizationInsightsCard,
  SimilarBusinessesSection,
} from '../../components/business-detail';
import {
  normalizeBusinessImages,
  normalizeBusinessRating,
  normalizeCategoryText,
  normalizeDescriptionText,
  normalizeLocationText,
} from '../../components/business-detail/utils';
import { useBusinessDetail } from '../../hooks/useBusinessDetail';
import { useGlobalScrollToTop } from '../../hooks/useGlobalScrollToTop';
import { useRealtimeQueryInvalidation } from '../../hooks/useRealtimeQueryInvalidation';
import { useAuthSession } from '../../hooks/useSession';
import { TransitionItem } from '../../components/motion/TransitionItem';
import { markFirstContentful, markInteractive } from '../../lib/perf/perfMarkers';
import { routes } from '../../navigation/routes';
import { businessDetailColors } from '../../components/business-detail/styles';
import { styles } from './business-screen/businessScreenStyles';

type Props = {
  initialTab?: 'overview' | 'reviews';
};

export default function BusinessScreen({ initialTab }: Props) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthSession();

  const { data: business, isLoading, isError } = useBusinessDetail(id);

  const realtimeTargets = useMemo(
    () => [
      {
        key: `business-detail-${id}`,
        table: 'businesses',
        filter: `id=eq.${id}`,
        queryKeys: [['business', id]],
        enabled: Boolean(id),
      },
      {
        key: `business-reviews-${id}`,
        table: 'reviews',
        filter: `business_id=eq.${id}`,
        queryKeys: [['business', id]],
        enabled: Boolean(id),
      },
    ],
    [id]
  );

  useRealtimeQueryInvalidation(realtimeTargets);

  const images = useMemo(() => (business ? normalizeBusinessImages(business) : []), [business]);
  const ratingMeta = useMemo(() => (business ? normalizeBusinessRating(business) : { rating: 0, reviewCount: 0 }), [business]);
  const categoryText = useMemo(() => (business ? normalizeCategoryText(business) : 'Business'), [business]);
  const locationText = useMemo(() => (business ? normalizeLocationText(business) : 'Cape Town'), [business]);
  const descriptionText = useMemo(() => (business ? normalizeDescriptionText(business) : ''), [business]);

  useEffect(() => {
    if (business && !isLoading) {
      const markerKey = `business:${business.id}`;
      markFirstContentful(markerKey);
      markInteractive(markerKey);
    }
  }, [business, isLoading]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(routes.home() as never);
  };

  const handleOpenNotifications = () => {
    router.push(routes.notifications() as never);
  };

  const handleOpenMessages = () => {
    router.push(routes.dmInbox() as never);
  };

  const headerMenuItems = useMemo<BusinessHeaderMenuItem[]>(
    () => [
      { key: 'home', label: 'Home', onPress: () => router.push(routes.home() as never) },
      { key: 'trending', label: 'Trending', onPress: () => router.push(routes.trending() as never) },
      { key: 'events', label: 'Events & Specials', onPress: () => router.push(routes.eventsSpecials() as never) },
      { key: 'saved', label: 'Saved', onPress: () => router.push(routes.saved() as never) },
      { key: 'profile', label: 'Profile', onPress: () => router.push(routes.profile() as never) },
    ],
    [router]
  );

  const handleLeaveReview = () => {
    if (!business) return;
    router.push(routes.writeReview('business', business.id) as never);
  };

  const isBusinessOwner = Boolean(user && business?.owner_id && user.id === business.owner_id);

  // Trigger contact modal after business loads and animations settle
  useEffect(() => {
    if (business && !contactModalTriggered.current && !isLoading && !isBusinessOwner) {
      contactModalTriggered.current = true;
      const timer = setTimeout(() => {
        setShowContactModal(true);
      }, 2500); // Show after reveal animations are mostly complete

      return () => clearTimeout(timer);
    }
  }, [business, isLoading, isBusinessOwner]);

  const handleCloseContactModal = () => {
    setShowContactModal(false);
  };

  const headerProgress = useRef(new Animated.Value(0)).current;
  const headerCollapsedRef = useRef(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollTopVisibleRef = useRef(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [showScrollTopButton, setShowScrollTopButton] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [showDeferredSections, setShowDeferredSections] = useState(false);
  const contactModalTriggered = useRef(false);

  useEffect(() => {
    setShowDeferredSections(false);
    const task = InteractionManager.runAfterInteractions(() => {
      requestAnimationFrame(() => {
        setShowDeferredSections(true);
      });
    });

    return () => {
      task.cancel();
    };
  }, [business?.id]);

  const setScrollTopVisible = useCallback((visible: boolean) => {
    if (scrollTopVisibleRef.current === visible) return;
    scrollTopVisibleRef.current = visible;
    setShowScrollTopButton(visible);
  }, []);

  const handleScrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  useGlobalScrollToTop({
    visible: showScrollTopButton,
    enabled: true,
    onScrollToTop: handleScrollToTop,
  });

  const setHeaderState = useCallback(
    (collapsed: boolean) => {
      if (headerCollapsedRef.current === collapsed) return;
      headerCollapsedRef.current = collapsed;
      setHeaderCollapsed(collapsed);
      Animated.spring(headerProgress, {
        toValue: collapsed ? 1 : 0,
        damping: 28,
        mass: 0.8,
        stiffness: 300,
        overshootClamping: true,
        useNativeDriver: false,
      }).start();
    },
    [headerProgress]
  );

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      setScrollTopVisible(y > 300);
      if (y > 52) setHeaderState(true);
      else if (y < 18) setHeaderState(false);
    },
    [setHeaderState, setScrollTopVisible]
  );

  const headerBg = headerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', businessDetailColors.coral],
  });
  const headerElevation = headerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 8],
  });
  const headerShadowOpacity = headerProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.12],
  });

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <BusinessScreenSkeleton />
      </SafeAreaView>
    );
  }

  if (isError || !business) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyState
          icon="alert-circle"
          title="Business not found"
          message="This business may no longer be available."
          actionLabel="Go home"
          onAction={() => router.replace(routes.home() as never)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.View style={[styles.stickyHeader, { backgroundColor: headerBg, elevation: headerElevation, shadowOpacity: headerShadowOpacity }]}>
        <BusinessPageHeader
          onPressBack={handleBack}
          onPressNotifications={handleOpenNotifications}
          onPressMessages={handleOpenMessages}
          menuItems={headerMenuItems}
          collapsed={headerCollapsed}
        />
      </Animated.View>

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.mainColumn}>
          <TransitionItem variant="card" index={0}>
            <BusinessHeroCarousel
              businessName={business.name}
              images={images}
              rating={ratingMeta.rating}
              verified={business.verified}
              subcategorySlug={business.primary_subcategory_slug ?? business.sub_interest_id ?? business.subInterestId}
              interestId={business.primary_category_slug ?? business.interest_id ?? business.interestId}
            />
          </TransitionItem>

          <TransitionItem variant="card" index={1}>
            <BusinessInfoBlock
              name={business.name}
              rating={ratingMeta.rating}
              category={categoryText}
              location={locationText}
            />
          </TransitionItem>

          <TransitionItem variant="card" index={2}>
            <BusinessDescriptionCard description={descriptionText} />
          </TransitionItem>

          <TransitionItem variant="card" index={3}>
            <BusinessDetailsCard
              priceRange={business.price_range ?? business.priceRange}
              verified={business.verified}
              hours={business.hours}
              openingHours={business.openingHours}
              opening_hours={business.opening_hours}
            />
          </TransitionItem>

          {showDeferredSections ? (
            <>
              <TransitionItem variant="card" index={4}>
                <BusinessPhotoGrid businessName={business.name} photos={images} />
              </TransitionItem>

              <TransitionItem variant="card" index={5}>
                <BusinessLocationCard
                  name={business.name}
                  address={business.address}
                  location={business.location}
                  latitude={business.lat}
                  longitude={business.lng}
                />
              </TransitionItem>

              <TransitionItem variant="card" index={6}>
                <BusinessContactInfoCard
                  phone={business.phone}
                  email={business.email}
                  website={business.website}
                  address={business.address}
                  location={business.location}
                />
              </TransitionItem>

              <TransitionItem variant="card" index={7}>
                <BusinessActionCard
                  onPressLeaveReview={handleLeaveReview}
                  onPressEditBusiness={() => router.push('/role-unsupported' as never)}
                  isBusinessOwner={isBusinessOwner}
                />
              </TransitionItem>

              <TransitionItem variant="card" index={8}>
                <PersonalizationInsightsCard
                  business={business}
                  onPressLogin={() => router.push(routes.onboarding() as never)}
                />
              </TransitionItem>

              <TransitionItem variant="card" index={9}>
                <BusinessPerformanceInsightsCard
                  punctuality={business.stats?.percentiles?.punctuality}
                  costEffectiveness={business.stats?.percentiles?.['cost-effectiveness']}
                  friendliness={business.stats?.percentiles?.friendliness}
                  trustworthiness={business.stats?.percentiles?.trustworthiness}
                />
              </TransitionItem>

              <TransitionItem variant="card" index={10}>
                <BusinessContactCard
                  businessId={business.id}
                  businessName={business.name}
                  phone={business.phone}
                />
              </TransitionItem>
            </>
          ) : null}
        </View>

        {showDeferredSections ? (
          <>
            <TransitionItem variant="card" index={11}>
              <BusinessOwnedEventsSection businessId={business.id} businessName={business.name} />
            </TransitionItem>

            <TransitionItem variant="card" index={12}>
              <BusinessReviewsSection businessId={business.id} onPressWriteReview={handleLeaveReview} />
            </TransitionItem>

            <TransitionItem variant="card" index={13}>
              <SimilarBusinessesSection businessId={business.id} />
            </TransitionItem>
          </>
        ) : null}

        {initialTab === 'reviews' ? (
          <TransitionItem variant="card" index={14}>
            <View style={styles.deeplinkHint}>
              <Text style={styles.deeplinkHintText}>
                This route now opens the write-review flow to match web behavior.
              </Text>
            </View>
          </TransitionItem>
        ) : null}
      </ScrollView>

      <ContactBusinessModal
        visible={showContactModal}
        businessName={business.name}
        businessPhone={business.phone}
        businessEmail={business.email}
        businessWebsite={business.website}
        onClose={handleCloseContactModal}
        onPressReview={handleLeaveReview}
      />
    </SafeAreaView>
  );
}
