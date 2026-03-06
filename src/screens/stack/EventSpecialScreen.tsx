import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  Alert,
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
import {
  EventSpecialActionCard,
  EventSpecialContactInfoCard,
  EventSpecialDescriptionCard,
  EventSpecialDetailsCard,
  EventSpecialHero,
  EventSpecialInfoBlock,
  EventSpecialMoreDatesCard,
  EventSpecialPageHeader,
  EventSpecialRelatedSection,
  EventSpecialReviewsSection,
  EventSpecialSkeleton,
  type EventSpecialHeaderMenuItem,
} from '../../components/event-detail';
import { businessDetailColors, businessDetailSpacing } from '../../components/business-detail/styles';
import { useEventReminder } from '../../hooks/useEventReminder';
import { useEventRatings } from '../../hooks/useEventRatings';
import { useEventReviews } from '../../hooks/useEventReviews';
import { useEventRsvp } from '../../hooks/useEventRsvp';
import { useEventSpecialDetail } from '../../hooks/useEventSpecialDetail';
import { useGlobalScrollToTop } from '../../hooks/useGlobalScrollToTop';
import { useRelatedEventSpecials } from '../../hooks/useRelatedEventSpecials';
import { useAuthSession } from '../../hooks/useSession';
import { routes } from '../../navigation/routes';

type Props = {
  routeType: 'event' | 'special';
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

function isUnauthorizedError(message: string | null) {
  return Boolean(message && /HTTP\s+401/.test(message));
}

export default function EventSpecialScreen({ routeType }: Props) {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthSession();

  const detailQuery = useEventSpecialDetail(id);
  const item = detailQuery.data;

  const ratings = useEventRatings(
    id,
    item?.rating != null ? Number(item.rating) : 0,
    item?.totalReviews ?? item?.reviews ?? 0
  );
  const reviews = useEventReviews(id);
  const related = useRelatedEventSpecials(id, 4);
  const rsvp = useEventRsvp(id);
  const reminder = useEventReminder(id);

  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const headerCollapsedRef = useRef(false);
  const headerProgress = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollTopVisibleRef = useRef(false);
  const [showScrollTopButton, setShowScrollTopButton] = useState(false);

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
      const offsetY = event.nativeEvent.contentOffset.y;
      setScrollTopVisible(offsetY > 300);
      if (offsetY > 52) setHeaderState(true);
      else if (offsetY < 18) setHeaderState(false);
    },
    [setHeaderState, setScrollTopVisible]
  );

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(routes.eventsSpecials() as never);
  };

  const headerMenuItems = useMemo<EventSpecialHeaderMenuItem[]>(
    () => [
      { key: 'home', label: 'Home', onPress: () => router.push(routes.home() as never) },
      { key: 'trending', label: 'Trending', onPress: () => router.push(routes.trending() as never) },
      { key: 'events', label: 'Events & Specials', onPress: () => router.push(routes.eventsSpecials() as never) },
      { key: 'saved', label: 'Saved', onPress: () => router.push(routes.saved() as never) },
      { key: 'profile', label: 'Profile', onPress: () => router.push(routes.profile() as never) },
    ],
    [router]
  );

  useEffect(() => {
    if (!item || !id) return;

    if (item.type !== routeType) {
      router.replace((item.type === 'special' ? routes.specialDetail(item.id) : routes.eventDetail(item.id)) as never);
    }
  }, [id, item, routeType, router]);

  const handlePressGoing = async () => {
    if (!user) {
      router.push(routes.login() as never);
      return;
    }

    try {
      await rsvp.toggleRsvp();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update RSVP right now.';
      if (isUnauthorizedError(message)) {
        router.push(routes.login() as never);
        return;
      }
      Alert.alert('RSVP unavailable', message);
    }
  };

  const handlePressReminder = async (option: '1_day' | '2_hours') => {
    if (!user) {
      router.push(routes.login() as never);
      return;
    }

    if (!item?.startDateISO) {
      Alert.alert('Reminder unavailable', 'This listing does not have a valid start date yet.');
      return;
    }

    try {
      const isActive = reminder.hasReminder(option);
      await reminder.toggleReminder({
        option,
        startDateISO: item.startDateISO,
        eventTitle: item.title,
        hasReminder: isActive,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to update reminder right now.';
      if (isUnauthorizedError(message)) {
        router.push(routes.login() as never);
        return;
      }
      Alert.alert('Reminder unavailable', message);
    }
  };

  const handlePressWriteReview = () => {
    if (!id) return;
    router.push(routes.writeReview(routeType, id) as never);
  };

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

  if (detailQuery.isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <EventSpecialSkeleton />
      </SafeAreaView>
    );
  }

  if (!item || detailQuery.isError || item.isExpired) {
    const missingMessage =
      detailQuery.errorStatus === 404
        ? routeType === 'special'
          ? 'This special may have expired or been removed.'
          : 'This event may no longer be available.'
        : detailQuery.error ?? 'Please try again later.';

    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerShown: false }} />
        <EmptyState
          icon="calendar"
          title={routeType === 'special' ? 'Special not found' : 'Event not found'}
          message={missingMessage}
          actionLabel="Back to Events & Specials"
          onAction={() => router.replace(routes.eventsSpecials() as never)}
        />
      </SafeAreaView>
    );
  }

  const effectiveRating = ratings.rating;

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <Animated.View
        style={[
          styles.stickyHeader,
          {
            backgroundColor: headerBg,
            elevation: headerElevation,
            shadowOpacity: headerShadowOpacity,
          },
        ]}
      >
        <EventSpecialPageHeader
          onPressBack={handleBack}
          onPressNotifications={() => router.push(routes.notifications() as never)}
          onPressMessages={() => router.push(routes.dmInbox() as never)}
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
            <EventSpecialHero item={item} rating={effectiveRating} />
          </RevealBlock>

          <RevealBlock delay={60}>
            <EventSpecialInfoBlock
              title={item.title}
              rating={effectiveRating}
              location={item.location}
              type={item.type}
            />
          </RevealBlock>

          <RevealBlock delay={120}>
            <EventSpecialDescriptionCard
              description={item.description}
              title={item.type === 'special' ? 'About This Special' : 'About This Event'}
            />
          </RevealBlock>

          <RevealBlock delay={180}>
            <EventSpecialDetailsCard item={item} />
          </RevealBlock>
        </View>

        <RevealBlock delay={240}>
          <EventSpecialRelatedSection
            title={item.type === 'special' ? 'More Specials Near You' : 'More Events Near You'}
            items={related.items}
            isLoading={related.isLoading}
            error={related.error}
          />
        </RevealBlock>

        <View style={styles.mainColumn}>
          <RevealBlock delay={300}>
            <EventSpecialMoreDatesCard
              currentStartISO={item.startDateISO}
              currentEndISO={item.endDateISO}
              occurrences={item.occurrencesList}
              onPressDate={(occurrenceId) => {
                const target = item.type === 'special' ? routes.specialDetail(occurrenceId) : routes.eventDetail(occurrenceId);
                router.push(target as never);
              }}
            />
          </RevealBlock>

          <RevealBlock delay={360}>
            <EventSpecialActionCard
              item={item}
              routeType={routeType}
              isGoing={rsvp.isGoing}
              rsvpCount={rsvp.count}
              rsvpBusy={rsvp.isToggling}
              reminderBusy={reminder.isMutating}
              hasReminder1Day={reminder.hasReminder('1_day')}
              hasReminder2Hours={reminder.hasReminder('2_hours')}
              onPressGoing={() => void handlePressGoing()}
              onPressReminder={(option) => void handlePressReminder(option)}
              onPressWriteReview={handlePressWriteReview}
            />
          </RevealBlock>

          <RevealBlock delay={420}>
            <EventSpecialContactInfoCard item={item} />
          </RevealBlock>
        </View>

        <RevealBlock delay={480}>
          <EventSpecialReviewsSection
            title={item.type === 'special' ? 'Special Reviews' : 'Event Reviews'}
            reviews={reviews.reviews}
            isLoading={reviews.isLoading}
            error={reviews.error}
            onPressWriteReview={handlePressWriteReview}
          />
        </RevealBlock>
      </ScrollView>
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
});
