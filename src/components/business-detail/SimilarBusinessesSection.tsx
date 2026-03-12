import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { BusinessListItemDto } from '@sayso/contracts';
import { SkeletonCard } from '../SkeletonCard';
import { Text } from '../Typography';
import { useSimilarBusinesses } from '../../hooks/useSimilarBusinesses';
import { businessDetailColors, businessDetailSpacing, cardShadowStyle } from './styles';
import { routes } from '../../navigation/routes';
import {
  getCategoryIconName,
  getBusinessIdentifier,
  normalizeRating,
  resolveDisplayImage,
  getDisplayCategoryLabel,
} from '../business-card/businessCardUtils';

const IMAGE_HEIGHT = 260;

type SimilarBusinessCardProps = {
  business: BusinessListItemDto;
};

function SimilarBusinessCard({ business }: SimilarBusinessCardProps) {
  const router = useRouter();
  const identifier = getBusinessIdentifier(business);
  const { image, placeholderImage } = resolveDisplayImage(business);
  const { hasRating, displayRating, totalReviews } = normalizeRating(business);
  const categoryLabel = getDisplayCategoryLabel(business);
  const categorySlug = (business.sub_interest_id ?? business.subInterestId ?? '').toString();
  const categoryIcon = getCategoryIconName(categoryLabel, categorySlug, business.subInterestLabel ?? categoryLabel);

  const handlePress = () => {
    router.push(routes.businessDetail(identifier) as never);
  };

  return (
    <Pressable style={styles.card} onPress={handlePress}>
      {/* Image section */}
      <View style={styles.imageWrap}>
        {image ? (
          <>
            <Image
              source={image}
              style={StyleSheet.absoluteFillObject}
              contentFit="cover"
              blurRadius={28}
            />
            <Image
              source={image}
              style={styles.foregroundImage}
              contentFit="cover"
            />
          </>
        ) : placeholderImage ? (
          <Image source={placeholderImage} style={styles.foregroundImage} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFillObject, styles.imageFallback]} />
        )}

        {/* Depth overlay — subtle gradient, bottom-to-top, matching web's linear-gradient(to top,...) */}
        <LinearGradient
          colors={['rgba(0,0,0,0.06)', 'rgba(0,0,0,0.02)', 'transparent']}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />

        {/* Verified badge */}
        {business.verified ? (
          <View style={[styles.badge, styles.badgeTopLeft]}>
            <Ionicons name="checkmark-circle" size={12} color={businessDetailColors.sage} />
            <Text style={styles.badgeText}>Verified</Text>
          </View>
        ) : null}

        {/* Rating badge — star charcoal-filled, matching web */}
        <View style={[styles.badge, styles.badgeTopRight]}>
          {hasRating && displayRating != null ? (
            <>
              <Ionicons name="star" size={12} color={businessDetailColors.charcoal} />
              <Text style={styles.badgeText}>{displayRating.toFixed(1)}</Text>
            </>
          ) : (
            <Text style={styles.badgeText}>New</Text>
          )}
        </View>
      </View>

      {/* Card body */}
      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>{business.name}</Text>

        {/* Meta row — centered, coral star */}
        {(hasRating && displayRating != null) || totalReviews > 0 ? (
          <View style={styles.metaRow}>
            {hasRating && displayRating != null ? (
              <View style={styles.metaInner}>
                <Ionicons name="star" size={11} color={businessDetailColors.coral} />
                <Text style={styles.metaStrong}>{displayRating.toFixed(1)}</Text>
              </View>
            ) : null}
            {totalReviews > 0 ? (
              <Text style={styles.metaText}>
                {hasRating ? ' · ' : ''}{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
              </Text>
            ) : null}
          </View>
        ) : null}

        {/* Description */}
        {business.description ? (
          <Text style={styles.description} numberOfLines={2}>{business.description}</Text>
        ) : null}

        {/* Location row */}
        <View style={styles.locationRow}>
          <View style={styles.iconCircle}>
            <Ionicons name={categoryIcon as any} size={14} color={businessDetailColors.white} />
          </View>
          <Text style={styles.locationText} numberOfLines={1}>
            {business.address ?? business.location ?? categoryLabel}
          </Text>
        </View>

        {/* CTA — LinearGradient matching web's from-navbar-bg to-navbar-bg/90 */}
        <Pressable onPress={handlePress} style={styles.ctaWrap}>
          <LinearGradient
            colors={[businessDetailColors.coral, 'rgba(114,47,55,0.90)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.ctaButton}
          >
            <Text style={styles.ctaText}>Go to business</Text>
            <Ionicons name="arrow-forward" size={14} color={businessDetailColors.white} />
          </LinearGradient>
        </Pressable>
      </View>
    </Pressable>
  );
}

type Props = {
  businessId: string;
};

export function SimilarBusinessesSection({ businessId }: Props) {
  const { businesses, isLoading } = useSimilarBusinesses(businessId, { limit: 3, radiusKm: 50 });

  if (!isLoading && businesses.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <View style={styles.titleWrap}>
        <Text style={styles.pretitle}>Similar Businesses</Text>
        <Text style={styles.title}>You Might Also Like</Text>
      </View>

      <View style={styles.stackedContent}>
        {isLoading
          ? [1, 2, 3].map((item) => (
              <View key={`similar-skeleton-${item}`} style={styles.stackedCard}>
                <SkeletonCard />
              </View>
            ))
          : businesses.map((business) => (
              <SimilarBusinessCard key={`similar-business-${business.id}`} business={business} />
            ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 8,
    paddingBottom: 8,
    gap: 24,
  },
  titleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pretitle: {
    color: 'rgba(45,45,45,0.70)',
    fontSize: 11,
    letterSpacing: 1.65,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  title: {
    color: businessDetailColors.charcoal,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  stackedContent: {
    paddingHorizontal: businessDetailSpacing.pageGutter,
    gap: 16,
    paddingBottom: 4,
  },
  stackedCard: {
    width: '100%',
  },
  // ── SimilarBusinessCard ──────────────────────────────────────────────────────
  card: {
    width: '100%',
    borderRadius: businessDetailSpacing.cardRadius,
    overflow: 'hidden',
    backgroundColor: businessDetailColors.cardBg,
    ...cardShadowStyle,
  } as object,
  imageWrap: {
    height: IMAGE_HEIGHT,
    overflow: 'hidden',
    backgroundColor: businessDetailColors.cardBg,
    position: 'relative',
  },
  foregroundImage: {
    width: '100%',
    height: '100%',
  },
  imageFallback: {
    backgroundColor: businessDetailColors.cardBg,
  },
  badge: {
    position: 'absolute',
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgba(229,224,229,0.95)',
  },
  badgeTopLeft: {
    top: 12,
    left: 12,
  },
  badgeTopRight: {
    top: 12,
    right: 12,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: businessDetailColors.charcoal,
  },
  body: {
    padding: 16,
    gap: 8,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: businessDetailColors.charcoal,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    marginTop: -2,
  },
  metaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaStrong: {
    fontSize: 12,
    fontWeight: '600',
    color: businessDetailColors.textMuted,
  },
  metaText: {
    fontSize: 12,
    color: businessDetailColors.textMuted,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: businessDetailColors.textMuted,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(114,47,55,0.50)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  locationText: {
    fontSize: 12,
    color: businessDetailColors.textMuted,
    flex: 1,
  },
  ctaWrap: {
    marginTop: 12,
    borderRadius: 999,
    overflow: 'hidden',
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(125,155,118,0.50)',
  },
  ctaText: {
    fontSize: 14,
    fontWeight: '600',
    color: businessDetailColors.white,
  },
});
