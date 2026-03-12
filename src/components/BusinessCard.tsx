import { memo, useCallback, useMemo } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import type { BusinessListItemDto } from '@sayso/contracts';
import { routes } from '../navigation/routes';
import { fetchBusinessDetail, getBusinessDetailQueryKey } from '../hooks/useBusinessDetail';
import { markRouteTransitionStart } from '../lib/perf/perfMarkers';
import { prefetchRouteIntent } from '../lib/perf/prefetchRouteIntent';
import { getOverlayShadowStyle } from '../styles/overlayShadow';
import { CARD_CTA_RADIUS, CARD_RADIUS } from '../styles/radii';
import { Text } from './Typography';
import { BusinessCardBadges } from './business-card/BusinessCardBadges';
import { BusinessCardCategory } from './business-card/BusinessCardCategory';
import { BusinessCardImage } from './business-card/BusinessCardImage';
import { BusinessCardPercentiles } from './business-card/BusinessCardPercentiles';
import { BusinessCardReviewStars } from './business-card/BusinessCardReviewStars';
import {
  getBusinessIdentifier,
  getDisplayCategoryLabel,
  normalizeCategorySlug,
  normalizeRating,
  resolveDisplayImage,
} from './business-card/businessCardUtils';

type Props = {
  business: BusinessListItemDto;
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

function getDistanceBadgeText(business: BusinessListItemDto): string | null {
  const raw = (business as BusinessListItemDto & { distance?: number | string | null }).distance;
  if (raw == null) {
    return null;
  }

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    if (raw <= 0) return null;
    return `${raw.toFixed(raw < 10 ? 1 : 0)} km away`;
  }

  const normalized = String(raw).trim();
  if (!normalized) {
    return null;
  }
  if (/away$/i.test(normalized) || /km/i.test(normalized)) {
    return normalized;
  }
  return `${normalized} away`;
}

function BusinessCardComponent({ business, style }: Props) {
  const router = useRouter();
  const businessIdentifier = getBusinessIdentifier(business);
  const href = routes.businessDetail(businessIdentifier);
  const displayCategoryLabel = getDisplayCategoryLabel(business);
  const categorySlug = normalizeCategorySlug(business);
  const { hasRating, displayRating, totalReviews } = normalizeRating(business);
  const { image, isPlaceholder, placeholderImage } = resolveDisplayImage(business);
  const isFeaturedCard = String(business.badge ?? '').toLowerCase() === 'featured';
  const distanceBadgeText = useMemo(() => getDistanceBadgeText(business), [business]);
  const ctaLabel = isFeaturedCard ? 'Review' : 'View Details';

  const handlePressIn = useCallback(() => {
    prefetchRouteIntent(`business:${businessIdentifier}`, {
      href,
      router: router as unknown as { prefetch?: (path: string) => Promise<void> | void },
      queryKeys: [
        {
          queryKey: getBusinessDetailQueryKey(businessIdentifier),
          queryFn: () => fetchBusinessDetail(businessIdentifier),
          staleTime: 120_000,
        },
      ],
    });
  }, [businessIdentifier, href, router]);

  const handleNavigate = useCallback(() => {
    markRouteTransitionStart(`business:${businessIdentifier}`);
    router.push(href as never);
  }, [businessIdentifier, href, router]);

  return (
    <Pressable
      style={({ pressed }) => [styles.card, cardShadowStyle, style, pressed ? styles.cardPressed : null]}
      onPress={handleNavigate}
      onPressIn={handlePressIn}
      accessibilityRole="button"
      accessibilityLabel={`View ${business.name} details`}
    >
      <LinearGradient colors={CARD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cardGradient}>
        <View style={styles.media}>
          <BusinessCardImage imageUri={image} placeholderUri={placeholderImage} isPlaceholder={isPlaceholder} />
          <BusinessCardBadges
            verified={business.verified}
            hasRating={hasRating}
            rating={displayRating}
            distanceBadgeText={distanceBadgeText}
          />
        </View>

        <View style={styles.body}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">
            {business.name}
          </Text>
          <BusinessCardCategory
            category={displayCategoryLabel}
            subInterestId={business.sub_interest_id ?? business.subInterestId ?? categorySlug}
            subInterestLabel={business.subInterestLabel ?? displayCategoryLabel}
            style={styles.category}
          />
          <View style={styles.reviewRow}>
            {hasRating && totalReviews > 0 ? (
              <>
                <Text style={styles.reviewCountNumber}>{totalReviews}</Text>
                <Text style={styles.reviewCountLabel}>Reviews</Text>
              </>
            ) : (
              <Text style={styles.reviewCountEmpty}>Be the first to review</Text>
            )}
          </View>
          {isFeaturedCard ? (
            <BusinessCardReviewStars rating={hasRating ? displayRating : 0} />
          ) : (
            <BusinessCardPercentiles percentiles={business.percentiles} />
          )}

          <Pressable
            style={({ pressed }) => [styles.reviewButton, ctaShadowStyle, pressed ? styles.reviewButtonPressed : null]}
            onPress={(event) => {
              event.stopPropagation();
              prefetchRouteIntent(`business:${businessIdentifier}`, {
                href,
                router: router as unknown as { prefetch?: (path: string) => Promise<void> | void },
                queryKeys: [
                  {
                    queryKey: getBusinessDetailQueryKey(businessIdentifier),
                    queryFn: () => fetchBusinessDetail(businessIdentifier),
                    staleTime: 120_000,
                  },
                ],
              });
              handleNavigate();
            }}
          >
            <LinearGradient
              colors={CTA_GRADIENT}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.reviewButtonGradient}
            >
              <Text style={styles.reviewButtonText}>{ctaLabel}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export const BusinessCard = memo(
  BusinessCardComponent,
  (prev, next) => prev.business === next.business && prev.style === next.style
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
    width: '100%',
    height: 280,
    backgroundColor: '#E5E0E5',
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
    alignItems: 'center',
    backgroundColor: 'rgba(157,171,155,0.10)',
  },
  name: {
    fontSize: 19,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
    lineHeight: 25,
    letterSpacing: -0.18,
    width: '100%',
  },
  category: {
    marginTop: 2,
  },
  reviewRow: {
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 17,
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
  reviewButton: {
    marginTop: 12,
    minHeight: 48,
    borderRadius: CARD_CTA_RADIUS,
    width: '100%',
    overflow: 'hidden',
  },
  reviewButtonGradient: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    borderRadius: CARD_CTA_RADIUS,
    borderWidth: 1,
    borderColor: 'rgba(125,155,118,0.5)',
  },
  cardPressed: {
    opacity: 0.96,
  },
  reviewButtonPressed: {
    opacity: 0.96,
  },
  reviewButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
