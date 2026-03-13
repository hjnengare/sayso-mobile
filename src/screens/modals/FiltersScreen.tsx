import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFilters } from '../../providers/FiltersProvider';
import { Text } from '../../components/Typography';

const GRID = 8;

const C = {
  page: '#E5E0E5',
  card: '#9DAB9B',
  charcoal: '#2D2D2D',
  charcoal70: 'rgba(45,45,45,0.7)',
  charcoal50: 'rgba(45,45,45,0.5)',
  white: '#FFFFFF',
  wine: '#722F37',
  sage: '#7D9B76',
  inputBg: 'rgba(255,255,255,0.95)',
};

const RATING_OPTIONS = [5, 4, 3, 2, 1] as const;
const DISTANCE_OPTIONS = [1, 5, 10, 25] as const;

export default function FiltersScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { minRating, distanceKm, setMinRating, setDistanceKm, clearFilters } = useFilters();

  // Local draft state — only committed on "Apply"
  const [draftRating, setDraftRating] = useState<number | null>(minRating);
  const [draftDistance, setDraftDistance] = useState<number | null>(distanceKm);

  const activeCount = (draftRating != null ? 1 : 0) + (draftDistance != null ? 1 : 0);

  const handleApply = useCallback(() => {
    setMinRating(draftRating);
    setDistanceKm(draftDistance);
    router.back();
  }, [draftRating, draftDistance, setMinRating, setDistanceKm, router]);

  const handleClear = useCallback(() => {
    setDraftRating(null);
    setDraftDistance(null);
  }, []);

  const handleClose = useCallback(() => {
    router.back();
  }, [router]);

  return (
    <View style={[styles.root, { backgroundColor: C.page }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Handle bar */}
      <View style={styles.handleWrap}>
        <View style={styles.handle} />
      </View>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Filters</Text>
        <Pressable style={styles.closeBtn} onPress={handleClose} hitSlop={12}>
          <Ionicons name="close" size={20} color={C.charcoal} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + GRID * 3 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Rating Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="star" size={16} color={C.wine} />
            <Text style={styles.sectionTitle}>Minimum Rating</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Show only businesses rated at or above</Text>
          <View style={styles.pillRow}>
            {RATING_OPTIONS.map((r) => {
              const active = draftRating === r;
              return (
                <Pressable
                  key={r}
                  style={({ pressed }) => [
                    styles.pill,
                    active ? styles.pillActive : styles.pillInactive,
                    pressed ? styles.pillPressed : null,
                  ]}
                  onPress={() => setDraftRating(active ? null : r)}
                >
                  <Ionicons
                    name="star"
                    size={13}
                    color={active ? C.white : C.charcoal70}
                    style={styles.pillIcon}
                  />
                  <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextInactive]}>
                    {r}+
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={styles.divider} />

        {/* Distance Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="location" size={16} color={C.wine} />
            <Text style={styles.sectionTitle}>Distance</Text>
          </View>
          <Text style={styles.sectionSubtitle}>Show businesses within this radius of you</Text>
          <View style={styles.pillRow}>
            {DISTANCE_OPTIONS.map((d) => {
              const active = draftDistance === d;
              return (
                <Pressable
                  key={d}
                  style={({ pressed }) => [
                    styles.pill,
                    active ? styles.pillActive : styles.pillInactive,
                    pressed ? styles.pillPressed : null,
                  ]}
                  onPress={() => setDraftDistance(active ? null : d)}
                >
                  <Text style={[styles.pillText, active ? styles.pillTextActive : styles.pillTextInactive]}>
                    {d} km
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.locationNote}>
            <Ionicons name="information-circle-outline" size={13} color={C.charcoal50} />
            {' '}Location permission required
          </Text>
        </View>
      </ScrollView>

      {/* Footer actions */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + GRID * 2 }]}>
        <Pressable
          style={({ pressed }) => [
            styles.clearBtn,
            activeCount === 0 ? styles.clearBtnDisabled : null,
            pressed && activeCount > 0 ? styles.clearBtnPressed : null,
          ]}
          onPress={handleClear}
          disabled={activeCount === 0}
        >
          <Text style={[styles.clearBtnText, activeCount === 0 ? styles.clearBtnTextDisabled : null]}>
            Clear{activeCount > 0 ? ` (${activeCount})` : ''}
          </Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.applyBtn,
            pressed ? styles.applyBtnPressed : null,
          ]}
          onPress={handleApply}
        >
          <Text style={styles.applyBtnText}>
            Apply{activeCount > 0 ? ` ${activeCount} filter${activeCount > 1 ? 's' : ''}` : ' filters'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  handleWrap: {
    alignItems: 'center',
    paddingTop: GRID * 1.5,
    paddingBottom: GRID,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(45,45,45,0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: GRID * 2.5,
    paddingVertical: GRID * 1.5,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45,45,45,0.08)',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
    letterSpacing: -0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    backgroundColor: 'rgba(45,45,45,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: GRID * 2.5,
    paddingTop: GRID * 3,
    gap: GRID * 3,
  },
  section: {
    gap: GRID * 1.5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GRID,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D2D2D',
    letterSpacing: -0.2,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: 'rgba(45,45,45,0.6)',
    lineHeight: 18,
    marginTop: -GRID * 0.5,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GRID * 2,
    paddingVertical: GRID * 1.25,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  pillActive: {
    backgroundColor: '#722F37',
    borderColor: '#722F37',
  },
  pillInactive: {
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderColor: 'rgba(45,45,45,0.15)',
  },
  pillPressed: {
    opacity: 0.82,
  },
  pillIcon: {
    marginRight: 4,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#FFFFFF',
  },
  pillTextInactive: {
    color: 'rgba(45,45,45,0.8)',
  },
  locationNote: {
    fontSize: 12,
    color: 'rgba(45,45,45,0.5)',
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(45,45,45,0.08)',
  },
  footer: {
    flexDirection: 'row',
    gap: GRID * 1.5,
    paddingHorizontal: GRID * 2.5,
    paddingTop: GRID * 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(45,45,45,0.08)',
    backgroundColor: '#E5E0E5',
  },
  clearBtn: {
    flex: 1,
    minHeight: GRID * 7,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(45,45,45,0.25)',
    backgroundColor: 'rgba(255,255,255,0.7)',
  },
  clearBtnDisabled: {
    opacity: 0.4,
  },
  clearBtnPressed: {
    opacity: 0.8,
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  clearBtnTextDisabled: {
    color: 'rgba(45,45,45,0.5)',
  },
  applyBtn: {
    flex: 2,
    minHeight: GRID * 7,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#722F37',
    shadowColor: '#722F37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnPressed: {
    opacity: 0.9,
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
