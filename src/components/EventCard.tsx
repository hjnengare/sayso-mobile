import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import type { EventSpecialListItemDto } from '@sayso/contracts';
import { CardSurface } from './CardSurface';
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

const ctaShadowStyle = getOverlayShadowStyle(CARD_CTA_RADIUS);

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
    <CardSurface
      radius={CARD_RADIUS}
      material="frosted"
      style={style}
      interactive
      onPress={handleNavigate}
      onPressIn={handlePressIn}
    >
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

        <Text style={[styles.reviewCount, !hasRating || reviews <= 0 ? styles.reviewCountEmpty : null]}>
          {hasRating && reviews > 0 ? `${reviews} Reviews` : 'Be the first to review'}
        </Text>

        <View style={[styles.ctaButton, ctaShadowStyle]} pointerEvents="none">
          <Text style={styles.ctaText}>{detailLabel}</Text>
        </View>
      </View>
    </CardSurface>
  );
}

export const EventCard = memo(
  EventCardComponent,
  (prev, next) => prev.item === next.item && prev.style === next.style
);

const styles = StyleSheet.create({
  media: {
    position: 'relative',
    width: '100%',
    height: 220,
    backgroundColor: '#F7FAFC',
  },
  mediaOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.16)',
  },
  body: {
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2D2D2D',
    lineHeight: 22,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(45,45,45,0.68)',
    marginTop: 7,
  },
  reviewCount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#722F37',
    textAlign: 'center',
    marginTop: 10,
  },
  reviewCountEmpty: {
    fontWeight: '400',
    color: 'rgba(45,45,45,0.68)',
  },
  ctaButton: {
    marginTop: 12,
    minHeight: 46,
    borderRadius: CARD_CTA_RADIUS,
    backgroundColor: '#722F37',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
