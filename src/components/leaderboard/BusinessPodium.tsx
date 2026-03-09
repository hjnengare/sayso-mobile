import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import type { FeaturedBusinessDto } from '@sayso/contracts';
import { Text } from '../Typography';
import { routes } from '../../navigation/routes';
import { fetchBusinessDetail, getBusinessDetailQueryKey } from '../../hooks/useBusinessDetail';
import { prefetchRouteIntent } from '../../lib/perf/prefetchRouteIntent';

const CHARCOAL = '#2D2D2D';
const CHARCOAL_60 = 'rgba(45,45,45,0.60)';
const CORAL = '#722F37';

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

const IMG_SZ: Record<1 | 2 | 3, number> = { 1: 72, 2: 58, 3: 58 };
const BADGE_SZ: Record<1 | 2 | 3, number> = { 1: 30, 2: 24, 3: 24 };
const PILLAR_H: Record<1 | 2 | 3, number> = { 1: 72, 2: 48, 3: 36 };

function isPlaceholderImage(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return url.includes('/businessImagePlaceholders/') || url.includes('/png/') || url.endsWith('.png');
}

function getImage(b: FeaturedBusinessDto): string | null {
  const imgs = (b as any).uploaded_images;
  if (Array.isArray(imgs) && imgs.length > 0) {
    const first = imgs[0];
    if (first && typeof first === 'string' && first.trim() !== '' && !isPlaceholderImage(first)) return first;
  }
  const url = (b as any).image_url;
  if (url && typeof url === 'string' && url.trim() !== '' && !isPlaceholderImage(url)) return url;
  if (b.image && typeof b.image === 'string' && b.image.trim() !== '' && !isPlaceholderImage(b.image)) return String(b.image);
  return null;
}

function BusinessImage({ business, size }: { business: FeaturedBusinessDto; size: number }) {
  const [err, setErr] = useState(false);
  const src = getImage(business);

  if (src && !err) {
    return (
      <Image
        source={{ uri: src }}
        style={{ width: size, height: size, borderRadius: 10, borderWidth: 2.5, borderColor: '#fff' }}
        contentFit="cover"
        onError={() => setErr(true)}
      />
    );
  }
  return (
    <View style={{ width: size, height: size, borderRadius: 10, backgroundColor: '#E5E0E5', alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: '#fff' }}>
      <Ionicons name="image-outline" size={size * 0.33} color="rgba(45,45,45,0.20)" />
    </View>
  );
}

function PodiumItem({ business, rank }: { business: FeaturedBusinessDto; rank: 1 | 2 | 3 }) {
  const router = useRouter();
  const imgSz = IMG_SZ[rank];
  const bSz = BADGE_SZ[rank];
  const pH = PILLAR_H[rank];
  const medalColors = MEDAL_BADGE_COLORS[rank];
  const badgeTextColor = rank === 2 ? CHARCOAL : '#fff';
  const pillarColors = rank === 1 ? GOLD_COLORS : rank === 2 ? SILVER_COLORS : BRONZE_COLORS;
  const pillarLocs = rank === 1 ? GOLD_LOCS : rank === 2 ? SILVER_LOCS : BRONZE_LOCS;
  const rating = business.totalRating ?? business.rating ?? 0;
  const reviewCount = business.reviewCount ?? (business as any).reviews ?? 0;
  const href = routes.businessDetail(business.id);

  return (
    <Pressable
      style={[s.item, rank === 1 && s.itemCenter]}
      accessible
      accessibilityRole="button"
      onPressIn={() => {
        prefetchRouteIntent(`leaderboard-business-podium:${business.id}`, {
          href,
          router: router as unknown as { prefetch?: (path: string) => Promise<void> | void },
          queryKeys: [
            {
              queryKey: getBusinessDetailQueryKey(business.id),
              queryFn: () => fetchBusinessDetail(business.id),
              staleTime: 120_000,
            },
          ],
        });
      }}
      onPress={() => router.push(href as never)}
    >
      <View style={s.imgWrap}>
        <BusinessImage business={business} size={imgSz} />
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

      <Text style={[s.name, rank === 1 && s.nameFirst]} numberOfLines={2}>{business.name}</Text>

      <View style={s.ratingRow}>
        <Ionicons name="star" size={10} color={CORAL} />
        <Text style={s.ratingText}>{rating > 0 ? rating.toFixed(1) : '–'}</Text>
        <Text style={s.reviewCount}>({reviewCount})</Text>
      </View>

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

export function BusinessPodium({ businesses }: { businesses: FeaturedBusinessDto[] }) {
  if (businesses.length === 0) return null;

  const top: [FeaturedBusinessDto, FeaturedBusinessDto | null, FeaturedBusinessDto | null] = [
    businesses[0],
    businesses[1] ?? null,
    businesses[2] ?? null,
  ];

  return (
    <View style={s.row}>
      {top[1] && <PodiumItem business={top[1]} rank={2} />}
      <PodiumItem business={top[0]} rank={1} />
      {top[2] && <PodiumItem business={top[2]} rank={3} />}
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
  imgWrap: {
    position: 'relative',
    marginBottom: 8,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
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
    marginBottom: 4,
    lineHeight: 15,
  },
  nameFirst: {
    fontSize: 12,
    lineHeight: 16,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 10,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: '700',
    color: CHARCOAL,
  },
  reviewCount: {
    fontSize: 10,
    color: CHARCOAL_60,
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
