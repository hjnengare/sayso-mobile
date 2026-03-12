import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { EventSpecialListItemDto } from '@sayso/contracts';
import { getOverlayShadowStyle } from '../styles/overlayShadow';
import { CARD_CTA_RADIUS, CARD_RADIUS } from '../styles/radii';
import { Text } from './Typography';
import { EventCardImage } from './event-card/EventCardImage';
import { EventCountdownBadge } from './event-card/EventCountdownBadge';
import { EventDateRibbon } from './event-card/EventDateRibbon';
import { EventRatingBadge } from './event-card/EventRatingBadge';
import { EventStatusPills } from './event-card/EventStatusPills';
import {
  fetchEventSpecialDetail,
  getEventSpecialDetailQueryKey,
} from '../hooks/useEventSpecialDetail';
import { markRouteTransitionStart } from '../lib/perf/perfMarkers';
import { prefetchRouteIntent } from '../lib/perf/prefetchRouteIntent';
import {
  getDateRibbonLabel,
  getEventCountdownState,
  getEventDescription,
  getEventDetailHref,
  normalizeEventRating,
  resolveEventMediaImage,
  type EventCountdownState,
} from './event-card/eventCardUtils';

type Props = {
  item: EventSpecialListItemDto;
  style?: StyleProp<ViewStyle>;
};

type WebViewStyle = ViewStyle & {
  boxShadow?: string;
};

const ctaShadowStyle = getOverlayShadowStyle(CARD_CTA_RADIUS);
const CARD_GRADIENT = ['#9DAB9B', '#9DAB9B', 'rgba(157,171,155,0.95)'] as const;
const CTA_GRADIENT = ['#722F37', 'rgba(114,47,55,0.90)'] as const;
const cardShadowStyle: ViewStyle =
  Platform.OS === 'web'
    ? ({
        boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
      } as WebViewStyle)
    : {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
        elevation: 6,
      };

function EventCardComponent({ item, style }: Props) {
  const router = useRouter();
  const href = useMemo(() => getEventDetailHref(item), [item]);
  const { image, isFallbackArtwork } = resolveEventMediaImage(item);
  const { hasRating, displayRating, reviews } = normalizeEventRating(item);
  const [countdown, setCountdown] = useState<EventCountdownState>(() => getEventCountdownState(item));
  const detailLabel = item.type === 'event' ? 'View Event' : 'View Special';

  useEffect(() => {
    const updateCountdown = () => {
      setCountdown(getEventCountdownState(item));
    };

    updateCountdown();
    const intervalId = setInterval(updateCountdown, 60_000);

    return () => clearInterval(intervalId);
  }, [item]);

  const handlePressIn = useCallback(() => {
    prefetchRouteIntent(`event-special:${item.id}`, {
      href,
      router: router as unknown as { prefetch?: (path: string) => Promise<void> | void },
      queryKeys: [
        {
          queryKey: getEventSpecialDetailQueryKey(item.id),
          queryFn: () => fetchEventSpecialDetail(item.id),
          staleTime: 120_000,
        },
      ],
    });
  }, [href, item.id, router]);

  const handleNavigate = useCallback(() => {
    markRouteTransitionStart(`event-special:${item.id}`);
    router.push(href as never);
  }, [href, item.id, router]);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, cardShadowStyle, style, pressed ? styles.cardPressed : null]}
      onPress={handleNavigate}
      onPressIn={handlePressIn}
      accessibilityRole="button"
      accessibilityLabel={`View ${item.title} details`}
    >
      <LinearGradient colors={CARD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardGradient}>
        <View style={styles.media}>
          <EventCardImage imageUri={image} isFallbackArtwork={isFallbackArtwork} />
          <View style={styles.mediaOverlay} pointerEvents="none" />
          <EventDateRibbon label={getDateRibbonLabel(item)} />
          {hasRating && displayRating !== undefined ? <EventRatingBadge rating={displayRating} /> : null}
          {countdown.show ? <EventCountdownBadge countdown={countdown} /> : null}
        </View>

        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
            {item.title}
          </Text>

          <Text style={styles.description} numberOfLines={2}>
            {getEventDescription(item)}
          </Text>

          <EventStatusPills item={item} />

          <View style={styles.reviewRow}>
            {hasRating && reviews > 0 ? (
              <>
                <Text style={styles.reviewCountNumber}>{reviews}</Text>
                <Text style={styles.reviewCountLabel}>Reviews</Text>
              </>
            ) : (
              <Text style={styles.reviewCountEmpty}>Be the first to review</Text>
            )}
          </View>

          <Pressable
            style={({ pressed }) => [styles.ctaButton, ctaShadowStyle, pressed ? styles.ctaButtonPressed : null]}
            onPress={(event) => {
              event.stopPropagation();
              handleNavigate();
            }}
          >
            <LinearGradient
              colors={CTA_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>{detailLabel}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export const EventCard = memo(
  EventCardComponent,
  (prev, next) => prev.item === next.item && prev.style === next.style
);

const styles = StyleSheet.create({
  card: {
    borderRadius: CARD_RADIUS,
    overflow: 'hidden',
    backgroundColor: '#9DAB9B',
  },
  cardGradient: {
    width: '100%',
  },
  media: {
    position: 'relative',
    width: '100%',
    height: 280,
    backgroundColor: '#E5E0E5',
  },
  mediaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  body: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    backgroundColor: 'rgba(157,171,155,0.10)',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    lineHeight: 19,
    fontWeight: '400',
    color: 'rgba(45,45,45,0.70)',
    marginTop: 7,
  },
  reviewRow: {
    marginTop: 10,
    minHeight: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  reviewCountNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#722F37',
  },
  reviewCountLabel: {
    fontSize: 14,
    fontWeight: '400',
    color: '#722F37',
  },
  reviewCountEmpty: {
    fontSize: 14,
    fontWeight: '400',
    color: 'rgba(45,45,45,0.68)',
  },
  ctaButton: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: CARD_CTA_RADIUS,
    overflow: 'hidden',
  },
  ctaGradient: {
    minHeight: 48,
    borderRadius: CARD_CTA_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(125,155,118,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  ctaButtonPressed: {
    opacity: 0.96,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cardPressed: {
    opacity: 0.96,
  },
});
