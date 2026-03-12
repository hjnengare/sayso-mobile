import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import { ONBOARDING_GRADIENTS, ONBOARDING_TOKENS } from '../../components/onboarding/onboardingTheme';
import { Text } from '../../components/Typography';
import { useReducedMotion } from '../../hooks/useReducedMotion';
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
  x: Animated.Value;
  entryScale: Animated.Value;
  selectedScale: Animated.Value;
  bounceScale: Animated.Value;
  checkScale: Animated.Value;
};

export default function InterestsScreen() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [selected, setSelected] = useState<Set<InterestId>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const badgeY = useRef(new Animated.Value(12)).current;
  const prevSelectedRef = useRef<Set<InterestId>>(new Set());
  const itemAnims = useRef<ItemAnim[]>(
    INTERESTS.map(() => ({
      opacity: new Animated.Value(0),
      y: new Animated.Value(20),
      x: new Animated.Value(0),
      entryScale: new Animated.Value(0.9),
      selectedScale: new Animated.Value(1),
      bounceScale: new Animated.Value(1),
      checkScale: new Animated.Value(0),
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
    if (reducedMotion) {
      badgeOpacity.setValue(1);
      badgeY.setValue(0);
      itemAnims.forEach((anim) => {
        anim.opacity.setValue(1);
        anim.y.setValue(0);
        anim.entryScale.setValue(1);
      });
      return;
    }

    const ease = Easing.bezier(0.25, 0.8, 0.25, 1);

    Animated.parallel([
      Animated.timing(badgeOpacity, { toValue: 1, delay: 120, duration: 300, useNativeDriver: true }),
      Animated.timing(badgeY, { toValue: 0, delay: 120, duration: 300, easing: ease, useNativeDriver: true }),
    ]).start();

    INTERESTS.forEach((_, i) => {
      const delay = Math.min(i, 8) * 30 + 100;
      const anim = itemAnims[i];
      Animated.parallel([
        Animated.timing(anim.opacity, { toValue: 1, delay, duration: 400, easing: ease, useNativeDriver: true }),
        Animated.timing(anim.y, { toValue: 0, delay, duration: 400, easing: ease, useNativeDriver: true }),
        Animated.timing(anim.entryScale, { toValue: 1, delay, duration: 400, easing: ease, useNativeDriver: true }),
      ]).start();
    });
  }, [badgeOpacity, badgeY, itemAnims, reducedMotion]);

  useEffect(() => {
    const prevSelected = prevSelectedRef.current;
    INTERESTS.forEach((item, index) => {
      const anim = itemAnims[index];
      const wasSelected = prevSelected.has(item.id);
      const isSelected = selected.has(item.id);
      if (wasSelected === isSelected) return;

      if (reducedMotion) {
        anim.selectedScale.setValue(isSelected ? 1.05 : 1);
        anim.checkScale.setValue(isSelected ? 1 : 0);
        return;
      }

      Animated.spring(anim.selectedScale, {
        toValue: isSelected ? 1.05 : 1,
        stiffness: 400,
        damping: 17,
        mass: 1,
        useNativeDriver: true,
      }).start();

      if (isSelected) {
        anim.checkScale.setValue(0);
        Animated.spring(anim.checkScale, {
          toValue: 1,
          stiffness: 500,
          damping: 25,
          mass: 1,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(anim.checkScale, {
          toValue: 0,
          duration: 120,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }).start();
      }
    });
    prevSelectedRef.current = new Set(selected);
  }, [itemAnims, reducedMotion, selected]);

  const triggerShake = useCallback((id: InterestId) => {
    if (reducedMotion) return;

    const index = INTERESTS.findIndex((interest) => interest.id === id);
    if (index < 0) return;
    const x = itemAnims[index].x;
    x.setValue(0);
    Animated.sequence([
      Animated.timing(x, { toValue: -4, duration: 70, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(x, { toValue: 4, duration: 70, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(x, { toValue: -3, duration: 70, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(x, { toValue: 2, duration: 70, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(x, { toValue: 0, duration: 70, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]).start();
  }, [itemAnims, reducedMotion]);

  const toggle = useCallback((id: InterestId) => {
    const index = INTERESTS.findIndex((interest) => interest.id === id);
    if (index >= 0 && !reducedMotion) {
      const bounceScale = itemAnims[index].bounceScale;
      bounceScale.setValue(1);
      Animated.sequence([
        Animated.timing(bounceScale, {
          toValue: 1.08,
          duration: 140,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(bounceScale, {
          toValue: 1,
          duration: 210,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }

    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX) {
        next.add(id);
      } else {
        triggerShake(id);
      }
      return next;
    });
  }, [itemAnims, reducedMotion, triggerShake]);

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
      router.push(routes.subcategories() as never);
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
        <View style={styles.contentLayer}>
          {error ? (
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
                <Ionicons name="checkmark-circle" size={15} color={ONBOARDING_TOKENS.sage} />
              ) : null}
            </View>
            <Text style={styles.selectionHint}>{helperText}</Text>
          </Animated.View>

          <Animated.View style={styles.grid}>
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
                    transform: [
                      { translateY: anim.y },
                      { translateX: anim.x },
                      { scale: anim.entryScale },
                      { scale: anim.selectedScale },
                      { scale: anim.bounceScale },
                    ],
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
                      colors={isSelected ? ONBOARDING_GRADIENTS.cardPrimary : ONBOARDING_GRADIENTS.cardSecondary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={[styles.circleFill, isSelected && styles.circleFillSelected]}
                    >
                      <Text style={[styles.circleLabel, isSelected && styles.circleLabelSelected]}>
                        {item.label}
                      </Text>
                    </LinearGradient>
                  </Pressable>
                  {isSelected ? (
                    <Animated.View style={[styles.checkBadge, { transform: [{ scale: anim.checkScale }] }]}>
                      <Ionicons name="checkmark-circle" size={22} color={ONBOARDING_TOKENS.sage} />
                    </Animated.View>
                  ) : null}
                </Animated.View>
              );
            })}
          </Animated.View>
        </View>
      </OnboardingLayout>
    </>
  );
}

const styles = StyleSheet.create({
  contentLayer: {
    position: 'relative',
    zIndex: 1,
  },

  errorBanner: {
    backgroundColor: 'rgba(229,224,229,0.95)',
    borderColor: 'rgba(114,47,55,0.35)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    color: ONBOARDING_TOKENS.coral,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '600',
  },

  selectionWrap: {
    alignItems: 'center',
    marginBottom: 18,
  },
  selectionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: 'rgba(157,171,155,0.2)',
    backgroundColor: 'rgba(157,171,155,0.10)',
    borderRadius: 999,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  selectionPillReady: {
    borderColor: 'rgba(157,171,155,0.3)',
    backgroundColor: 'rgba(157,171,155,0.14)',
  },
  selectionPillText: {
    color: ONBOARDING_TOKENS.sage,
    fontSize: 14,
    fontWeight: '600',
  },
  selectionHint: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: ONBOARDING_TOKENS.charcoal60,
    fontWeight: '600',
    textAlign: 'center',
  },

  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  circle: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
  circleDisabled: {
    opacity: 0.42,
  },
  circlePressed: {
    transform: [{ scale: 0.95 }],
  },
  circleLabel: {
    color: ONBOARDING_TOKENS.white,
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '600',
    textAlign: 'center',
  },
  circleLabelSelected: {
    color: ONBOARDING_TOKENS.white,
  },
  checkBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});
