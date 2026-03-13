import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import { useAuthSession } from '../../hooks/useSession';
import { getBadgeImage } from '../../lib/badgeImages';
import { getBadgeById } from '../../lib/badgeMappings';
import { SkeletonBlock } from '../../components/SkeletonBlock';
import { Text } from '../../components/Typography';

const GRID = 8;

const C = {
  bg: '#2D2D2D',
  cardDark: 'rgba(255,255,255,0.07)',
  cardDarkBorder: 'rgba(255,255,255,0.1)',
  white: '#FFFFFF',
  white70: 'rgba(255,255,255,0.7)',
  white50: 'rgba(255,255,255,0.5)',
  white20: 'rgba(255,255,255,0.2)',
  white10: 'rgba(255,255,255,0.1)',
  gold: '#FFD700',
  goldLight: '#FFA500',
  wine: '#722F37',
  sage: '#7D9B76',
  locked: 'rgba(255,255,255,0.25)',
};

const GROUP_META: Record<string, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  explorer: { label: 'Explorer', icon: 'compass-outline', color: '#60A5FA' },
  specialist: { label: 'Specialist', icon: 'ribbon-outline', color: '#34D399' },
  milestone: { label: 'Milestone', icon: 'trophy-outline', color: '#FFD700' },
  community: { label: 'Community', icon: 'people-outline', color: '#F472B6' },
};

interface BadgeDto {
  id: string;
  name: string;
  description?: string | null;
  icon_path?: string | null;
  badge_group?: string | null;
  earned?: boolean;
  awarded_at?: string | null;
}

interface BadgesApiResponse {
  ok?: boolean;
  badges?: BadgeDto[];
}

// SVG-free circular progress ring using an Animated arc approximation via rotation
function ProgressRing({ percentage }: { percentage: number }) {
  const animPct = useRef(new Animated.Value(0)).current;
  const [displayPct, setDisplayPct] = useState(0);

  useEffect(() => {
    Animated.timing(animPct, {
      toValue: percentage,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    const id = animPct.addListener(({ value }) => setDisplayPct(Math.round(value)));
    return () => animPct.removeListener(id);
  }, [percentage, animPct]);

  const SIZE = 160;
  const STROKE = 10;
  const INNER = SIZE - STROKE * 2;

  // We draw a ring using border + a rotated clip-style approach via Views
  // Track circle + filled arc via two half-circle masks
  const fillRotation = animPct.interpolate({
    inputRange: [0, 100],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.ringContainer, { width: SIZE, height: SIZE }]}>
      {/* Track */}
      <View
        style={[
          styles.ringTrack,
          {
            width: SIZE,
            height: SIZE,
            borderRadius: SIZE / 2,
            borderWidth: STROKE,
          },
        ]}
      />
      {/* Progress fill — clipped to right half, rotated */}
      <View
        style={[styles.ringClipLeft, { width: SIZE / 2, height: SIZE }]}
      >
        <Animated.View
          style={[
            styles.ringHalf,
            {
              width: SIZE,
              height: SIZE,
              borderRadius: SIZE / 2,
              borderWidth: STROKE,
              transform: [{ rotate: fillRotation }],
            },
          ]}
        />
      </View>
      {/* Centre text */}
      <View style={[styles.ringCenter, { width: INNER, height: INNER, borderRadius: INNER / 2 }]}>
        <Text style={styles.ringPct}>{displayPct}%</Text>
        <Text style={styles.ringLabel}>complete</Text>
      </View>
    </View>
  );
}

function BadgeRow({ badge, earned }: { badge: BadgeDto; earned: boolean }) {
  const mapping = getBadgeById(badge.id);
  return (
    <View style={[styles.badgeRow, !earned ? styles.badgeRowLocked : null]}>
      <View style={[styles.badgeIconCircle, !earned ? styles.badgeIconCircleLocked : styles.badgeIconCircleEarned]}>
        {earned && mapping ? (
          <Image source={getBadgeImage(mapping.imageKey)} style={styles.badgeRowImg} />
        ) : (
          <Ionicons name="lock-closed-outline" size={18} color={C.white50} />
        )}
      </View>
      <View style={styles.badgeRowInfo}>
        <Text style={[styles.badgeRowName, !earned ? styles.badgeRowNameLocked : null]}>
          {badge.name}
        </Text>
        {badge.description ? (
          <Text style={styles.badgeRowDesc} numberOfLines={2}>{badge.description}</Text>
        ) : null}
        {earned && badge.awarded_at ? (
          <Text style={styles.badgeRowDate}>
            Earned {new Date(badge.awarded_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
          </Text>
        ) : null}
      </View>
      {earned && (
        <Ionicons name="checkmark-circle" size={18} color={C.gold} style={styles.badgeCheckmark} />
      )}
    </View>
  );
}

function GroupSection({ groupKey, badges }: { groupKey: string; badges: BadgeDto[] }) {
  const meta = GROUP_META[groupKey];
  const [expanded, setExpanded] = useState(true);
  const earned = badges.filter((b) => b.earned);
  const total = badges.length;

  if (!meta) return null;

  return (
    <View style={styles.groupSection}>
      <Pressable
        style={styles.groupHeader}
        onPress={() => setExpanded((v) => !v)}
      >
        <View style={[styles.groupIconWrap, { backgroundColor: `${meta.color}20` }]}>
          <Ionicons name={meta.icon} size={18} color={meta.color} />
        </View>
        <View style={styles.groupHeaderText}>
          <Text style={styles.groupTitle}>{meta.label}</Text>
          <Text style={styles.groupProgress}>{earned.length}/{total} earned</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={C.white50}
        />
      </Pressable>

      {expanded && (
        <View style={styles.groupBadges}>
          {badges.map((badge) => (
            <BadgeRow key={badge.id} badge={badge} earned={Boolean(badge.earned)} />
          ))}
        </View>
      )}
    </View>
  );
}

export default function AchievementsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthSession();

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(GRID * 2)).current;

  const { data, isLoading } = useQuery({
    queryKey: ['user-badges-all', user?.id],
    queryFn: async () => {
      if (!user?.id) return { badges: [] as BadgeDto[] };
      return apiFetch<BadgesApiResponse>(`/api/badges/user?user_id=${user.id}`);
    },
    enabled: Boolean(user?.id),
    staleTime: 60_000,
  });

  const allBadges = data?.badges ?? [];
  const earnedCount = allBadges.filter((b) => b.earned).length;
  const totalCount = allBadges.length;
  const percentage = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  const groupedBadges = allBadges.reduce<Record<string, BadgeDto[]>>((acc, badge) => {
    const group = badge.badge_group ?? 'explorer';
    if (!acc[group]) acc[group] = [];
    acc[group].push(badge);
    return acc;
  }, {});

  useEffect(() => {
    if (isLoading) return;
    const ease = Easing.out(Easing.cubic);
    Animated.parallel([
      Animated.timing(headerOpacity, { toValue: 1, duration: 260, easing: ease, useNativeDriver: true }),
      Animated.timing(headerY, { toValue: 0, duration: 260, easing: ease, useNativeDriver: true }),
    ]).start();
  }, [isLoading, headerOpacity, headerY]);

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Back button */}
      <View style={[styles.backBtnWrap, { top: insets.top + GRID * 1.5 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={C.white} />
        </Pressable>
      </View>

      {isLoading ? (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + GRID * 9, paddingBottom: insets.bottom + GRID * 4 },
          ]}
        >
          <View style={styles.ringPlaceholder}>
            <SkeletonBlock style={styles.skeletonRing} />
          </View>
          {[0, 1, 2, 3].map((i) => (
            <SkeletonBlock key={i} style={styles.skeletonGroup} />
          ))}
        </ScrollView>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + GRID * 8, paddingBottom: insets.bottom + GRID * 4 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <Animated.View
            style={[
              styles.pageHeader,
              { opacity: headerOpacity, transform: [{ translateY: headerY }] },
            ]}
          >
            <Text style={styles.pageTitle}>Achievements</Text>
            <Text style={styles.pageSubtitle}>
              {earnedCount} of {totalCount} badges earned
            </Text>
          </Animated.View>

          {/* Progress ring */}
          <Animated.View
            style={[
              styles.ringSection,
              { opacity: headerOpacity, transform: [{ translateY: headerY }] },
            ]}
          >
            <ProgressRing percentage={percentage} />

            {/* Quick stats */}
            <View style={styles.quickStats}>
              {Object.entries(GROUP_META).map(([key, meta]) => {
                const groupBadges = groupedBadges[key] ?? [];
                const groupEarned = groupBadges.filter((b) => b.earned).length;
                return (
                  <View key={key} style={styles.quickStat}>
                    <Ionicons name={meta.icon} size={16} color={meta.color} />
                    <Text style={styles.quickStatValue}>{groupEarned}</Text>
                    <Text style={styles.quickStatLabel}>{meta.label}</Text>
                  </View>
                );
              })}
            </View>
          </Animated.View>

          {/* Badge groups */}
          {!user ? (
            <View style={styles.unauthState}>
              <Ionicons name="lock-closed-outline" size={40} color={C.white50} />
              <Text style={styles.unauthTitle}>Sign in to track your achievements</Text>
              <Pressable
                style={styles.signInBtn}
                onPress={() => router.push('/login' as never)}
              >
                <Text style={styles.signInBtnText}>Sign in</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.groups}>
              {Object.keys(GROUP_META).map((key) => (
                <GroupSection
                  key={key}
                  groupKey={key}
                  badges={groupedBadges[key] ?? []}
                />
              ))}
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: GRID * 2,
    gap: GRID * 2,
  },
  backBtnWrap: {
    position: 'absolute',
    left: GRID * 2,
    zIndex: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  pageHeader: {
    alignItems: 'center',
    gap: GRID * 0.5,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: C.white,
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: C.white50,
  },

  ringSection: {
    alignItems: 'center',
    gap: GRID * 2.5,
  },

  // Progress ring
  ringContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  ringTrack: {
    position: 'absolute',
    borderColor: C.white10,
  },
  ringClipLeft: {
    position: 'absolute',
    left: 0,
    top: 0,
    overflow: 'hidden',
  },
  ringHalf: {
    position: 'absolute',
    left: 0,
    top: 0,
    borderColor: C.gold,
    borderLeftColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  ringCenter: {
    position: 'absolute',
    backgroundColor: C.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringPct: {
    fontSize: 32,
    fontWeight: '800',
    color: C.white,
    lineHeight: 38,
  },
  ringLabel: {
    fontSize: 12,
    color: C.white50,
  },

  quickStats: {
    flexDirection: 'row',
    gap: GRID * 2,
  },
  quickStat: {
    alignItems: 'center',
    gap: 4,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: '700',
    color: C.white,
    lineHeight: 24,
  },
  quickStatLabel: {
    fontSize: 11,
    color: C.white50,
  },

  groups: {
    gap: GRID * 1.5,
  },

  groupSection: {
    backgroundColor: C.cardDark,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.cardDarkBorder,
    overflow: 'hidden',
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: GRID * 2,
    gap: GRID * 1.5,
  },
  groupIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  groupHeaderText: {
    flex: 1,
    gap: 2,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.white,
  },
  groupProgress: {
    fontSize: 12,
    color: C.white50,
  },

  groupBadges: {
    borderTopWidth: 1,
    borderTopColor: C.cardDarkBorder,
  },

  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: GRID * 2,
    gap: GRID * 1.5,
    borderBottomWidth: 1,
    borderBottomColor: C.cardDarkBorder,
  },
  badgeRowLocked: {
    opacity: 0.5,
  },
  badgeIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  badgeIconCircleEarned: {
    backgroundColor: 'rgba(255,215,0,0.15)',
  },
  badgeIconCircleLocked: {
    backgroundColor: C.white10,
  },
  badgeRowImg: {
    width: 24,
    height: 24,
  },
  badgeRowInfo: {
    flex: 1,
    gap: 2,
  },
  badgeRowName: {
    fontSize: 14,
    fontWeight: '600',
    color: C.white,
  },
  badgeRowNameLocked: {
    color: C.white70,
  },
  badgeRowDesc: {
    fontSize: 12,
    color: C.white50,
    lineHeight: 16,
  },
  badgeRowDate: {
    fontSize: 11,
    color: C.gold,
  },
  badgeCheckmark: {
    flexShrink: 0,
  },

  unauthState: {
    alignItems: 'center',
    gap: GRID * 2,
    paddingVertical: GRID * 4,
  },
  unauthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: C.white70,
    textAlign: 'center',
  },
  signInBtn: {
    paddingHorizontal: GRID * 3,
    paddingVertical: GRID * 1.5,
    borderRadius: 999,
    backgroundColor: C.wine,
  },
  signInBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.white,
  },

  ringPlaceholder: {
    alignItems: 'center',
    paddingVertical: GRID * 2,
  },
  skeletonRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  skeletonGroup: {
    height: 64,
    borderRadius: 12,
  },
});
