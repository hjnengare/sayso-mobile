import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import { Text } from '../../components/Typography';
import { apiFetch } from '../../lib/api';
import { routes } from '../../navigation/routes';

const MIN = 3;
const MAX = 6;

const INTERESTS = [
  { id: 'food-drink', label: 'Food & Drink' },
  { id: 'beauty-wellness', label: 'Beauty & Wellness' },
  { id: 'professional-services', label: 'Professional Services' },
  { id: 'travel', label: 'Travel' },
  { id: 'outdoors-adventure', label: 'Outdoors & Adventure' },
  { id: 'experiences-entertainment', label: 'Entertainment & Experiences' },
  { id: 'arts-culture', label: 'Arts & Culture' },
  { id: 'family-pets', label: 'Family & Pets' },
  { id: 'shopping-lifestyle', label: 'Shopping & Lifestyle' },
] as const;

type InterestId = typeof INTERESTS[number]['id'];
type InterestPreferenceDto = { id: string };
type PreferencesResponseDto = { interests?: InterestPreferenceDto[] };

type ItemAnim = {
  opacity: Animated.Value;
  y: Animated.Value;
  scale: Animated.Value;
};

export default function InterestsScreen() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<InterestId>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const badgeY = useRef(new Animated.Value(12)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;
  const itemAnims = useRef<ItemAnim[]>(
    INTERESTS.map(() => ({
      opacity: new Animated.Value(0),
      y: new Animated.Value(16),
      scale: new Animated.Value(0.94),
    }))
  ).current;

  useEffect(() => {
    let cancelled = false;

    async function hydrateSelections() {
      try {
        const stored = await AsyncStorage.getItem('onboarding_interests');
        if (stored) {
          const ids = JSON.parse(stored) as string[];
          const valid = ids.filter((id): id is InterestId => INTERESTS.some((item) => item.id === id));
          if (!cancelled && valid.length > 0) {
            setSelected(new Set(valid));
            return;
          }
        }

        const preferences = await apiFetch<PreferencesResponseDto>('/api/user/preferences');
        const ids = (preferences.interests ?? [])
          .map((item) => item.id)
          .filter((id): id is InterestId => INTERESTS.some((interest) => interest.id === id));

        if (!cancelled && ids.length > 0) {
          setSelected(new Set(ids));
          await AsyncStorage.setItem('onboarding_interests', JSON.stringify(ids));
        }
      } catch {
        // Ignore hydration errors; screen remains usable with empty selections.
      }
    }

    hydrateSelections();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);

    Animated.parallel([
      Animated.timing(badgeOpacity, { toValue: 1, delay: 120, duration: 300, useNativeDriver: true }),
      Animated.timing(badgeY, { toValue: 0, delay: 120, duration: 300, easing: ease, useNativeDriver: true }),
    ]).start();

    INTERESTS.forEach((_, i) => {
      const delay = 170 + i * 34;
      const anim = itemAnims[i];
      Animated.parallel([
        Animated.timing(anim.opacity, { toValue: 1, delay, duration: 280, useNativeDriver: true }),
        Animated.timing(anim.y, { toValue: 0, delay, duration: 280, easing: ease, useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(delay),
          Animated.spring(anim.scale, { toValue: 1, damping: 13, stiffness: 220, useNativeDriver: true }),
        ]),
      ]).start();
    });
  }, [badgeOpacity, badgeY, itemAnims]);

  const triggerShake = useCallback(() => {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 6, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -6, duration: 55, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 4, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -4, duration: 45, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 35, useNativeDriver: true }),
    ]).start();
  }, [shakeAnim]);

  const toggle = useCallback((id: InterestId) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX) {
        next.add(id);
      } else {
        triggerShake();
      }
      return next;
    });
  }, [triggerShake]);

  const canContinue = selected.size >= MIN && selected.size <= MAX;
  const atMax = selected.size >= MAX;

  const handleContinue = useCallback(async () => {
    if (!canContinue || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      const ids = Array.from(selected);
      await apiFetch('/api/onboarding/interests', {
        method: 'POST',
        body: JSON.stringify({ interests: ids }),
      });
      await AsyncStorage.setItem('onboarding_interests', JSON.stringify(ids));
      router.replace(routes.subcategories() as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save interests. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [canContinue, isLoading, router, selected]);

  const handleBack = () => router.replace(routes.register() as never);

  const helperText =
    selected.size < MIN
      ? `Select ${MIN - selected.size} or more to continue`
      : selected.size === MAX
        ? "Perfect! You've selected the maximum"
        : 'Great! You can continue or select more';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingLayout
        step={1}
        totalSteps={4}
        title="What interests you?"
        subtitle="Pick a few things you love and let's personalise your experience!"
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

        <Animated.View style={[styles.selectionWrap, { opacity: badgeOpacity, transform: [{ translateY: badgeY }] }]}>
          <View style={[styles.selectionPill, selected.size >= MIN && styles.selectionPillReady]}>
            <Text style={styles.selectionPillText}>
              {selected.size} of {MIN}-{MAX} selected
            </Text>
            {selected.size >= MIN ? (
              <Ionicons name="checkmark-circle" size={15} color="#7D9B76" />
            ) : null}
          </View>
          <Text style={styles.selectionHint}>{helperText}</Text>
        </Animated.View>

        <Animated.View style={[styles.grid, { transform: [{ translateX: shakeAnim }] }]}>
          {INTERESTS.map((item, index) => {
            const isSelected = selected.has(item.id);
            const isDisabled = atMax && !isSelected;
            const anim = itemAnims[index];
            return (
              <Animated.View
                key={item.id}
                style={{
                  width: '48.2%',
                  opacity: anim.opacity,
                  transform: [{ translateY: anim.y }, { scale: anim.scale }],
                }}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.circle,
                    isDisabled && styles.circleDisabled,
                    pressed && !isDisabled && styles.circlePressed,
                  ]}
                  onPress={() => toggle(item.id)}
                  disabled={isDisabled}
                >
                  <LinearGradient
                    colors={isSelected ? ['#722F37', '#7A404A'] : ['#7D9B76', '#6B8A64']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.circleFill, isSelected && styles.circleFillSelected]}
                  >
                    <Text style={[styles.circleLabel, isSelected && styles.circleLabelSelected]}>
                      {item.label}
                    </Text>
                    {isSelected ? (
                      <View style={styles.checkBadge}>
                        <Ionicons name="checkmark-circle" size={16} color="#7D9B76" />
                      </View>
                    ) : null}
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            );
          })}
        </Animated.View>
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

  selectionWrap: { alignItems: 'center', marginBottom: 18 },
  selectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(154,176,154,0.22)',
    backgroundColor: 'rgba(154,176,154,0.10)',
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  selectionPillReady: {
    borderColor: 'rgba(125,155,118,0.34)',
    backgroundColor: 'rgba(157,171,155,0.16)',
  },
  selectionPillText: { color: '#7D9B76', fontSize: 14, fontWeight: '600' },
  selectionHint: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(66,66,72,0.65)',
    fontWeight: '600',
    textAlign: 'center',
  },

  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 14 },
  circle: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 9,
    elevation: 2,
  },
  circleFill: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    position: 'relative',
  },
  circleFillSelected: {
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.28)',
  },
  circleDisabled: { opacity: 0.42 },
  circlePressed: { transform: [{ scale: 0.97 }] },
  circleLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '600',
    textAlign: 'center',
  },
  circleLabelSelected: { color: '#FFFFFF' },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
});
