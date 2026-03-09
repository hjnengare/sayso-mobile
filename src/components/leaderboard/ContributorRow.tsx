import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { TopReviewerDto } from '@sayso/contracts';
import { Text } from '../Typography';
import { routes } from '../../navigation/routes';
import { prefetchRouteIntent } from '../../lib/perf/prefetchRouteIntent';

const CHARCOAL = '#2D2D2D';
const CHARCOAL_60 = 'rgba(45,45,45,0.60)';
const CORAL = '#722F37';
const OFF_WHITE = '#E5E0E5';

// Rank badge colors — aligned with web's LeaderboardUser.tsx
function getBadgeStyle(rank: number): { colors: readonly [string, string]; textColor: string } {
  if (rank === 1) return { colors: ['#FBBF24', '#D97706'], textColor: '#fff' };           // gold
  if (rank === 2) return { colors: ['#722F37', 'rgba(114,47,55,0.80)'], textColor: '#fff' }; // coral
  if (rank === 3) return { colors: ['rgba(45,45,45,0.70)', 'rgba(45,45,45,0.50)'], textColor: '#fff' }; // charcoal
  return { colors: ['rgba(45,45,45,0.15)', 'rgba(45,45,45,0.10)'], textColor: 'rgba(45,45,45,0.70)' }; // neutral
}

function Avatar({ src }: { src?: string }) {
  const [err, setErr] = useState(false);

  if (src && !err) {
    return (
      <Image
        source={{ uri: src }}
        style={s.avatar}
        contentFit="cover"
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <LinearGradient
      colors={['rgba(157,171,155,0.10)', 'rgba(114,47,55,0.10)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[s.avatar, s.avatarFallback]}
    >
      <Ionicons name="person" size={20} color="rgba(45,45,45,0.60)" />
    </LinearGradient>
  );
}

type Props = { reviewer: TopReviewerDto; rank: number };

export function ContributorRow({ reviewer, rank }: Props) {
  const router = useRouter();
  const badge = getBadgeStyle(rank);
  const rating = reviewer.avgRatingGiven;
  const href = routes.reviewer(reviewer.id);

  return (
    <Pressable
      style={s.card}
      onPressIn={() => {
        prefetchRouteIntent(`leaderboard-reviewer:${reviewer.id}`, {
          href,
          router: router as unknown as { prefetch?: (path: string) => Promise<void> | void },
        });
      }}
      onPress={() => router.push(href as never)}
      accessibilityRole="button"
    >
      <View style={s.left}>
        <LinearGradient
          colors={badge.colors}
          style={s.badge}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {rank <= 3
            ? <Ionicons name="trophy" size={13} color={badge.textColor} />
            : <Text style={[s.badgeNum, { color: badge.textColor }]}>{rank}</Text>
          }
        </LinearGradient>

        <Avatar src={reviewer.profilePicture} />

        <View style={s.identity}>
          <Text style={s.name} numberOfLines={1}>@{reviewer.username ?? reviewer.name}</Text>
          <Text style={s.sub}>{reviewer.reviewCount} reviews</Text>
        </View>
      </View>

      <View style={s.right}>
        {rating != null && (
          <View style={s.ratingPill}>
            <Ionicons name="star" size={11} color={CORAL} />
            <Text style={s.ratingText}>{rating.toFixed(1)}</Text>
          </View>
        )}
        <Text style={s.reviewCount}>
          {reviewer.reviewCount > 0 ? `${reviewer.reviewCount} reviews` : 'No reviews yet'}
        </Text>
      </View>
    </Pressable>
  );
}

const s = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.16)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.22)',
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
    flexShrink: 0,
  },
  badgeNum: {
    fontSize: 11,
    fontWeight: '700',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.50)',
    flexShrink: 0,
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: CHARCOAL,
    marginBottom: 1,
  },
  sub: {
    fontSize: 11,
    color: CHARCOAL_60,
  },
  right: {
    alignItems: 'flex-end',
    gap: 3,
    flexShrink: 0,
    marginLeft: 8,
  },
  ratingPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: OFF_WHITE,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: CHARCOAL,
  },
  reviewCount: {
    fontSize: 11,
    color: CHARCOAL_60,
    textAlign: 'right',
  },
});
