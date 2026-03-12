import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { routes } from '../../navigation/routes';
import { Text } from '../../components/Typography';
import { NAVBAR_BG_COLOR } from '../../styles/colors';

const GRID = 8;
const TYPE_SCALE = {
  logo: 26,
  title: 34,
  subtitle: 16,
  cta: 16,
  auth: 14,
  tagline: 14,
} as const;

const C = {
  page: '#E5E0E5',
  charcoal: '#2D2D2D',
  charcoalSoft: 'rgba(45,45,45,0.72)',
  white: '#FFFFFF',
};

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const headerOpacity = useRef(new Animated.Value(0)).current;
  const headerY = useRef(new Animated.Value(GRID * 2)).current;

  const ctaScale = useRef(new Animated.Value(0.96)).current;
  const ctaY = useRef(new Animated.Value(GRID)).current;
  const ctaOpacity = useRef(new Animated.Value(0)).current;

  const loginOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const easeOut = Easing.out(Easing.cubic);

    // Header enters first to establish context.
    Animated.parallel([
      Animated.timing(headerOpacity, {
        toValue: 1,
        duration: 260,
        easing: easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(headerY, {
        toValue: 0,
        duration: 260,
        easing: easeOut,
        useNativeDriver: true,
      }),
    ]).start();

    // CTA settles with a subtle spring so focus lands on primary action.
    Animated.sequence([
      Animated.delay(120),
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ctaOpacity, {
            toValue: 1,
            duration: 200,
            easing: easeOut,
            useNativeDriver: true,
          }),
          Animated.timing(ctaY, {
            toValue: 0,
            duration: 200,
            easing: easeOut,
            useNativeDriver: true,
          }),
          Animated.spring(ctaScale, {
            toValue: 1.02,
            damping: 16,
            stiffness: 220,
            mass: 0.8,
            useNativeDriver: true,
          }),
        ]),
        Animated.spring(ctaScale, {
          toValue: 1,
          damping: 22,
          stiffness: 260,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(loginOpacity, {
        toValue: 1,
        duration: 180,
        easing: easeOut,
        useNativeDriver: true,
      }),
    ]).start();
  }, [ctaOpacity, ctaScale, ctaY, headerOpacity, headerY, loginOpacity]);

  const handleGetStarted = () => {
    router.replace(routes.home() as never);
  };

  const handleLogIn = () => {
    router.push(routes.login() as never);
  };

  return (
    <View style={[styles.root, { backgroundColor: C.page }]}>
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + GRID * 6,
            paddingBottom: insets.bottom + GRID * 4,
          },
        ]}
      >
        <View style={styles.centerRail}>
          <Animated.View
            style={[
              styles.headerGroup,
              {
                opacity: headerOpacity,
                transform: [{ translateY: headerY }],
              },
            ]}
          >
            <Text style={styles.logoText}>Sayso</Text>
            <Text style={styles.title}>Discover gems{'\n'}near you!</Text>
            <Text style={styles.subtitle}>
              Explore trusted businesses, leave reviews and see what&apos;s trending around you
            </Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.ctaWrap,
              {
                opacity: ctaOpacity,
                transform: [{ translateY: ctaY }, { scale: ctaScale }],
              },
            ]}
          >
            <Pressable
              style={({ pressed }) => [styles.getStartedBtn, pressed && styles.getStartedBtnPressed]}
              onPress={handleGetStarted}
            >
              <Text style={styles.getStartedTxt}>Get Started</Text>
            </Pressable>
          </Animated.View>

          <Animated.View style={[styles.authRow, { opacity: loginOpacity }]}>
            <Text style={styles.authHint}>Already have an account? </Text>
            <Pressable onPress={handleLogIn} hitSlop={8}>
              <Text style={styles.authLogIn}>Log In</Text>
            </Pressable>
          </Animated.View>
        </View>

        <Text style={styles.tagline}>Less guessing, more confessing</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  content: {
    flex: 1,
    paddingHorizontal: GRID * 3,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  centerRail: {
    flex: 1,
    width: '100%',
    maxWidth: GRID * 43,
    alignItems: 'center',
    justifyContent: 'center',
    gap: GRID * 4,
  },

  headerGroup: {
    width: '100%',
    alignItems: 'center',
    gap: GRID * 2,
  },

  logoText: {
    fontFamily: 'MonarchParadox',
    fontSize: TYPE_SCALE.logo,
    lineHeight: 32,
    color: C.charcoal,
    letterSpacing: 0.2,
    textTransform: 'none',
  },

  title: {
    fontSize: TYPE_SCALE.title,
    lineHeight: 40,
    fontWeight: '700',
    color: C.charcoal,
    textAlign: 'center',
    letterSpacing: -0.5,
  },

  subtitle: {
    maxWidth: GRID * 36,
    fontSize: TYPE_SCALE.subtitle,
    lineHeight: 24,
    color: C.charcoalSoft,
    textAlign: 'center',
    fontWeight: '400',
  },

  ctaWrap: {
    width: '100%',
  },

  getStartedBtn: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: NAVBAR_BG_COLOR,
    paddingVertical: GRID * 2,
    paddingHorizontal: GRID * 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  getStartedBtnPressed: {
    opacity: 0.96,
    transform: [{ scale: 0.99 }],
  },
  getStartedTxt: {
    fontSize: TYPE_SCALE.cta,
    fontWeight: '700',
    color: C.white,
  },

  authRow: {
    minHeight: GRID * 3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  authHint: {
    fontSize: TYPE_SCALE.auth,
    color: C.charcoalSoft,
    fontWeight: '400',
  },
  authLogIn: {
    fontSize: TYPE_SCALE.auth,
    fontWeight: '700',
    color: NAVBAR_BG_COLOR,
  },

  tagline: {
    fontSize: TYPE_SCALE.tagline,
    lineHeight: 24,
    fontStyle: 'italic',
    fontWeight: '500',
    color: 'rgba(45,45,45,0.65)',
    textAlign: 'center',
  },
});
