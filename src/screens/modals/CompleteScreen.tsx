import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../../components/Typography';
import { apiFetch } from '../../lib/api';
import { routes } from '../../navigation/routes';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const PARTICLE_COUNT = 54;
const FALL_DISTANCE = SCREEN_HEIGHT + 120;

// Confetti particle — a single animated colored dot
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
  }, [delay, opacity, y, rotation]);

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

const CONFETTI_COLORS = ['#722F37', '#9DAB9B', '#E5E0E5', '#7D9B76', '#D4A5A5', '#B8C9B6'];
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  key: i,
  delay: Math.random() * 1000,
  x: Math.random() * (SCREEN_WIDTH + 40) - 20,
  color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
  size: 5 + Math.random() * 9,
}));

type DealbreakerIconName = 'shield-checkmark-outline' | 'time-outline' | 'happy-outline' | 'pricetag-outline';

const DEALBREAKER_ICONS: Record<string, DealbreakerIconName> = {
  trustworthiness: 'shield-checkmark-outline',
  punctuality: 'time-outline',
  friendliness: 'happy-outline',
  'value-for-money': 'pricetag-outline',
};

export default function CompleteScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDealbreakers, setSelectedDealbreakers] = useState<string[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const hasCompletedRef = useRef(false);

  // Entrance animations
  const textOpacity  = useRef(new Animated.Value(0)).current;
  const textY        = useRef(new Animated.Value(20)).current;
  const btnOpacity   = useRef(new Animated.Value(0)).current;
  const btnY         = useRef(new Animated.Value(16)).current;

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

    // Staggered entrance
    Animated.sequence([
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, delay: 80, duration: 360, useNativeDriver: true }),
        Animated.timing(textY, { toValue: 0, delay: 80, duration: 360, useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(btnOpacity, { toValue: 1, delay: 150, duration: 320, useNativeDriver: true }),
        Animated.timing(btnY, { toValue: 0, delay: 150, duration: 320, useNativeDriver: true }),
      ]),
    ]).start();

    // Auto-redirect after 2s
    const timer = setTimeout(() => {
      void handleContinue();
    }, 2000);
    return () => clearTimeout(timer);
  }, [btnOpacity, btnY, handleContinue, textOpacity, textY]);

  return (
    <View style={[styles.root, { backgroundColor: '#E5E0E5' }]}>
      {/* Confetti particles */}
      <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
        {PARTICLES.map(p => (
          <Particle key={p.key} delay={p.delay} x={p.x} color={p.color} size={p.size} />
        ))}
      </View>

      <View style={[styles.content, { paddingTop: insets.top + 40, paddingBottom: 24 }]}>
        {/* Text block */}
        <Animated.View style={[styles.textBlock, { opacity: textOpacity, transform: [{ translateY: textY }] }]}>
          <Text style={styles.heading}>You're all set!</Text>
          <Text style={styles.subheading}>Time to discover what's out there.</Text>

          {selectedDealbreakers.length > 0 ? (
            <View style={styles.iconRow}>
              {selectedDealbreakers.map((id) => {
                const icon = DEALBREAKER_ICONS[id];
                if (!icon) return null;
                return (
                  <View key={id} style={styles.iconBubble}>
                    <Ionicons name={icon} size={22} color="#7D9B76" />
                  </View>
                );
              })}
            </View>
          ) : null}
        </Animated.View>

        {/* CTA button */}
        <Animated.View style={[styles.btnWrap, { opacity: btnOpacity, transform: [{ translateY: btnY }] }]}>
          <Pressable
            style={({ pressed }) => [styles.btn, isCompleting && styles.btnDisabled, pressed && !isCompleting && styles.btnPressed]}
            onPress={() => void handleContinue()}
            disabled={isCompleting}
          >
            <LinearGradient
              colors={['#722F37', '#7A404A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.btnGradient}
            >
              <Text style={styles.btnTxt}>{isCompleting ? 'Going to Home...' : 'Continue to Home'}</Text>
              {!isCompleting ? <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} /> : null}
            </LinearGradient>
          </Pressable>

          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={14} color="#7D9B76" />
            <Text style={styles.badgeText}>Setup Complete</Text>
          </View>
          <Text style={styles.autoRedirectHint}>Redirecting automatically…</Text>
        </Animated.View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  content: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 32, gap: 32,
  },
  textBlock: { alignItems: 'center', gap: 12, width: '100%' },
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
    borderColor: 'rgba(125,155,118,0.32)',
    backgroundColor: 'rgba(125,155,118,0.16)',
  },

  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(125,155,118,0.15)',
    borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6,
    borderWidth: 1, borderColor: 'rgba(125,155,118,0.35)',
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#7D9B76' },

  heading: {
    fontSize: 34, fontWeight: '700', color: '#2D2D2D',
    textAlign: 'center', letterSpacing: -0.5,
  },
  subheading: {
    fontSize: 16, lineHeight: 24, fontWeight: '400',
    color: 'rgba(45,45,45,0.65)', textAlign: 'center',
  },

  btnWrap: { alignItems: 'center', gap: 12 },

  btn: {
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#722F37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 6,
  },
  btnGradient: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, paddingHorizontal: 32,
    justifyContent: 'center',
  },
  btnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  btnDisabled: { opacity: 0.64, shadowOpacity: 0 },
  btnTxt: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  autoRedirectHint: {
    fontSize: 12, fontWeight: '400',
    color: 'rgba(45,45,45,0.45)', textAlign: 'center',
  },
});
