import { useEffect, useRef } from 'react';
import {
  Animated,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { routes } from '../../navigation/routes';
import { Text } from '../../components/Typography';

const C = {
  page: '#E5E0E5',
  wine: '#722F37',
  winePressed: '#5a2229',
  charcoal: '#2D2D2D',
  white: '#FFFFFF',
};

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Animated values — one per element for independent stagger
  const logoScale   = useRef(new Animated.Value(0.82)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  const headingY       = useRef(new Animated.Value(26)).current;
  const headingOpacity = useRef(new Animated.Value(0)).current;

  const subtitleY       = useRef(new Animated.Value(18)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;

  const ctaScale   = useRef(new Animated.Value(0.92)).current;
  const ctaY       = useRef(new Animated.Value(14)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;

  const authX       = useRef(new Animated.Value(-14)).current;
  const authOpacity = useRef(new Animated.Value(0)).current;

  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineY       = useRef(new Animated.Value(8)).current;

  useEffect(() => {
    const spring = (val: Animated.Value, toValue: number, delay = 0) =>
      Animated.spring(val, { toValue, delay, useNativeDriver: true, damping: 18, stiffness: 160 });

    const fade = (val: Animated.Value, delay = 0, duration = 360) =>
      Animated.timing(val, { toValue: 1, delay, duration, useNativeDriver: true });

    const slide = (val: Animated.Value, delay = 0, duration = 380) =>
      Animated.timing(val, { toValue: 0, delay, duration, useNativeDriver: true });

    // Logo — zoom scale-up at 0ms
    Animated.parallel([
      fade(logoOpacity, 0, 360),
      spring(logoScale, 1, 0),
    ]).start();

    // Heading — slide-up + fade at 80ms
    Animated.parallel([
      fade(headingOpacity, 80, 440),
      slide(headingY, 80, 440),
    ]).start();

    // Subtitle — slide-up + fade at 190ms
    Animated.parallel([
      fade(subtitleOpacity, 190, 380),
      slide(subtitleY, 190, 380),
    ]).start();

    // CTA — spring overshoot pop at 300ms
    Animated.parallel([
      fade(ctaOpacity, 300, 280),
      slide(ctaY, 300, 280),
      Animated.sequence([
        Animated.delay(300),
        Animated.spring(ctaScale, {
          toValue: 1.03,
          useNativeDriver: true,
          damping: 6,
          stiffness: 240,
        }),
        Animated.spring(ctaScale, {
          toValue: 1,
          useNativeDriver: true,
          damping: 14,
          stiffness: 180,
        }),
      ]),
    ]).start();

    // Auth links — horizontal slide from left at 390ms
    Animated.parallel([
      fade(authOpacity, 390, 320),
      Animated.timing(authX, { toValue: 0, delay: 390, duration: 320, useNativeDriver: true }),
    ]).start();

    // Tagline — blur dissolve (fade + slide) at 480ms
    Animated.parallel([
      fade(taglineOpacity, 480, 420),
      slide(taglineY, 480, 420),
    ]).start();
  }, []);

  const handleGetStarted = () => {
    router.replace(('/home?guest=true') as never);
  };

  const handleSignUp = () => {
    router.push(routes.register() as never);
  };

  const handleLogIn = () => {
    router.push(routes.login() as never);
  };

  return (
    <View style={[styles.root, { backgroundColor: C.page }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Background decoration — clipped to screen bounds */}
      <View style={styles.orbLayer} pointerEvents="none">
        <View style={[styles.orb, styles.orb1]} />
        <View style={[styles.orb, styles.orb2]} />
        <View style={[styles.orb, styles.orb3]} />
        <View style={[styles.orb, styles.orb4]} />
      </View>

      {/* Content */}
      <View style={[styles.content, { paddingTop: insets.top + 32, paddingBottom: 24 }]}>

        {/* Logo wordmark — zoom scale-up */}
        <Animated.View style={[styles.logoWrap, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <Text style={styles.logoText}>Sayso</Text>
        </Animated.View>

        {/* Title — slide-up + scale */}
        <Animated.View style={{ opacity: headingOpacity, transform: [{ translateY: headingY }] }}>
          <Text style={styles.title}>Discover gems{'\n'}near you!</Text>
        </Animated.View>

        {/* Subtitle — clean slide-up */}
        <Animated.View style={{ opacity: subtitleOpacity, transform: [{ translateY: subtitleY }] }}>
          <Text style={styles.subtitle}>
            Explore trusted businesses, leave reviews and see what's trending around you
          </Text>
        </Animated.View>

        {/* CTA + auth links */}
        <View style={styles.ctaBlock}>
          {/* Get Started — spring overshoot */}
          <Animated.View style={{ opacity: ctaOpacity, transform: [{ translateY: ctaY }, { scale: ctaScale }] }}>
            <Pressable
              style={({ pressed }) => [styles.getStartedBtn, pressed && styles.getStartedBtnPressed]}
              onPress={handleGetStarted}
            >
              <Text style={styles.getStartedTxt}>Get Started</Text>
            </Pressable>
          </Animated.View>

          {/* Sign Up / Log In — horizontal slide from left */}
          <Animated.View style={[styles.authRow, { opacity: authOpacity, transform: [{ translateX: authX }] }]}>
            <Pressable onPress={handleSignUp} hitSlop={8}>
              <Text style={styles.authSignUp}>Sign Up</Text>
            </Pressable>
            <Text style={styles.authOr}> or </Text>
            <Pressable onPress={handleLogIn} hitSlop={8}>
              <Text style={styles.authLogIn}>Log In</Text>
            </Pressable>
          </Animated.View>
        </View>

        {/* Tagline — blur dissolve fade */}
        <Animated.View style={{ opacity: taglineOpacity, transform: [{ translateY: taglineY }] }}>
          <Text style={styles.tagline}>Less guessing, more confessing</Text>
        </Animated.View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Orbs
  orbLayer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 999 },
  orb1: { width: 300, height: 300, top: -100, right: -80, backgroundColor: 'rgba(114,47,55,0.10)' },
  orb2: { width: 200, height: 200, top: 180, left: -70, backgroundColor: 'rgba(157,171,155,0.15)' },
  orb3: { width: 160, height: 160, bottom: 160, right: -50, backgroundColor: 'rgba(125,155,118,0.12)' },
  orb4: { width: 120, height: 120, bottom: 60, left: 10, backgroundColor: 'rgba(114,47,55,0.07)' },

  // Content
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 24,
  },

  // Logo wordmark
  logoWrap: { alignItems: 'center', marginBottom: 4 },
  logoText: {
    fontFamily: 'MonarchParadox',
    fontSize: 56,
    lineHeight: 64,
    color: '#2D2D2D',
    letterSpacing: 0.2,
    textTransform: 'none',
  },

  // Title
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#2D2D2D',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 40,
  },

  // Subtitle
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: 'rgba(45,45,45,0.70)',
    textAlign: 'center',
    paddingHorizontal: 8,
    fontWeight: '400',
  },

  // CTA block
  ctaBlock: { alignItems: 'center', gap: 16, marginTop: 8 },

  getStartedBtn: {
    width: 200,
    backgroundColor: '#722F37',
    borderRadius: 999,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  getStartedBtnPressed: { opacity: 0.9, transform: [{ scale: 0.98 }] },
  getStartedTxt: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  authRow: { flexDirection: 'row', alignItems: 'center' },
  authSignUp: { fontSize: 14, fontWeight: '700', color: '#2D2D2D' },
  authOr: { fontSize: 14, color: 'rgba(45,45,45,0.70)', fontWeight: '400' },
  authLogIn: { fontSize: 14, fontWeight: '700', color: '#722F37' },

  // Tagline
  tagline: {
    fontStyle: 'italic',
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(45,45,45,0.65)',
    textAlign: 'center',
    marginTop: 8,
  },
});
