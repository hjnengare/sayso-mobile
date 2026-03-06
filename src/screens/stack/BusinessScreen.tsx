import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Animated,
  Easing,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
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
import { useAuthSession } from '../../hooks/useSession';
import { routes } from '../../navigation/routes';
import { businessDetailColors, businessDetailSpacing } from '../../components/business-detail/styles';

type Props = {
  initialTab?: 'overview' | 'reviews';
};

type RevealBlockProps = {
  children: ReactNode;
  delay?: number;
  style?: StyleProp<ViewStyle>;
};

function RevealBlock({ children, delay = 0, style }: RevealBlockProps) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 440,
        easing: Easing.out(Easing.back(1.08)),
        useNativeDriver: true,
      }).start();
    }, delay);

    return () => {
      clearTimeout(timer);
      anim.stopAnimation();
    };
  }, [anim, delay]);

  return (
    <Animated.View
      style={[
        style,
        {
          opacity: anim,
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

export default function BusinessScreen({ initialTab }: Props) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthSession();

  const { data: business, isLoading, isError } = useBusinessDetail(id);

  const images = useMemo(() => (business ? normalizeBusinessImages(business) : []), [business]);
  const ratingMeta = useMemo(() => (business ? normalizeBusinessRating(business) : { rating: 0, reviewCount: 0 }), [business]);
  const categoryText = useMemo(() => (business ? normalizeCategoryText(business) : 'Business'), [business]);
  const locationText = useMemo(() => (business ? normalizeLocationText(business) : 'Cape Town'), [business]);
  const descriptionText = useMemo(() => (business ? normalizeDescriptionText(business) : ''), [business]);

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
    if (!user) {
      router.push(routes.login() as never);
      return;
    }

    router.push(routes.businessReviewForm(business.id) as never);
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
  const contactModalTriggered = useRef(false);

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
          <RevealBlock delay={0}>
            <BusinessHeroCarousel
              businessName={business.name}
              images={images}
              rating={ratingMeta.rating}
              verified={business.verified}
              subcategorySlug={business.primary_subcategory_slug ?? business.sub_interest_id ?? business.subInterestId}
              interestId={business.primary_category_slug ?? business.interest_id ?? business.interestId}
            />
          </RevealBlock>

          <RevealBlock delay={60}>
            <BusinessInfoBlock
              name={business.name}
              rating={ratingMeta.rating}
              category={categoryText}
              location={locationText}
            />
          </RevealBlock>

          <RevealBlock delay={120}>
            <BusinessDescriptionCard description={descriptionText} />
          </RevealBlock>

          <RevealBlock delay={180}>
            <BusinessDetailsCard
              priceRange={business.price_range ?? business.priceRange}
              verified={business.verified}
              hours={business.hours}
              openingHours={business.openingHours}
              opening_hours={business.opening_hours}
            />
          </RevealBlock>

          <RevealBlock delay={240}>
            <BusinessPhotoGrid businessName={business.name} photos={images} />
          </RevealBlock>

          <RevealBlock delay={300}>
            <BusinessLocationCard
              name={business.name}
              address={business.address}
              location={business.location}
              latitude={business.lat}
              longitude={business.lng}
            />
          </RevealBlock>

          <RevealBlock delay={360}>
            <BusinessContactInfoCard
              phone={business.phone}
              email={business.email}
              website={business.website}
              address={business.address}
              location={business.location}
            />
          </RevealBlock>

          <RevealBlock delay={420}>
            <BusinessActionCard
              onPressLeaveReview={handleLeaveReview}
              onPressEditBusiness={() => router.push('/role-unsupported' as never)}
              isBusinessOwner={isBusinessOwner}
            />
          </RevealBlock>

          <RevealBlock delay={480}>
            <PersonalizationInsightsCard
              business={business}
              onPressLogin={() => router.push(routes.login() as never)}
            />
          </RevealBlock>

          <RevealBlock delay={540}>
            <BusinessPerformanceInsightsCard
              punctuality={business.stats?.percentiles?.punctuality}
              costEffectiveness={business.stats?.percentiles?.['cost-effectiveness']}
              friendliness={business.stats?.percentiles?.friendliness}
              trustworthiness={business.stats?.percentiles?.trustworthiness}
            />
          </RevealBlock>

          <RevealBlock delay={600}>
            <BusinessContactCard
              businessId={business.id}
              businessName={business.name}
              phone={business.phone}
            />
          </RevealBlock>
        </View>

        <RevealBlock delay={660}>
          <BusinessOwnedEventsSection businessId={business.id} businessName={business.name} />
        </RevealBlock>

        <RevealBlock delay={720}>
          <BusinessReviewsSection businessId={business.id} onPressWriteReview={handleLeaveReview} />
        </RevealBlock>

        <RevealBlock delay={780}>
          <SimilarBusinessesSection businessId={business.id} />
        </RevealBlock>

        {initialTab === 'reviews' ? (
          <RevealBlock delay={840}>
            <View style={styles.deeplinkHint}>
              <Text style={styles.deeplinkHintText}>
                This route now opens the write-review flow to match web behavior.
              </Text>
            </View>
          </RevealBlock>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: businessDetailColors.page,
  },
  stickyHeader: {
    paddingHorizontal: businessDetailSpacing.pageGutter,
    paddingTop: 10,
    paddingBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 6,
    paddingBottom: 26,
    gap: 16,
  },
  mainColumn: {
    marginHorizontal: businessDetailSpacing.pageGutter,
    gap: 14,
  },
  deeplinkHint: {
    marginHorizontal: businessDetailSpacing.pageGutter,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(229,224,229,0.66)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.34)',
  },
  deeplinkHintText: {
    color: businessDetailColors.textSubtle,
    fontSize: 12,
    lineHeight: 17,
  },
});
