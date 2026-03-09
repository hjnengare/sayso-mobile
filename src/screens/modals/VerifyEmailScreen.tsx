import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { routes } from '../../navigation/routes';
import { Text } from '../../components/Typography';
import { useProfile } from '../../providers/ProfileProvider';

const RESEND_COOLDOWN_SECS = 60;

const C = {
  page: '#E5E0E5',
  wine: '#722F37',
  sage: '#7D9B76',
  charcoal: '#2D2D2D',
  charcoal70: 'rgba(45,45,45,0.70)',
  charcoal60: 'rgba(45,45,45,0.60)',
  charcoal45: 'rgba(45,45,45,0.45)',
  white: '#FFFFFF',
  cardBg: '#9DAB9B',
  errorText: '#C2410C',
  errorBg: 'rgba(254,242,232,0.95)',
  errorBorder: 'rgba(251,146,60,0.35)',
};

function getInboxUrl(email: string): string {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';

  if (domain.includes('gmail')) return 'https://mail.google.com';
  if (domain.includes('outlook') || domain.includes('hotmail') || domain.includes('live')) {
    return 'https://outlook.live.com/mail';
  }
  if (domain.includes('yahoo')) return 'https://mail.yahoo.com';
  if (domain.includes('icloud') || domain.includes('me.com')) return 'https://www.icloud.com/mail';
  if (domain) return `https://${domain}`;

  return 'https://mail.google.com';
}

export default function VerifyEmailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ expired?: string }>();
  const insets = useSafeAreaInsets();
  const { refreshProfile } = useProfile();

  const [pendingEmail, setPendingEmail] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');

  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Entrance animations
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textY = useRef(new Animated.Value(20)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardY = useRef(new Animated.Value(18)).current;
  const actionsOpacity = useRef(new Animated.Value(0)).current;
  const actionsY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    AsyncStorage.getItem('pending_verification_email').then(email => {
      if (email) setPendingEmail(email);
    });

    Animated.parallel([
      Animated.timing(textOpacity, { toValue: 1, delay: 80, duration: 360, useNativeDriver: true }),
      Animated.timing(textY, { toValue: 0, delay: 80, duration: 360, useNativeDriver: true }),
    ]).start();

    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, delay: 180, duration: 360, useNativeDriver: true }),
      Animated.timing(cardY, { toValue: 0, delay: 180, duration: 360, useNativeDriver: true }),
    ]).start();

    Animated.parallel([
      Animated.timing(actionsOpacity, { toValue: 1, delay: 280, duration: 320, useNativeDriver: true }),
      Animated.timing(actionsY, { toValue: 0, delay: 280, duration: 320, useNativeDriver: true }),
    ]).start();

    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function startCooldown() {
    setCooldown(RESEND_COOLDOWN_SECS);
    cooldownRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  const handleResend = useCallback(async () => {
    if (isResending || cooldown > 0 || !pendingEmail) return;

    setError('');
    setResendSuccess(false);
    setIsResending(true);

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: pendingEmail,
      });

      if (resendError) throw resendError;

      setResendSuccess(true);
      startCooldown();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend. Try again.');
    } finally {
      setIsResending(false);
    }
  }, [isResending, cooldown, pendingEmail]);

  // Allows users who verified on a different device to continue
  const handleCheckVerification = useCallback(async () => {
    if (isChecking) return;

    setError('');
    setIsChecking(true);

    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;

      if (data.session) {
        const { data: userData } = await supabase.auth.getUser();

        if (userData.user?.email_confirmed_at) {
          await supabase.auth.refreshSession();
          await refreshProfile();
          return;
        }

        await refreshProfile();
        setError('Email not yet verified. Please check your inbox and click the link.');
      } else {
        setError('No active session. Please sign in again.');
        router.replace(routes.login() as never);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsChecking(false);
    }
  }, [isChecking, refreshProfile, router]);

  const handleOpenInbox = useCallback(async () => {
    if (!pendingEmail) return;

    const url = getInboxUrl(pendingEmail);
    try {
      await Linking.openURL(url);
    } catch {
      setError('Could not open inbox. Please check your mail app manually.');
    }
  }, [pendingEmail]);

  const displayEmail = pendingEmail || 'your email';
  const maskedEmail = useMemo(() => {
    if (!pendingEmail) return 'your email';
    return pendingEmail.replace(/(.{2})(.*)(@.*)/, (_m, p1, p2, p3) => {
      return p1 + '*'.repeat(Math.max(0, p2.length)) + p3;
    });
  }, [pendingEmail]);

  const linkExpired = params.expired === '1';

  return (
    <View style={[styles.root, { backgroundColor: C.page }]}> 
      <Stack.Screen options={{ headerShown: false }} />

      <View style={styles.orbLayer} pointerEvents="none">
        <View style={[styles.orb, styles.orb1]} />
        <View style={[styles.orb, styles.orb2]} />
        <View style={[styles.orb, styles.orb3]} />
      </View>

      <View style={[styles.backWrap, { top: insets.top + 8 }]}> 
        <Pressable onPress={() => router.replace(routes.home() as never)} hitSlop={10} style={styles.backBtn}> 
          <Ionicons name="arrow-back" size={22} color={C.charcoal} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 74, paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.textBlock, { opacity: textOpacity, transform: [{ translateY: textY }] }]}> 
          <Text style={styles.heading}>Check Your Email</Text>
          <Text style={styles.subheading}>
            {linkExpired
              ? 'Your verification link expired. Request a fresh link and continue.'
              : "We've sent a confirmation email to verify your account and unlock full features!"}
          </Text>
        </Animated.View>

        <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ translateY: cardY }] }]}> 
          <View style={styles.mailCircle}>
            <Ionicons name="mail-outline" size={42} color={C.charcoal} />
          </View>

          <Pressable onPress={handleOpenInbox} disabled={!pendingEmail} style={({ pressed }) => [styles.emailBtn, pressed && styles.btnPressed, !pendingEmail && styles.btnDisabled]}> 
            <Text style={styles.emailBtnTxt}>{displayEmail}</Text>
            <Ionicons name="open-outline" size={14} color={C.white} />
          </Pressable>

          <Text style={styles.instructions}>
            Please check your inbox and click the verification link. Once verified, come back here and continue.
          </Text>

          <View style={styles.whyCard}>
            <View style={styles.whyTitleRow}>
              <Ionicons name="checkmark-circle" size={17} color={C.sage} />
              <Text style={styles.whyTitle}>Why verify your email?</Text>
            </View>
            {[
              'Unlock full app features (posting, saving, leaderboards)',
              'Secure account recovery and password resets',
              'Receive important updates and notifications',
              'Build trust within the community',
            ].map(item => (
              <View key={item} style={styles.whyItemRow}>
                <View style={styles.whyDot} />
                <Text style={styles.whyItemTxt}>{item}</Text>
              </View>
            ))}
          </View>

          <Animated.View style={{ opacity: actionsOpacity, transform: [{ translateY: actionsY }] }}>
            <Pressable
              style={({ pressed }) => [styles.resendBtn, pressed && !isResending && cooldown === 0 && styles.btnPressed, (isResending || cooldown > 0) && styles.btnDisabled]}
              onPress={handleResend}
              disabled={isResending || cooldown > 0}
            >
              <LinearGradient
                colors={[C.wine, '#7A404A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.resendBtnGradient}
              >
                <Ionicons name="refresh-outline" size={15} color={C.white} style={{ marginRight: 6 }} />
                <Text style={styles.resendBtnTxt}>
                  {isResending ? 'Sending…' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
                </Text>
              </LinearGradient>
            </Pressable>

            {!!error && (
              <View style={styles.errorBanner}>
                <Ionicons name="alert-circle-outline" size={16} color={C.errorText} />
                <Text style={styles.errorTxt}>{error}</Text>
              </View>
            )}

            {resendSuccess && (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle-outline" size={16} color={C.sage} />
                <Text style={styles.successTxt}>Verification email resent to {maskedEmail}.</Text>
              </View>
            )}

            <Text style={styles.spamHint}>
              Didn&apos;t receive the email? Check your spam folder or try resending.
            </Text>

            <Pressable onPress={handleCheckVerification} disabled={isChecking} style={({ pressed }) => [styles.verifiedLink, pressed && styles.btnPressed]}> 
              <Text style={styles.verifiedLinkTxt}>{isChecking ? 'Checking verification…' : "I've verified my email"}</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>

        <Pressable onPress={() => router.replace(routes.login() as never)} style={styles.backToLogin}> 
          <Text style={styles.backToLoginTxt}>Back to login</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scroll: { paddingHorizontal: 18 },

  orbLayer: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  orb: { position: 'absolute', borderRadius: 999 },
  orb1: { width: 280, height: 280, top: -90, right: -70, backgroundColor: 'rgba(114,47,55,0.09)' },
  orb2: { width: 200, height: 200, top: 220, left: -70, backgroundColor: 'rgba(157,171,155,0.14)' },
  orb3: { width: 150, height: 150, bottom: 80, right: -40, backgroundColor: 'rgba(125,155,118,0.11)' },

  backWrap: { position: 'absolute', left: 16, zIndex: 20 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.56)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  textBlock: {
    marginBottom: 14,
    alignItems: 'center',
  },
  heading: {
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700',
    color: C.charcoal,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  subheading: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 24,
    color: C.charcoal70,
    textAlign: 'center',
  },

  card: {
    width: '100%',
    backgroundColor: C.cardBg,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  mailCircle: {
    width: 84,
    height: 84,
    borderRadius: 999,
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.3)',
    marginBottom: 12,
  },
  emailBtn: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.wine,
    borderRadius: 999,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 14,
  },
  emailBtnTxt: {
    fontSize: 16,
    fontWeight: '600',
    color: C.white,
    textAlign: 'center',
  },
  instructions: {
    fontSize: 13,
    lineHeight: 20,
    color: C.charcoal60,
    textAlign: 'center',
    marginBottom: 14,
  },

  whyCard: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    borderWidth: 1,
    borderColor: 'rgba(125,155,118,0.2)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 12,
    marginBottom: 14,
  },
  whyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  whyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.charcoal,
  },
  whyItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 5,
  },
  whyDot: {
    width: 4,
    height: 4,
    borderRadius: 999,
    marginTop: 7,
    backgroundColor: 'rgba(45,45,45,0.65)',
  },
  whyItemTxt: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: 'rgba(45,45,45,0.8)',
  },

  resendBtn: {
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 10,
    shadowColor: C.wine,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  resendBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  resendBtnTxt: {
    fontSize: 14,
    fontWeight: '700',
    color: C.white,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: C.errorBg,
    borderWidth: 1,
    borderColor: C.errorBorder,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  errorTxt: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: C.errorText,
    lineHeight: 18,
  },

  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(125,155,118,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(125,155,118,0.30)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  successTxt: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: C.sage,
  },

  spamHint: {
    fontSize: 12,
    lineHeight: 17,
    color: C.charcoal60,
    textAlign: 'center',
    marginBottom: 8,
  },
  verifiedLink: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  verifiedLinkTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: C.charcoal60,
    textDecorationLine: 'underline',
  },

  backToLogin: {
    alignSelf: 'center',
    marginTop: 16,
    paddingVertical: 6,
  },
  backToLoginTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: C.charcoal45,
  },

  btnPressed: { opacity: 0.88, transform: [{ scale: 0.98 }] },
  btnDisabled: { opacity: 0.52 },
});
