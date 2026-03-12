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

const MIN = 1;
const MAX = 3;

const DEALBREAKERS = [
  {
    id: 'trustworthiness',
    label: 'Trustworthiness',
    description: 'Reliable and honest service',
  },
  {
    id: 'punctuality',
    label: 'Punctuality',
    description: 'On-time and respects your schedule',
  },
  {
    id: 'friendliness',
    label: 'Friendliness',
    description: 'Welcoming and helpful staff',
  },
  {
    id: 'value-for-money',
    label: 'Value for Money',
    description: 'Fair pricing and good quality',
  },
] as const;

type DealbreakerId = typeof DEALBREAKERS[number]['id'];
type DealbreakerIconName = 'shield-checkmark-outline' | 'time-outline' | 'happy-outline' | 'pricetag-outline';
type PreferenceDto = { id: string };
type PreferencesResponseDto = { dealbreakers?: PreferenceDto[] };

type CardAnim = {
  opacity: Animated.Value;
  y: Animated.Value;
  selectedScale: Animated.Value;
  flip: Animated.Value;
};

const DEALBREAKER_ICONS: Record<DealbreakerId, DealbreakerIconName> = {
  trustworthiness: 'shield-checkmark-outline',
  punctuality: 'time-outline',
  friendliness: 'happy-outline',
  'value-for-money': 'pricetag-outline',
};

export default function DealBreakersScreen() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [selected, setSelected] = useState<Set<DealbreakerId>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const badgeY = useRef(new Animated.Value(12)).current;
  const prevSelectedRef = useRef<Set<DealbreakerId>>(new Set());
  const cardAnims = useRef<CardAnim[]>(
    DEALBREAKERS.map(() => ({
      opacity: new Animated.Value(0),
      y: new Animated.Value(20),
      selectedScale: new Animated.Value(1),
      flip: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const stored = await AsyncStorage.getItem('onboarding_dealbreakers');
        if (stored) {
          const ids = JSON.parse(stored) as string[];
          const valid = ids.filter((id): id is DealbreakerId => DEALBREAKERS.some((item) => item.id === id));
          if (!cancelled && valid.length > 0) {
            setSelected(new Set(valid));
            return;
          }
        }

        const preferences = await apiFetch<PreferencesResponseDto>('/api/user/preferences');
        const ids = (preferences.dealbreakers ?? [])
          .map((item) => item.id)
          .filter((id): id is DealbreakerId => DEALBREAKERS.some((dealbreaker) => dealbreaker.id === id));

        if (!cancelled && ids.length > 0) {
          setSelected(new Set(ids));
          await AsyncStorage.setItem('onboarding_dealbreakers', JSON.stringify(ids));
        }
      } catch {
        // Ignore hydration errors; screen remains usable.
      }
    }

    hydrate();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (reducedMotion) {
      badgeOpacity.setValue(1);
      badgeY.setValue(0);
      cardAnims.forEach((anim) => {
        anim.opacity.setValue(1);
        anim.y.setValue(0);
      });
      return;
    }

    const ease = Easing.out(Easing.ease);

    Animated.parallel([
      Animated.timing(badgeOpacity, { toValue: 1, delay: 120, duration: 300, useNativeDriver: true }),
      Animated.timing(badgeY, { toValue: 0, delay: 120, duration: 300, easing: ease, useNativeDriver: true }),
    ]).start();

    DEALBREAKERS.forEach((_, index) => {
      const delay = index * 100;
      const anim = cardAnims[index];
      Animated.parallel([
        Animated.timing(anim.opacity, { toValue: 1, delay, duration: 420, easing: ease, useNativeDriver: true }),
        Animated.timing(anim.y, { toValue: 0, delay, duration: 420, easing: ease, useNativeDriver: true }),
      ]).start();
    });
  }, [badgeOpacity, badgeY, cardAnims, reducedMotion]);

  useEffect(() => {
    const prevSelected = prevSelectedRef.current;
    DEALBREAKERS.forEach((item, index) => {
      const anim = cardAnims[index];
      const wasSelected = prevSelected.has(item.id);
      const isSelected = selected.has(item.id);
      if (wasSelected === isSelected) return;

      if (reducedMotion) {
        anim.selectedScale.setValue(isSelected ? 1.05 : 1);
        anim.flip.setValue(isSelected ? 180 : 0);
        return;
      }

      Animated.timing(anim.selectedScale, {
        toValue: isSelected ? 1.05 : 1,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
      Animated.timing(anim.flip, {
        toValue: isSelected ? 180 : 0,
        duration: 600,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }).start();
    });
    prevSelectedRef.current = new Set(selected);
  }, [cardAnims, reducedMotion, selected]);

  const toggle = useCallback((id: DealbreakerId) => {
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
      await apiFetch('/api/onboarding/deal-breakers', {
        method: 'POST',
        body: JSON.stringify({ dealbreakers: ids }),
      });
      await AsyncStorage.setItem('onboarding_dealbreakers', JSON.stringify(ids));
      router.replace(routes.completeProfile() as never);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save deal breakers. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [canContinue, isLoading, router, selected]);

  const handleBack = () => router.back();

  const helperText =
    selected.size === 0
      ? 'Select at least one deal-breaker to continue'
      : selected.size === MAX
        ? "Perfect! You've selected the maximum"
        : 'Great! Select more or complete setup';

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingLayout
        step={3}
        totalSteps={4}
        title="What are your dealbreakers?"
        subtitle="Select what matters most to you in a business"
        titleTyping
        titleTypingDelayMs={300}
        titleTypingSpeedMs={40}
        onBack={handleBack}
        onContinue={handleContinue}
        continueLabel="Complete Setup"
        continueVariant="complete"
        canContinue={canContinue}
        isLoading={isLoading}
      >
        {error ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <Animated.View style={[styles.counterWrap, { opacity: badgeOpacity, transform: [{ translateY: badgeY }] }]}>
          <View style={[styles.counterPill, selected.size > 0 && styles.counterPillReady]}>
            <Text style={styles.counterText}>
              {selected.size} of {MAX} selected
            </Text>
            {selected.size > 0 ? <Ionicons name="checkmark-circle" size={15} color={ONBOARDING_TOKENS.sage} /> : null}
          </View>
          <Text style={styles.counterHint}>{helperText}</Text>
        </Animated.View>

        <View style={styles.grid}>
          {DEALBREAKERS.map((item, index) => {
            const isSelected = selected.has(item.id);
            const isDisabled = atMax && !isSelected;
            const anim = cardAnims[index];
            const frontRotate = anim.flip.interpolate({
              inputRange: [0, 180],
              outputRange: ['0deg', '180deg'],
            });
            const backRotate = anim.flip.interpolate({
              inputRange: [0, 180],
              outputRange: ['180deg', '360deg'],
            });
            return (
              <Animated.View
                key={item.id}
                style={{
                  width: '48.5%',
                  opacity: anim.opacity,
                  transform: [{ translateY: anim.y }, { scale: anim.selectedScale }],
                }}
              >
                <Pressable
                  style={({ pressed }) => [
                    styles.card,
                    isDisabled && styles.cardDisabled,
                    pressed && !isDisabled && styles.cardPressed,
                  ]}
                  onPress={() => toggle(item.id)}
                  disabled={isDisabled}
                >
                  <View style={styles.flipCard}>
                    <Animated.View
                      style={[
                        styles.cardFace,
                        {
                          transform: [{ perspective: 1000 }, { rotateY: frontRotate }],
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={
                          isDisabled
                            ? ['rgba(45,45,45,0.05)', 'rgba(45,45,45,0.03)']
                            : ['rgba(157,171,155,0.10)', 'rgba(157,171,155,0.05)']
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={[styles.cardFaceFill, isDisabled && styles.cardFaceFillDisabled]}
                      >
                        <View style={[styles.cardIconWrap, isDisabled && styles.cardIconWrapDisabled]}>
                          <Ionicons
                            name={DEALBREAKER_ICONS[item.id]}
                            size={24}
                            color={isDisabled ? 'rgba(45,45,45,0.45)' : ONBOARDING_TOKENS.sage}
                          />
                        </View>
                        <Text style={styles.cardLabel}>{item.label}</Text>
                        <Text numberOfLines={2} style={styles.cardDescription}>
                          {item.description}
                        </Text>
                      </LinearGradient>
                    </Animated.View>

                    <Animated.View
                      style={[
                        styles.cardFace,
                        {
                          transform: [{ perspective: 1000 }, { rotateY: backRotate }],
                        },
                      ]}
                    >
                      <LinearGradient
                        colors={ONBOARDING_GRADIENTS.cardPrimary}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={styles.cardFaceFill}
                      >
                        <View style={styles.selectedIconWrap}>
                          <Ionicons name={DEALBREAKER_ICONS[item.id]} size={28} color={ONBOARDING_TOKENS.white} />
                        </View>
                        <View style={styles.selectedCheck}>
                          <Ionicons name="checkmark-circle" size={15} color={ONBOARDING_TOKENS.coral} />
                        </View>
                      </LinearGradient>
                    </Animated.View>
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
        </View>
      </OnboardingLayout>
    </>
  );
}

const styles = StyleSheet.create({
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

  counterWrap: {
    alignItems: 'center',
    marginBottom: 16,
  },
  counterPill: {
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
  counterPillReady: {
    borderColor: 'rgba(157,171,155,0.3)',
    backgroundColor: 'rgba(157,171,155,0.14)',
  },
  counterText: {
    color: ONBOARDING_TOKENS.sage,
    fontSize: 14,
    fontWeight: '600',
  },
  counterHint: {
    marginTop: 7,
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
    rowGap: 12,
  },
  card: {
    height: 164,
    borderRadius: 14,
    overflow: 'hidden',
  },
  flipCard: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  cardFace: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    overflow: 'hidden',
    backfaceVisibility: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(157,171,155,0.30)',
  },
  cardFaceFill: {
    flex: 1,
    paddingHorizontal: 18,
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(157,171,155,0.16)',
    borderWidth: 1,
    borderColor: 'rgba(157,171,155,0.28)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  cardIconWrapDisabled: {
    backgroundColor: 'rgba(45,45,45,0.08)',
    borderColor: 'rgba(45,45,45,0.16)',
  },
  cardFaceFillDisabled: {
    borderColor: 'rgba(45,45,45,0.2)',
  },
  cardDisabled: {
    opacity: 0.42,
  },
  cardPressed: {
    transform: [{ scale: 0.98 }],
  },
  cardLabel: {
    textAlign: 'center',
    color: ONBOARDING_TOKENS.charcoal,
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardDescription: {
    textAlign: 'center',
    color: ONBOARDING_TOKENS.charcoal60,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  selectedIconWrap: {
    width: 62,
    height: 62,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  selectedCheck: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: ONBOARDING_TOKENS.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
