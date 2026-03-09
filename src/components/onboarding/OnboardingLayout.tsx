import type { ReactNode } from 'react';
import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '../Typography';

const C = {
  page: '#E5E0E5',
  wine: '#722F37',
  sage: '#7D9B76',
  white: '#FFFFFF',
};

type Props = {
  step: number;
  totalSteps: number;
  title: string;
  subtitle: string;
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  continueVariant?: 'continue' | 'complete';
  canContinue: boolean;
  isLoading?: boolean;
  children: ReactNode;
};

export function OnboardingLayout({
  step,
  totalSteps,
  title,
  subtitle,
  onBack,
  onContinue,
  continueLabel = 'Continue',
  continueVariant = 'continue',
  canContinue,
  isLoading = false,
  children,
}: Props) {
  const insets = useSafeAreaInsets();
  const progressPercentage = Math.max(0, Math.min(100, (step / totalSteps) * 100));
  const isCompleteVariant = continueVariant === 'complete';

  // Title: slide-up + fade
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY       = useRef(new Animated.Value(20)).current;

  // Subtitle: slide-up + fade
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const subtitleY       = useRef(new Animated.Value(18)).current;

  // Action area: fade-up
  const actionOpacity = useRef(new Animated.Value(0)).current;
  const actionY       = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const ease = Easing.out(Easing.cubic);

    Animated.parallel([
      Animated.timing(titleOpacity, { toValue: 1, delay: 50,  duration: 380, useNativeDriver: true }),
      Animated.timing(titleY,       { toValue: 0, delay: 50,  duration: 380, easing: ease, useNativeDriver: true }),
    ]).start();

    Animated.parallel([
      Animated.timing(subtitleOpacity, { toValue: 1, delay: 110, duration: 360, useNativeDriver: true }),
      Animated.timing(subtitleY,       { toValue: 0, delay: 110, duration: 360, easing: ease, useNativeDriver: true }),
    ]).start();

    Animated.parallel([
      Animated.timing(actionOpacity, { toValue: 1, delay: 180, duration: 320, useNativeDriver: true }),
      Animated.timing(actionY,       { toValue: 0, delay: 180, duration: 320, easing: ease, useNativeDriver: true }),
    ]).start();
  }, [actionOpacity, actionY, subtitleOpacity, subtitleY, titleOpacity, titleY]);

  return (
    <View style={[styles.root, { backgroundColor: C.page }]}>
      <View style={styles.topProgressTrack}>
        <View style={[styles.topProgressFill, { width: `${progressPercentage}%` }]} />
      </View>

      <View style={styles.orbLayer} pointerEvents="none">
        <View style={[styles.orb, styles.orb1]} />
        <View style={[styles.orb, styles.orb2]} />
        <View style={[styles.orb, styles.orb3]} />
      </View>

      {onBack ? (
        <View style={[styles.backWrap, { top: insets.top + 8 }]}>
          <Pressable style={styles.backBtn} onPress={onBack} hitSlop={12}>
            <Ionicons name="arrow-back" size={22} color={C.white} />
          </Pressable>
        </View>
      ) : null}

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          {
            paddingTop: insets.top + 68,
            paddingBottom: insets.bottom + 22,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }] }}>
            <Text style={styles.title}>{title}</Text>
          </Animated.View>
          <Animated.View style={{ opacity: subtitleOpacity, transform: [{ translateY: subtitleY }] }}>
            <Text style={styles.subtitle}>{subtitle}</Text>
          </Animated.View>
        </View>

        {children}

        <Animated.View
          style={[styles.actionWrap, { opacity: actionOpacity, transform: [{ translateY: actionY }] }]}
        >
          <Pressable
            style={({ pressed }) => [
              styles.continueBtn,
              !canContinue && styles.continueBtnDisabled,
              pressed && canContinue && styles.continueBtnPressed,
            ]}
            onPress={onContinue}
            disabled={!canContinue || isLoading}
          >
            <LinearGradient
              colors={isCompleteVariant ? [C.sage, '#6B8A64'] : [C.wine, '#7A404A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueBtnGradient}
            >
              <Text style={styles.continueTxt}>{isLoading ? 'Saving…' : continueLabel}</Text>
              {!isLoading ? (
                <Ionicons name="arrow-forward" size={17} color={C.white} style={{ marginLeft: 8 }} />
              ) : null}
            </LinearGradient>
          </Pressable>

          <View style={styles.progressDots}>
            {Array.from({ length: totalSteps }).map((_, index) => {
              const dot = index + 1;
              const isActive = dot === step;
              const isCompleted = dot < step;
              return (
                <View
                  key={dot}
                  style={[
                    styles.progressDot,
                    isActive && styles.progressDotActive,
                    isCompleted && styles.progressDotComplete,
                  ]}
                />
              );
            })}
          </View>
          <Text style={styles.progressLabel}>Step {step} of {totalSteps}</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },

  topProgressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: 4,
    backgroundColor: 'rgba(45,45,45,0.12)',
    zIndex: 20,
  },
  topProgressFill: {
    height: '100%',
    backgroundColor: '#9DAB9B',
  },

  orbLayer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 999 },
  orb1: { width: 260, height: 260, top: -80,  right: -60,  backgroundColor: 'rgba(114,47,55,0.09)' },
  orb2: { width: 180, height: 180, bottom: 120, left: -60,  backgroundColor: 'rgba(157,171,155,0.14)' },
  orb3: { width: 130, height: 130, top: 200,  left: -40,   backgroundColor: 'rgba(125,155,118,0.10)' },

  backWrap: { position: 'absolute', left: 20, zIndex: 10 },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: '#722F37',
    borderWidth: 1,
    borderColor: 'rgba(114,47,55,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  scroll: { paddingHorizontal: 18 },
  header: { marginBottom: 16, alignItems: 'center' },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: '#2D2D2D',
    letterSpacing: -0.4,
    lineHeight: 40,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    fontWeight: '400',
    color: 'rgba(45,45,45,0.70)',
    textAlign: 'center',
    paddingHorizontal: 8,
  },

  actionWrap: { marginTop: 24, paddingBottom: 2, alignItems: 'center' },
  continueBtn: {
    width: '100%',
    maxWidth: 460,
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: '#722F37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 14,
    elevation: 4,
  },
  continueBtnGradient: {
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  continueBtnDisabled: { opacity: 0.42, shadowOpacity: 0 },
  continueBtnPressed: { opacity: 0.9, transform: [{ scale: 0.99 }] },
  continueTxt: { fontSize: 16, fontWeight: '700', color: '#FFFFFF' },

  progressDots: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
  progressDot: { width: 12, height: 12, borderRadius: 999, backgroundColor: 'rgba(66,66,72,0.18)' },
  progressDotActive: { backgroundColor: '#9AB09A' },
  progressDotComplete: { backgroundColor: 'rgba(154,176,154,0.58)' },
  progressLabel: { marginTop: 6, fontSize: 14, color: 'rgba(45,45,45,0.7)', fontWeight: '600' },
});
