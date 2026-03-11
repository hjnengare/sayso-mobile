import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { BusinessListItemDto } from '@sayso/contracts';
import { SkeletonCard } from '../SkeletonCard';
import { Text } from '../Typography';
import { useSimilarBusinesses } from '../../hooks/useSimilarBusinesses';
import { businessDetailColors, businessDetailSpacing } from './styles';
import { routes } from '../../navigation/routes';
import {
  getCategoryIconName,
  getBusinessIdentifier,
  normalizeRating,
  resolveDisplayImage,
  getDisplayCategoryLabel,
} from '../business-card/businessCardUtils';

const IMAGE_HEIGHT = 200;
const CARD_WIDTH = 290;

type SimilarBusinessCardProps = {
  business: BusinessListItemDto;
};

function getStarColor(rating: number | null): string {
  if (rating == null) return '#D66B6B';
  if (rating > 4.0) return '#E6A547';
  if (rating > 2.0) return '#D4915C';
  return '#D66B6B';
}

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
            <View style={styles.ambientOverlay} />
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

        {/* Verified badge */}
        {business.verified ? (
          <View style={[styles.badge, styles.badgeTopLeft]}>
            <Ionicons name="checkmark-circle" size={12} color={businessDetailColors.sage} />
            <Text style={styles.badgeText}>Verified</Text>
          </View>
        ) : null}

        {/* Rating badge */}
        <View style={[styles.badge, styles.badgeTopRight]}>
          {hasRating && displayRating != null ? (
            <>
              <Ionicons name="star" size={12} color={getStarColor(displayRating)} />
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

        {/* Meta row */}
        <View style={styles.metaRow}>
          <Ionicons name="star" size={11} color={businessDetailColors.coral} />
          <Text style={styles.metaText}>
            {hasRating && displayRating != null ? displayRating.toFixed(1) : '—'}
          </Text>
          {totalReviews > 0 ? (
            <Text style={styles.metaText}>
              {' · '}{totalReviews} {totalReviews === 1 ? 'review' : 'reviews'}
            </Text>
          ) : null}
        </View>

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

        {/* CTA */}
        <Pressable style={styles.ctaButton} onPress={handlePress}>
          <Text style={styles.ctaText}>Go to business</Text>
          <Ionicons name="arrow-forward" size={14} color={businessDetailColors.white} />
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
    gap: 10,
  },
  titleWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  pretitle: {
    color: businessDetailColors.textSubtle,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  title: {
    color: businessDetailColors.charcoal,
    fontSize: 28,
    fontWeight: '800',
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
  // SimilarBusinessCard styles
  card: {
    width: '100%',
    borderRadius: businessDetailSpacing.cardRadius,
    overflow: 'hidden',
    backgroundColor: businessDetailColors.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  imageWrap: {
    height: IMAGE_HEIGHT,
    overflow: 'hidden',
    backgroundColor: businessDetailColors.cardBg,
    position: 'relative',
  },
  ambientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
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
    paddingHorizontal: 8,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  badgeTopLeft: {
    top: 10,
    left: 10,
  },
  badgeTopRight: {
    top: 10,
    right: 10,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: businessDetailColors.charcoal,
  },
  body: {
    padding: 14,
    gap: 6,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: businessDetailColors.charcoal,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaText: {
    fontSize: 12,
    color: businessDetailColors.textMuted,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    color: businessDetailColors.textSubtle,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 2,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: businessDetailColors.charcoal,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  locationText: {
    fontSize: 12,
    color: businessDetailColors.textMuted,
    flex: 1,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
    backgroundColor: businessDetailColors.coral,
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  ctaText: {
    fontSize: 13,
    fontWeight: '700',
    color: businessDetailColors.white,
  },
});
