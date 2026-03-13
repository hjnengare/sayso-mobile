import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { BADGE_MAPPINGS, BADGE_GROUPS, type BadgeMappingItem } from '../../lib/badgeMappings';
import { getBadgeImage } from '../../lib/badgeImages';
import { Text } from '../../components/Typography';

const GRID = 8;

const C = {
  page: '#E5E0E5',
  card: '#9DAB9B',
  charcoal: '#2D2D2D',
  charcoal70: 'rgba(45,45,45,0.7)',
  charcoal60: 'rgba(45,45,45,0.6)',
  charcoal50: 'rgba(45,45,45,0.5)',
  charcoal20: 'rgba(45,45,45,0.2)',
  charcoal08: 'rgba(45,45,45,0.08)',
  white: '#FFFFFF',
  wine: '#722F37',
  sage: '#7D9B76',
  inputBg: 'rgba(255,255,255,0.95)',
  inputBorder: 'rgba(45,45,45,0.15)',
};

const GROUP_LABELS: Record<string, string> = {
  explorer: 'Explorer',
  specialist: 'Specialist',
  milestone: 'Milestone',
  community: 'Community',
};

const GROUP_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  explorer: 'compass-outline',
  specialist: 'ribbon-outline',
  milestone: 'trophy-outline',
  community: 'people-outline',
};

const GROUP_COLORS: Record<string, string> = {
  explorer: '#60A5FA',
  specialist: '#34D399',
  milestone: '#FFD700',
  community: '#F472B6',
};

function BadgeCard({ badge }: { badge: BadgeMappingItem }) {
  const groupColor = GROUP_COLORS[badge.badgeGroup] ?? C.wine;

  return (
    <View style={styles.badgeCard}>
      <Image source={getBadgeImage(badge.imageKey)} style={styles.badgeCardImg} />
      <View style={styles.badgeCardContent}>
        <Text style={styles.badgeCardName}>{badge.name}</Text>
        <Text style={styles.badgeCardDesc} numberOfLines={2}>{badge.description}</Text>
        <View style={styles.badgeCardHowTo}>
          <Ionicons name="information-circle-outline" size={12} color={C.charcoal50} />
          <Text style={styles.badgeCardHowToText} numberOfLines={2}>{badge.howToEarn}</Text>
        </View>
      </View>
    </View>
  );
}

function BadgeSection({ groupKey, badges }: { groupKey: string; badges: BadgeMappingItem[] }) {
  const label = GROUP_LABELS[groupKey] ?? groupKey;
  const icon = GROUP_ICONS[groupKey] ?? 'ribbon-outline';
  const color = GROUP_COLORS[groupKey] ?? C.wine;

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={[styles.sectionIconWrap, { backgroundColor: `${color}18` }]}>
          <Ionicons name={icon} size={18} color={color} />
        </View>
        <Text style={styles.sectionTitle}>{label} Badges</Text>
        <View style={styles.sectionCount}>
          <Text style={styles.sectionCountText}>{badges.length}</Text>
        </View>
      </View>
      <View style={styles.badgeList}>
        {badges.map((badge) => (
          <BadgeCard key={badge.id} badge={badge} />
        ))}
      </View>
    </View>
  );
}

export default function BadgesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');

  const badgesByGroup = useMemo(() => {
    const groups: Record<string, BadgeMappingItem[]> = {
      explorer: [],
      specialist: [],
      milestone: [],
      community: [],
    };
    Object.values(BADGE_MAPPINGS).forEach((badge) => {
      if (groups[badge.badgeGroup]) {
        groups[badge.badgeGroup].push(badge);
      }
    });
    return groups;
  }, []);

  const filteredBadges = useMemo<BadgeMappingItem[] | null>(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return null;
    return Object.values(BADGE_MAPPINGS).filter(
      (badge) =>
        badge.name.toLowerCase().includes(q) ||
        badge.description.toLowerCase().includes(q) ||
        badge.howToEarn.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <View style={[styles.root, { backgroundColor: C.page }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Back button */}
      <View style={[styles.backBtnWrap, { top: insets.top + GRID * 1.5 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={C.charcoal} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + GRID * 8, paddingBottom: insets.bottom + GRID * 4 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Page header */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Badge Library</Text>
          <Text style={styles.pageSubtitle}>
            Earn badges by exploring, reviewing, and contributing to the community.
          </Text>
        </View>

        {/* Search bar */}
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={18} color={C.charcoal50} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search badges…"
            placeholderTextColor={C.charcoal50}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8} style={styles.searchClear}>
              <Ionicons name="close-circle" size={18} color={C.charcoal50} />
            </Pressable>
          )}
        </View>

        {/* Search results */}
        {filteredBadges !== null ? (
          <View style={styles.section}>
            <Text style={styles.searchResultsLabel}>
              {filteredBadges.length} result{filteredBadges.length !== 1 ? 's' : ''} for "{searchQuery}"
            </Text>
            {filteredBadges.length === 0 ? (
              <View style={styles.emptySearch}>
                <Ionicons name="search-outline" size={32} color={C.charcoal50} />
                <Text style={styles.emptySearchText}>No badges match your search.</Text>
              </View>
            ) : (
              <View style={styles.badgeList}>
                {filteredBadges.map((badge) => (
                  <BadgeCard key={badge.id} badge={badge} />
                ))}
              </View>
            )}
          </View>
        ) : (
          BADGE_GROUPS.map((group) => (
            <BadgeSection
              key={group}
              groupKey={group}
              badges={badgesByGroup[group] ?? []}
            />
          ))
        )}

        {/* CTA */}
        {!filteredBadges && (
          <View style={styles.cta}>
            <Text style={styles.ctaTitle}>Start earning today</Text>
            <Text style={styles.ctaSubtitle}>
              Discover local businesses and leave honest reviews to unlock your first badge.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.ctaBtn, pressed ? styles.ctaBtnPressed : null]}
              onPress={() => router.push('/home' as never)}
            >
              <Text style={styles.ctaBtnText}>Explore businesses</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: GRID * 2,
    gap: GRID * 3,
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
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.charcoal08,
  },

  pageHeader: {
    alignItems: 'center',
    gap: GRID,
    paddingHorizontal: GRID,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: C.charcoal,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  pageSubtitle: {
    fontSize: 15,
    color: C.charcoal60,
    textAlign: 'center',
    lineHeight: 22,
  },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.inputBg,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: C.inputBorder,
    paddingHorizontal: GRID * 2,
    minHeight: GRID * 6,
  },
  searchIcon: {
    marginRight: GRID,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: C.charcoal,
    paddingVertical: GRID * 1.5,
  },
  searchClear: {
    marginLeft: GRID,
  },
  searchResultsLabel: {
    fontSize: 13,
    color: C.charcoal50,
    marginBottom: GRID,
  },

  section: {
    gap: GRID * 1.5,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GRID,
  },
  sectionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: C.charcoal,
    letterSpacing: -0.2,
  },
  sectionCount: {
    paddingHorizontal: GRID,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: C.charcoal08,
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: C.charcoal60,
  },

  badgeList: {
    gap: GRID,
  },
  badgeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: GRID * 1.5,
    backgroundColor: 'rgba(255,255,255,0.72)',
    borderRadius: 12,
    padding: GRID * 2,
    borderWidth: 1,
    borderColor: C.charcoal08,
  },
  badgeCardImg: {
    width: 44,
    height: 44,
    flexShrink: 0,
  },
  badgeCardContent: {
    flex: 1,
    gap: 4,
  },
  badgeCardName: {
    fontSize: 14,
    fontWeight: '700',
    color: C.charcoal,
  },
  badgeCardDesc: {
    fontSize: 13,
    color: C.charcoal70,
    lineHeight: 18,
  },
  badgeCardHowTo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 2,
  },
  badgeCardHowToText: {
    flex: 1,
    fontSize: 12,
    color: C.charcoal50,
    lineHeight: 16,
  },

  emptySearch: {
    alignItems: 'center',
    paddingVertical: GRID * 4,
    gap: GRID * 1.5,
  },
  emptySearchText: {
    fontSize: 15,
    color: C.charcoal50,
  },

  cta: {
    backgroundColor: C.card,
    borderRadius: 12,
    padding: GRID * 3,
    alignItems: 'center',
    gap: GRID * 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
  ctaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.charcoal,
    textAlign: 'center',
  },
  ctaSubtitle: {
    fontSize: 14,
    color: C.charcoal70,
    textAlign: 'center',
    lineHeight: 20,
  },
  ctaBtn: {
    paddingHorizontal: GRID * 3,
    paddingVertical: GRID * 1.5,
    borderRadius: 999,
    backgroundColor: C.wine,
    marginTop: GRID * 0.5,
  },
  ctaBtnPressed: {
    opacity: 0.88,
  },
  ctaBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.white,
  },
});
