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

// Metallic gradients matching web CSS (4-stop for realism)
const GOLD_COLORS = ['#f3e6bf', '#d7b56a', '#b88a2e', '#9a6f1f'] as const;
const GOLD_LOCS = [0, 0.38, 0.74, 1] as const;
const SILVER_COLORS = ['#f6f8fb', '#d6dde7', '#b8c2cf', '#98a6b7'] as const;
const SILVER_LOCS = [0, 0.40, 0.75, 1] as const;
const BRONZE_COLORS = ['#f0d1bb', '#c78c66', '#a56744', '#7a4a2c'] as const;
const BRONZE_LOCS = [0, 0.40, 0.75, 1] as const;

const MEDAL_BADGE_COLORS: Record<1 | 2 | 3, readonly [string, string]> = {
  1: ['#FBBF24', '#D97706'],
  2: ['#e2e8f0', '#94a3b8'],
  3: ['#d2a07a', '#8b5a3c'],
};

const AVATAR_SZ: Record<1 | 2 | 3, number> = { 1: 72, 2: 56, 3: 56 };
const BADGE_SZ: Record<1 | 2 | 3, number> = { 1: 30, 2: 24, 3: 24 };
const PILLAR_H: Record<1 | 2 | 3, number> = { 1: 72, 2: 48, 3: 36 };

function Avatar({ src, size }: { src?: string; size: number }) {
  const [err, setErr] = useState(false);
  const isValidUrl = Boolean(src && (src.startsWith('http://') || src.startsWith('https://')));

  if (isValidUrl && !err) {
    return (
      <Image
        source={{ uri: src }}
        style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2.5, borderColor: '#fff' }}
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
      style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#fff' }}
    >
      <Ionicons name="person" size={size * 0.45} color="rgba(45,45,45,0.60)" />
    </LinearGradient>
  );
}

function PodiumItem({ reviewer, rank }: { reviewer: TopReviewerDto; rank: 1 | 2 | 3 }) {
  const router = useRouter();
  const avSz = AVATAR_SZ[rank];
  const bSz = BADGE_SZ[rank];
  const pH = PILLAR_H[rank];
  const medalColors = MEDAL_BADGE_COLORS[rank];
  const badgeTextColor = rank === 2 ? CHARCOAL : '#fff';
  const href = routes.reviewer(reviewer.id);

  const pillarColors = rank === 1 ? GOLD_COLORS : rank === 2 ? SILVER_COLORS : BRONZE_COLORS;
  const pillarLocs = rank === 1 ? GOLD_LOCS : rank === 2 ? SILVER_LOCS : BRONZE_LOCS;

  return (
    <Pressable
      style={[s.item, rank === 1 && s.itemCenter]}
      onPressIn={() => {
        prefetchRouteIntent(`leaderboard-reviewer-podium:${reviewer.id}`, {
          href,
          router: router as unknown as { prefetch?: (path: string) => Promise<void> | void },
        });
      }}
      onPress={() => router.push(href as never)}
      accessibilityRole="button"
    >
      <View style={s.avWrap}>
        <Avatar src={reviewer.profilePicture} size={avSz} />
        <LinearGradient
          colors={medalColors}
          style={[s.badge, { width: bSz, height: bSz, borderRadius: bSz / 2 }]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          {rank === 1
            ? <Ionicons name="trophy" size={bSz * 0.48} color="#fff" />
            : <Text style={{ fontSize: bSz * 0.44, fontWeight: '800', color: badgeTextColor }}>{rank}</Text>
          }
        </LinearGradient>
      </View>

      <Text style={[s.name, rank === 1 && s.nameFirst]} numberOfLines={1}>
        @{reviewer.username ?? reviewer.name}
      </Text>
      <Text style={s.reviews} numberOfLines={1}>
        <Text style={s.reviewsBold}>{reviewer.reviewCount}</Text>
        {' reviews'}
      </Text>

      <LinearGradient
        colors={pillarColors}
        locations={pillarLocs}
        style={[s.pillar, { height: pH }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
    </Pressable>
  );
}

export function ContributorPodium({ reviewers }: { reviewers: TopReviewerDto[] }) {
  if (reviewers.length < 3) return null;

  return (
    <View style={s.row}>
      <PodiumItem reviewer={reviewers[1]} rank={2} />
      <PodiumItem reviewer={reviewers[0]} rank={1} />
      <PodiumItem reviewer={reviewers[2]} rank={3} />
    </View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingTop: 24,
    gap: 6,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    maxWidth: 108,
  },
  itemCenter: {
    maxWidth: 128,
  },
  avWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  badge: {
    position: 'absolute',
    top: -3,
    right: -3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  name: {
    fontSize: 11,
    fontWeight: '700',
    color: CHARCOAL,
    textAlign: 'center',
    paddingHorizontal: 4,
    marginBottom: 2,
  },
  nameFirst: {
    fontSize: 12,
  },
  reviews: {
    fontSize: 10,
    color: CHARCOAL_60,
    textAlign: 'center',
    marginBottom: 10,
  },
  reviewsBold: {
    fontWeight: '700',
    color: CHARCOAL,
    fontSize: 10,
  },
  pillar: {
    width: '100%',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.14,
    shadowRadius: 8,
    elevation: 3,
  },
});
