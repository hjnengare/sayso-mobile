import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import { Text } from '../../components/Typography';
import { apiFetch } from '../../lib/api';
import { routes } from '../../navigation/routes';

const MIN = 1;
const MAX = 10;

type Subcategory = { id: string; label: string };

const SUBCATEGORY_MAP: Record<string, { groupLabel: string; items: Subcategory[] }> = {
  'food-drink': {
    groupLabel: 'Food & Drink',
    items: [
      { id: 'restaurants', label: 'Restaurants' },
      { id: 'cafes', label: 'Cafés & Coffee' },
      { id: 'bars', label: 'Bars & Pubs' },
      { id: 'fast-food', label: 'Fast Food' },
      { id: 'fine-dining', label: 'Fine Dining' },
    ],
  },
  'beauty-wellness': {
    groupLabel: 'Beauty & Wellness',
    items: [
      { id: 'gyms', label: 'Gyms & Fitness' },
      { id: 'spas', label: 'Spas' },
      { id: 'salons', label: 'Hair Salons' },
      { id: 'wellness', label: 'Wellness Centers' },
      { id: 'nail-salons', label: 'Nail Salons' },
    ],
  },
  'professional-services': {
    groupLabel: 'Professional Services',
    items: [
      { id: 'education-learning', label: 'Education & Learning' },
      { id: 'transport-travel', label: 'Transport & Travel' },
      { id: 'finance-insurance', label: 'Finance & Insurance' },
      { id: 'plumbers', label: 'Plumbers' },
      { id: 'electricians', label: 'Electricians' },
      { id: 'legal-services', label: 'Legal Services' },
    ],
  },
  travel: {
    groupLabel: 'Travel',
    items: [
      { id: 'accommodation', label: 'Accommodation' },
      { id: 'transport', label: 'Transport' },
      { id: 'travel-services', label: 'Travel Services' },
    ],
  },
  'outdoors-adventure': {
    groupLabel: 'Outdoors & Adventure',
    items: [
      { id: 'hiking', label: 'Hiking' },
      { id: 'cycling', label: 'Cycling' },
      { id: 'water-sports', label: 'Water Sports' },
      { id: 'camping', label: 'Camping' },
    ],
  },
  'experiences-entertainment': {
    groupLabel: 'Entertainment & Experiences',
    items: [
      { id: 'events-festivals', label: 'Events & Festivals' },
      { id: 'sports-recreation', label: 'Sports & Recreation' },
      { id: 'nightlife', label: 'Nightlife' },
      { id: 'comedy-clubs', label: 'Comedy Clubs' },
      { id: 'cinemas', label: 'Cinemas' },
    ],
  },
  'arts-culture': {
    groupLabel: 'Arts & Culture',
    items: [
      { id: 'museums', label: 'Museums' },
      { id: 'galleries', label: 'Art Galleries' },
      { id: 'theaters', label: 'Theaters' },
      { id: 'concerts', label: 'Concerts' },
    ],
  },
  'family-pets': {
    groupLabel: 'Family & Pets',
    items: [
      { id: 'family-activities', label: 'Family Activities' },
      { id: 'pet-services', label: 'Pet Services' },
      { id: 'childcare', label: 'Childcare' },
      { id: 'veterinarians', label: 'Veterinarians' },
    ],
  },
  'shopping-lifestyle': {
    groupLabel: 'Shopping & Lifestyle',
    items: [
      { id: 'fashion', label: 'Fashion & Clothing' },
      { id: 'electronics', label: 'Electronics' },
      { id: 'home-decor', label: 'Home Decor' },
      { id: 'books', label: 'Books & Media' },
    ],
  },
};

const MAX_GROUPS = Object.keys(SUBCATEGORY_MAP).length;

type PreferenceDto = { id: string };
type PreferencesResponseDto = {
  interests?: PreferenceDto[];
  subcategories?: PreferenceDto[];
};

export default function SubcategoriesScreen() {
  const router = useRouter();
  const [interestIds, setInterestIds] = useState<string[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const counterOpacity = useRef(new Animated.Value(0)).current;
  const counterY = useRef(new Animated.Value(14)).current;
  const groupAnims = useRef(
    Array.from({ length: MAX_GROUPS }, () => ({
      opacity: new Animated.Value(0),
      y: new Animated.Value(18),
    }))
  ).current;

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const [storedInterests, storedSubcategories] = await Promise.all([
          AsyncStorage.getItem('onboarding_interests'),
          AsyncStorage.getItem('onboarding_subcategories'),
        ]);

        const parsedInterests = storedInterests ? (JSON.parse(storedInterests) as string[]) : [];
        const parsedSubcategories = storedSubcategories ? (JSON.parse(storedSubcategories) as string[]) : [];

        if (!cancelled && parsedInterests.length > 0) {
          setInterestIds(parsedInterests.filter((id) => Boolean(SUBCATEGORY_MAP[id])));
        }
        if (!cancelled && parsedSubcategories.length > 0) {
          setSelected(new Set(parsedSubcategories));
        }

        if (parsedInterests.length > 0 && parsedSubcategories.length > 0) return;

        const preferences = await apiFetch<PreferencesResponseDto>('/api/user/preferences');
        const apiInterestIds = (preferences.interests ?? [])
          .map((item) => item.id)
          .filter((id) => Boolean(SUBCATEGORY_MAP[id]));
        const apiSubcategories = (preferences.subcategories ?? [])
          .map((item) => item.id)
          .filter((id) => id.length > 0);

        if (!cancelled && parsedInterests.length === 0 && apiInterestIds.length > 0) {
          setInterestIds(apiInterestIds);
          await AsyncStorage.setItem('onboarding_interests', JSON.stringify(apiInterestIds));
        }

        if (!cancelled && parsedSubcategories.length === 0 && apiSubcategories.length > 0) {
          setSelected(new Set(apiSubcategories));
          await AsyncStorage.setItem('onboarding_subcategories', JSON.stringify(apiSubcategories));
        }
      } catch {
        // Ignore hydration errors; users can continue selecting in-session.
      }
    }

    hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);

    Animated.parallel([
      Animated.timing(counterOpacity, { toValue: 1, delay: 130, duration: 320, useNativeDriver: true }),
      Animated.timing(counterY, { toValue: 0, delay: 130, duration: 320, easing: ease, useNativeDriver: true }),
    ]).start();

    groupAnims.forEach((anim, index) => {
      const delay = 190 + index * 55;
      Animated.parallel([
        Animated.timing(anim.opacity, { toValue: 1, delay, duration: 320, useNativeDriver: true }),
        Animated.timing(anim.y, { toValue: 0, delay, duration: 320, easing: ease, useNativeDriver: true }),
      ]).start();
    });
  }, [counterOpacity, counterY, groupAnims]);

  const visibleGroups = useMemo(
    () =>
      interestIds
        .filter((id) => Boolean(SUBCATEGORY_MAP[id]))
        .map((id) => ({ interestId: id, ...SUBCATEGORY_MAP[id] })),
    [interestIds]
  );

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX) {
        next.add(id);
      }
      return next;
    });
  }, []);

  const canContinue = selected.size >= MIN;
  const atMax = selected.size >= MAX;

  const handleContinue = useCallback(async () => {
    if (!canContinue || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      const ids = Array.from(selected);
      await apiFetch('/api/onboarding/subcategories', {
        method: 'POST',
        body: JSON.stringify({ subcategories: ids }),
      });
      await AsyncStorage.setItem('onboarding_subcategories', JSON.stringify(ids));
      router.replace(routes.dealBreakers() as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save subcategories. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [canContinue, isLoading, router, selected]);

  const handleBack = () => router.push(routes.interests() as never);

  const helperText =
    selected.size === 0
      ? 'Select at least one subcategory to continue'
      : selected.size === MAX
        ? "Perfect! You've selected the maximum"
        : 'Great! Select more or continue';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingLayout
        step={2}
        totalSteps={4}
        title="Let's Get More Specific!"
        subtitle="Select specific areas within your interests"
        onBack={handleBack}
        onContinue={handleContinue}
        canContinue={canContinue}
        isLoading={isLoading}
      >
        {!!error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Animated.View style={[styles.counterWrap, { opacity: counterOpacity, transform: [{ translateY: counterY }] }]}>
          <View style={[styles.counterPill, selected.size > 0 && styles.counterPillReady]}>
            <Text style={styles.counterText}>{selected.size} of {MAX} selected</Text>
            {selected.size > 0 ? <Ionicons name="checkmark-circle" size={15} color="#7D9B76" /> : null}
          </View>
          <Text style={styles.counterHint}>{helperText}</Text>
        </Animated.View>

        {visibleGroups.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No subcategories found for selected interests.</Text>
          </View>
        ) : (
          visibleGroups.map((group, index) => {
            const anim = groupAnims[index] ?? groupAnims[0];
            return (
              <Animated.View
                key={group.interestId}
                style={[styles.group, { opacity: anim.opacity, transform: [{ translateY: anim.y }] }]}
              >
                <Text style={styles.groupLabel}>{group.groupLabel}</Text>
                <View style={styles.pillsRow}>
                  {group.items.map((item) => {
                    const isSelected = selected.has(item.id);
                    const isDisabled = atMax && !isSelected;
                    return (
                      <Pressable
                        key={item.id}
                        style={({ pressed }) => [
                          styles.pill,
                          isDisabled && styles.pillDisabled,
                          pressed && !isDisabled && styles.pillPressed,
                        ]}
                        onPress={() => toggle(item.id)}
                        disabled={isDisabled}
                      >
                        <LinearGradient
                          colors={isSelected ? ['#722F37', '#7A404A'] : ['rgba(125,155,118,0.14)', 'rgba(125,155,118,0.06)']}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 1 }}
                          style={[styles.pillFill, isSelected && styles.pillSelected]}
                        >
                          <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{item.label}</Text>
                          {isSelected ? <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" /> : null}
                        </LinearGradient>
                      </Pressable>
                    );
                  })}
                </View>
              </Animated.View>
            );
          })
        )}
      </OnboardingLayout>
    </>
  );
}

const styles = StyleSheet.create({
  errorBanner: {
    backgroundColor: 'rgba(255, 247, 237, 0.95)',
    borderColor: 'rgba(251, 146, 60, 0.35)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#C2410C',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '600',
  },

  counterWrap: { alignItems: 'center', marginBottom: 16 },
  counterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(154,176,154,0.24)',
    backgroundColor: 'rgba(154,176,154,0.10)',
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  counterPillReady: {
    borderColor: 'rgba(125,155,118,0.34)',
    backgroundColor: 'rgba(157,171,155,0.16)',
  },
  counterText: { color: '#7D9B76', fontSize: 14, fontWeight: '600' },
  counterHint: {
    marginTop: 7,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(66,66,72,0.65)',
    fontWeight: '600',
    textAlign: 'center',
  },

  group: { marginBottom: 20 },
  groupLabel: {
    fontSize: 17,
    lineHeight: 22,
    color: '#2D2D2D',
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 12,
  },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  pill: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: 'rgba(125,155,118,0.30)',
    overflow: 'hidden',
  },
  pillFill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  pillSelected: {
    borderColor: '#722F37',
  },
  pillDisabled: { opacity: 0.42 },
  pillPressed: { transform: [{ scale: 0.97 }] },
  pillText: {
    color: '#7D9B76',
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  pillTextSelected: { color: '#FFFFFF' },

  emptyState: { paddingVertical: 18 },
  emptyStateText: {
    textAlign: 'center',
    color: 'rgba(66,66,72,0.6)',
    fontSize: 14,
    fontWeight: '500',
  },
});
