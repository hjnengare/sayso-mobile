import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Easing, StyleSheet, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { OnboardingLayout } from '../../components/onboarding/OnboardingLayout';
import { ONBOARDING_TOKENS } from '../../components/onboarding/onboardingTheme';
import { Text } from '../../components/Typography';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { apiFetch } from '../../lib/api';
import { routes } from '../../navigation/routes';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PARTICLE_COUNT = 54;
const FALL_DISTANCE = SCREEN_HEIGHT + 120;

function Particle({ delay, x, color, size }: { delay: number; x: number; color: string; size: number }) {
  const y = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.sequence([
      Animated.delay(delay),
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(y, { toValue: FALL_DISTANCE, duration: 1800, useNativeDriver: true }),
        Animated.timing(rotation, { toValue: 1, duration: 1800, useNativeDriver: true }),
      ]),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]);
    anim.start();
  }, [delay, opacity, rotation, y]);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 0,
        left: x,
        width: size,
        height: size,
        borderRadius: size / 4,
        backgroundColor: color,
        opacity,
        transform: [{ translateY: y }, { rotate: spin }],
      }}
      pointerEvents="none"
    />
  );
}

type DealbreakerIconName = 'shield-checkmark-outline' | 'time-outline' | 'happy-outline' | 'pricetag-outline';

const DEALBREAKER_ICONS: Record<string, DealbreakerIconName> = {
  trustworthiness: 'shield-checkmark-outline',
  punctuality: 'time-outline',
  friendliness: 'happy-outline',
  'value-for-money': 'pricetag-outline',
};

const CONFETTI_COLORS = [
  ONBOARDING_TOKENS.coral,
  ONBOARDING_TOKENS.sage,
  ONBOARDING_TOKENS.offWhite,
  'rgba(114,47,55,0.8)',
  'rgba(157,171,155,0.9)',
];

export default function CompleteScreen() {
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [selectedDealbreakers, setSelectedDealbreakers] = useState<string[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const hasCompletedRef = useRef(false);

  const contentOpacity = useRef(new Animated.Value(0)).current;
  const contentY = useRef(new Animated.Value(16)).current;
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const badgeY = useRef(new Animated.Value(12)).current;
  const iconFloat = useRef(Array.from({ length: 4 }, () => new Animated.Value(0))).current;

  const particles = useMemo(
    () =>
      Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
        key: i,
        delay: Math.random() * 1000,
        x: Math.random() * (SCREEN_WIDTH + 40) - 20,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        size: 5 + Math.random() * 9,
      })),
    []
  );

  const handleContinue = useCallback(async () => {
    if (hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    setIsCompleting(true);

    try {
      await apiFetch('/api/onboarding/complete', { method: 'POST' });
      await AsyncStorage.multiRemove([
        'onboarding_interests',
        'onboarding_subcategories',
        'onboarding_dealbreakers',
      ]);
    } catch {
      // Best effort completion: still move to home to avoid trapping users.
    } finally {
      router.replace(routes.home() as never);
    }
  }, [router]);

  useEffect(() => {
    AsyncStorage.getItem('onboarding_dealbreakers')
      .then((raw) => {
        if (!raw) return;
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setSelectedDealbreakers(parsed.filter((id): id is string => typeof id === 'string'));
          }
        } catch {
          // Ignore malformed cache.
        }
      })
      .catch(() => {
        // Ignore storage errors.
      });

    if (reducedMotion) {
      contentOpacity.setValue(1);
      contentY.setValue(0);
      badgeOpacity.setValue(1);
      badgeY.setValue(0);
    } else {
      Animated.sequence([
        Animated.parallel([
          Animated.timing(contentOpacity, { toValue: 1, delay: 90, duration: 360, useNativeDriver: true }),
          Animated.timing(contentY, { toValue: 0, delay: 90, duration: 360, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(badgeOpacity, { toValue: 1, delay: 120, duration: 300, useNativeDriver: true }),
          Animated.timing(badgeY, { toValue: 0, delay: 120, duration: 300, useNativeDriver: true }),
        ]),
      ]).start();
    }

    const timer = setTimeout(() => {
      void handleContinue();
    }, 2000);

    return () => clearTimeout(timer);
  }, [badgeOpacity, badgeY, contentOpacity, contentY, handleContinue, reducedMotion]);

  useEffect(() => {
    if (reducedMotion || selectedDealbreakers.length === 0) {
      iconFloat.forEach((value) => value.setValue(0));
      return;
    }

    const loops = iconFloat.map((value, index) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(value, {
            toValue: 1,
            duration: 1300 + index * 150,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 1300 + index * 150,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      )
    );

    loops.forEach((loop) => loop.start());

    return () => {
      loops.forEach((loop) => loop.stop());
      iconFloat.forEach((value) => value.setValue(0));
    };
  }, [iconFloat, reducedMotion, selectedDealbreakers.length]);

  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <OnboardingLayout
        step={4}
        totalSteps={4}
        title="You're all set!"
        subtitle="Time to discover what's out there."
        onContinue={handleContinue}
        continueLabel="Continue to Home"
        loadingLabel="Going to Home..."
        canContinue={!isCompleting}
        isLoading={isCompleting}
        overlay={
          !reducedMotion ? (
            <View style={[StyleSheet.absoluteFill, styles.confettiLayer]} pointerEvents="none">
              {particles.map((particle) => (
                <Particle
                  key={particle.key}
                  delay={particle.delay}
                  x={particle.x}
                  color={particle.color}
                  size={particle.size}
                />
              ))}
            </View>
          ) : undefined
        }
      >
        <Animated.View style={[styles.content, { opacity: contentOpacity, transform: [{ translateY: contentY }] }]}>
          {selectedDealbreakers.length > 0 ? (
            <View style={styles.iconRow}>
              {selectedDealbreakers.map((id, index) => {
                const icon = DEALBREAKER_ICONS[id];
                if (!icon) return null;

                const floatY = iconFloat[index % iconFloat.length].interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, -8],
                });

                return (
                  <Animated.View key={id} style={{ transform: [{ translateY: floatY }] }}>
                    <View style={styles.iconBubble}>
                      <Ionicons name={icon} size={22} color={ONBOARDING_TOKENS.sage} />
                    </View>
                  </Animated.View>
                );
              })}
            </View>
          ) : null}

          <Animated.View style={{ opacity: badgeOpacity, transform: [{ translateY: badgeY }] }}>
            <View style={styles.badge}>
              <Ionicons name="checkmark-circle" size={14} color={ONBOARDING_TOKENS.sage} />
              <Text style={styles.badgeText}>Setup Complete</Text>
            </View>
            <Text style={styles.autoRedirectHint}>Redirecting automatically...</Text>
          </Animated.View>
        </Animated.View>
      </OnboardingLayout>
    </>
  );
}

const styles = StyleSheet.create({
  confettiLayer: {
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    gap: 18,
    marginBottom: 8,
  },
  iconRow: {
    marginTop: 6,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 10,
  },
  iconBubble: {
    width: 46,
    height: 46,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(157,171,155,0.32)',
    backgroundColor: 'rgba(157,171,155,0.16)',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(157,171,155,0.15)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(157,171,155,0.35)',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: ONBOARDING_TOKENS.sage,
  },
  autoRedirectHint: {
    marginTop: 10,
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(45,45,45,0.60)',
    textAlign: 'center',
  },
});
