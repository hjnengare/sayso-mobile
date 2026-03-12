import { useState } from 'react';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { TopReviewerDto, RecentReviewDto } from '@sayso/contracts';
import { Text } from '../Typography';
import { useAuth } from '../../providers/AuthProvider';
import { routes } from '../../navigation/routes';

// ─── Colors (aligned with web tailwind.config.js) ─────────────────────────────
const C = {
  coral: '#722F37',
  charcoal: '#2D2D2D',
  sage: '#7D9B76',
  cardBg: '#9DAB9B',
  offWhite: '#E5E0E5',
  white: '#FFFFFF',
  amber400: '#FBBF24',
  amber300: '#FCD34D',
  amber100: '#FEF3C7',
  topBg: '#1c1712',
  // opacity variants
  charcoal60: 'rgba(45,45,45,0.60)',
  charcoal45: 'rgba(45,45,45,0.45)',
  charcoal40: 'rgba(45,45,45,0.40)',
  charcoal38: 'rgba(45,45,45,0.38)',
  charcoal35: 'rgba(45,45,45,0.35)',
  charcoal28: 'rgba(45,45,45,0.28)',
  charcoal20: 'rgba(45,45,45,0.20)',
  charcoal08: 'rgba(45,45,45,0.08)',
  charcoal06: 'rgba(45,45,45,0.06)',
  charcoal05: 'rgba(45,45,45,0.05)',
  amber40: 'rgba(251,191,36,0.80)',
  amber45: 'rgba(251,191,36,0.45)',
  amber12: 'rgba(251,191,36,0.12)',
  amberBg: 'rgba(69,26,3,0.40)',
  amberBgHover: 'rgba(69,26,3,0.60)',
  offWhite70: 'rgba(229,224,229,0.70)',
  offWhite50: 'rgba(229,224,229,0.50)',
  coralFill: 'rgba(114,47,55,0.65)',
};

// ─── Badge chip ────────────────────────────────────────────────────────────────
type BadgeType = 'top' | 'verified' | 'local';

const BADGE_LABELS: Record<BadgeType, string> = {
  top: '★ Top Reviewer',
  verified: '✓ Verified',
  local: '📍 Local Expert',
};

const BADGE_COLORS: Record<BadgeType, { bg: string; border: string; text: string }> = {
  top: { bg: C.amberBg, border: C.amber12, text: C.amber300 },
  verified: { bg: C.offWhite70, border: C.charcoal06, text: C.sage },
  local: { bg: C.offWhite70, border: C.charcoal06, text: C.sage },
};

function BadgeChip({ badge, isTopCard }: { badge: BadgeType; isTopCard: boolean }) {
  const colors = isTopCard && badge !== 'top'
    ? { bg: C.amberBg, border: C.amber12, text: 'rgba(251,191,36,0.60)' }
    : BADGE_COLORS[badge] ?? BADGE_COLORS.verified;

  return (
    <View style={[chipStyles.chip, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <Text style={[chipStyles.label, { color: colors.text }]}>{BADGE_LABELS[badge]}</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
  },
});

// ─── Stars ─────────────────────────────────────────────────────────────────────
function Stars({ rating, size = 12 }: { rating: number; size?: number }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= Math.round(rating) ? 'star' : 'star-outline'}
          size={size}
          color={i <= Math.round(rating) ? C.coral : C.charcoal20}
        />
      ))}
    </View>
  );
}

// ─── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({
  src,
  name,
  size,
  badge,
  isTopCard,
}: {
  src?: string;
  name: string;
  size: number;
  badge?: BadgeType;
  isTopCard: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const initial = (name || 'U')[0].toUpperCase();

  return (
    <View style={{ position: 'relative' }}>
      {src && !imgError ? (
        <Image
          source={{ uri: src }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 2,
            borderColor: isTopCard ? C.amber400 : C.white,
          }}
          onError={() => setImgError(true)}
          contentFit="cover"
        />
      ) : (
        <View
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isTopCard
              ? 'rgba(69,26,3,0.60)'
              : `rgba(125,155,118,0.25)`,
            borderWidth: 2,
            borderColor: isTopCard ? 'rgba(251,191,36,0.30)' : C.white,
          }}
        >
          {size >= 40 ? (
            <Ionicons name="person" size={size * 0.42} color={isTopCard ? 'rgba(251,211,77,0.5)' : C.charcoal40} />
          ) : (
            <Text style={{ fontSize: size * 0.42, fontWeight: '700', color: isTopCard ? C.amber300 : C.sage }}>
              {initial}
            </Text>
          )}
        </View>
      )}

      {/* Authority badge overlay */}
      {badge === 'verified' && (
        <View style={avatarStyles.badgeOverlay}>
          <View style={avatarStyles.verifiedDot}>
            <Ionicons name="checkmark" size={8} color={C.white} />
          </View>
        </View>
      )}
      {badge === 'top' && (
        <View style={avatarStyles.badgeOverlay}>
          <View style={[avatarStyles.topDot, { backgroundColor: C.amber400 }]}>
            <Ionicons name="star" size={8} color={C.white} />
          </View>
        </View>
      )}
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  badgeOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    zIndex: 20,
  },
  verifiedDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: C.sage,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.white,
  },
  topDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: C.topBg,
  },
});

// ─── Props ─────────────────────────────────────────────────────────────────────
export type ReviewerCardProps =
  | { variant: 'reviewer'; reviewer: TopReviewerDto; latestReview?: RecentReviewDto }
  | { variant?: 'review'; review: RecentReviewDto };

// ─── ReviewerCard ──────────────────────────────────────────────────────────────
export function ReviewerCard(props: ReviewerCardProps) {
  const router = useRouter();
  const { user } = useAuth();

  // ── REVIEWER VARIANT ─────────────────────────────────────────────────────────
  if (props.variant === 'reviewer') {
    const { reviewer, latestReview } = props;
    const isTopReviewer = reviewer.badge === 'top';
    const isOwnCard = !!user && user.id === reviewer.id;
    const href = isOwnCard ? routes.profile() : routes.reviewer(reviewer.id);

    const stats = [
      { value: reviewer.reviewCount, label: 'Reviews' },
      {
        value: reviewer.avgRatingGiven != null ? reviewer.avgRatingGiven.toFixed(1) : '—',
        label: 'Avg ★',
      },
      { value: reviewer.helpfulVotes ?? 0, label: 'Helpful' },
    ];

    const badgesCount = reviewer.badgesCount ?? 0;
    const primaryBadge = reviewer.badge as BadgeType | undefined;
    const extraCount = Math.max(0, badgesCount - (primaryBadge ? 1 : 0));

    return (
      <Pressable
        style={[
          reviewerStyles.card,
          { backgroundColor: C.cardBg },
        ]}
        onPress={() => router.push(href as any)}
        accessibilityRole="button"
      >
        {/* Top accent */}
        <LinearGradient
          colors={['rgba(114,47,55,0.50)', 'rgba(125,155,118,0.60)', 'rgba(114,47,55,0.30)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={reviewerStyles.accent}
        />

        <View style={reviewerStyles.body}>
          {/* Identity row */}
          <View style={reviewerStyles.identityRow}>
            <Avatar
              src={reviewer.profilePicture}
              name={reviewer.name}
              size={48}
              badge={reviewer.badge as BadgeType}
              isTopCard={false}
            />
            <View style={reviewerStyles.identityText}>
              <Text
                style={[
                  reviewerStyles.name,
                  { color: C.charcoal },
                ]}
                numberOfLines={1}
              >
                {reviewer.name}
              </Text>
              {isTopReviewer ? (
                <View style={reviewerStyles.topLabelRow}>
                  <Ionicons name="star" size={10} color={C.amber400} />
                  <Text style={reviewerStyles.topLabel}>Top Reviewer</Text>
                </View>
              ) : reviewer.location ? (
                <View style={reviewerStyles.locationRow}>
                  <Ionicons name="location-outline" size={10} color={C.charcoal45} />
                  <Text style={reviewerStyles.location} numberOfLines={1}>
                    {reviewer.location}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* Stats grid */}
          <View style={reviewerStyles.statsGrid}>
            {stats.map(({ value, label }) => (
              <View
                key={label}
                style={[
                  reviewerStyles.statCell,
                  {
                    backgroundColor: C.offWhite70,
                    borderColor: C.charcoal06,
                  },
                ]}
              >
                <Text
                  style={[
                    reviewerStyles.statValue,
                    { color: C.charcoal },
                  ]}
                >
                  {value}
                </Text>
                <Text
                  style={[
                    reviewerStyles.statLabel,
                    { color: C.charcoal40 },
                  ]}
                >
                  {label}
                </Text>
              </View>
            ))}
          </View>

          {/* Badges */}
          {(primaryBadge || extraCount > 0) && (
            <View style={reviewerStyles.badgeRow}>
              {primaryBadge && (
                <BadgeChip badge={primaryBadge} isTopCard={isTopReviewer} />
              )}
              {extraCount > 0 && (
                <View
                  style={[
                    reviewerStyles.overflowChip,
                    {
                      backgroundColor: C.offWhite70,
                      borderColor: C.charcoal06,
                    },
                  ]}
                >
                  <Text
                    style={[
                      reviewerStyles.overflowText,
                      { color: C.charcoal60 },
                    ]}
                  >
                    +{extraCount}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Latest review snippet */}
          {latestReview && (
            <View
              style={[
                reviewerStyles.snippet,
                {
                  backgroundColor: C.offWhite50,
                  borderColor: C.charcoal06,
                },
              ]}
            >
              <View style={reviewerStyles.snippetHeader}>
                <Stars rating={latestReview.rating} size={10} />
                <Text
                  style={[
                    reviewerStyles.snippetLatestLabel,
                    { color: C.charcoal35 },
                  ]}
                >
                  Latest
                </Text>
              </View>
              <Text
                style={[
                  reviewerStyles.snippetText,
                  { color: C.charcoal60 },
                ]}
                numberOfLines={2}
              >
                {latestReview.reviewText}
              </Text>
            </View>
          )}

          {/* View profile CTA */}
          <View style={reviewerStyles.ctaRow}>
            <Text
              style={[
                reviewerStyles.ctaText,
                { color: 'rgba(125,155,118,0.65)' },
              ]}
            >
              View profile
            </Text>
            <Ionicons
              name="chevron-forward"
              size={12}
              color="rgba(125,155,118,0.65)"
            />
          </View>
        </View>
      </Pressable>
    );
  }

  // ── REVIEW VARIANT ────────────────────────────────────────────────────────────
  const { review } = props as { variant?: 'review'; review: RecentReviewDto };
  const reviewer = review.reviewer;
  const isOwnCard = !!user && user.id === reviewer.id;
  const href = isOwnCard ? routes.profile() : routes.reviewer(reviewer.id);

  const primaryBadge = reviewer.badge as BadgeType | undefined;
  const badgesCount = reviewer.badgesCount ?? 0;
  const extraCount = Math.max(0, badgesCount - (primaryBadge ? 1 : 0));

  return (
    <Pressable
      style={reviewStyles.card}
      onPress={() => router.push(href as any)}
      accessibilityRole="button"
    >
      {/* Top accent */}
      <LinearGradient
        colors={['rgba(114,47,55,0.50)', 'rgba(125,155,118,0.50)', 'rgba(114,47,55,0.30)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={reviewStyles.accent}
      />

      {/* Bottom fade */}
      <LinearGradient
        colors={['transparent', C.cardBg]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={reviewStyles.bottomFade}
        pointerEvents="none"
      />

      <View style={reviewStyles.body}>
        {/* Stars */}
        {review.rating != null && (
          <View style={reviewStyles.starsRow}>
            <Stars rating={review.rating} size={12} />
            <Text style={reviewStyles.ratingNum}>{Number(review.rating).toFixed(1)}</Text>
          </View>
        )}

        {/* Reviewer identity */}
        <View style={reviewStyles.identityRow}>
          <Avatar
            src={reviewer.profilePicture}
            name={reviewer.name}
            size={28}
            badge={reviewer.badge as BadgeType}
            isTopCard={false}
          />
          <View style={reviewStyles.identityText}>
            <Text style={reviewStyles.reviewerName} numberOfLines={1}>
              {reviewer.name}
            </Text>
            <Text style={reviewStyles.reviewCount}>
              {reviewer.reviewCount || 0} reviews
            </Text>
          </View>
        </View>

        {/* Badges */}
        {(primaryBadge || extraCount > 0) && (
          <View style={reviewStyles.badgeRow}>
            {primaryBadge && (
              <BadgeChip badge={primaryBadge} isTopCard={false} />
            )}
            {extraCount > 0 && (
              <View style={reviewStyles.overflowChip}>
                <Text style={reviewStyles.overflowText}>+{extraCount}</Text>
              </View>
            )}
          </View>
        )}

        {/* Content */}
        <View style={reviewStyles.contentArea}>
          <View>
            {review.businessName ? (
              <View style={reviewStyles.businessRow}>
                <Ionicons name="location-outline" size={10} color={C.charcoal28} />
                <Text style={reviewStyles.businessName} numberOfLines={1}>
                  {review.businessName}
                </Text>
              </View>
            ) : null}
            <Text style={reviewStyles.reviewText} numberOfLines={2}>
              {review.reviewText ? `"${review.reviewText}"` : ''}
            </Text>
          </View>

          {/* Footer */}
          <View style={reviewStyles.footer}>
            <Text style={reviewStyles.date}>{review.date || ''}</Text>
            <View style={reviewStyles.footerRight}>
              {(review.likes ?? 0) > 0 && (
                <View style={reviewStyles.likesRow}>
                  <Ionicons name="heart" size={12} color={C.coralFill} />
                  <Text style={reviewStyles.likesCount}>{review.likes}</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={14} color={C.charcoal20} />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Styles: reviewer variant ──────────────────────────────────────────────────
const reviewerStyles = StyleSheet.create({
  card: {
    width: 240,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  accent: {
    height: 3,
    width: '100%',
  } as object,
  body: {
    padding: 16,
    gap: 14,
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  topLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  topLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: 'rgba(251,191,36,0.80)',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    color: C.charcoal45,
    fontWeight: '500',
    flex: 1,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 26,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  overflowChip: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  overflowText: {
    fontSize: 10,
    fontWeight: '600',
  },
  snippet: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    gap: 6,
  },
  snippetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  snippetLatestLabel: {
    fontSize: 9,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  snippetText: {
    fontSize: 12,
    lineHeight: 17,
    fontWeight: '500',
    fontStyle: 'italic',
    letterSpacing: -0.05,
  },
  ctaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 2,
    marginTop: -8,
  },
  ctaText: {
    fontSize: 10,
    fontWeight: '600',
  },
});

// ─── Styles: review variant ────────────────────────────────────────────────────
const reviewStyles = StyleSheet.create({
  card: {
    width: 213,
    height: 187,
    backgroundColor: C.cardBg,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  accent: {
    height: 3,
    width: '100%',
  },
  bottomFade: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 28,
    zIndex: 10,
  },
  body: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
    gap: 6,
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingNum: {
    fontSize: 10,
    color: C.charcoal35,
    fontWeight: '700',
  },
  identityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  identityText: {
    flex: 1,
    minWidth: 0,
  },
  reviewerName: {
    fontSize: 13,
    fontWeight: '700',
    color: C.charcoal,
    letterSpacing: -0.1,
  },
  reviewCount: {
    fontSize: 10,
    color: C.charcoal38,
    fontWeight: '500',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    overflow: 'hidden',
  },
  overflowChip: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.charcoal06,
    backgroundColor: C.offWhite70,
    paddingHorizontal: 6,
    paddingVertical: 3,
  },
  overflowText: {
    fontSize: 10,
    fontWeight: '600',
    color: C.charcoal60,
  },
  contentArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  businessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginBottom: 2,
  },
  businessName: {
    fontSize: 10,
    fontWeight: '600',
    color: C.charcoal45,
    flex: 1,
  },
  reviewText: {
    fontSize: 11,
    color: C.charcoal60,
    lineHeight: 16,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: 10,
    color: C.charcoal28,
    fontWeight: '500',
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  likesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  likesCount: {
    fontSize: 10,
    fontWeight: '600',
    color: C.charcoal38,
  },
});
