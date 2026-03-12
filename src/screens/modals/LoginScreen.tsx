import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../../lib/supabase';
import { useAuthSession } from '../../hooks/useSession';
import { routes } from '../../navigation/routes';
import { Text } from '../../components/Typography';

type AuthMode = 'login' | 'register';

type Props = {
  defaultMode?: AuthMode;
};

const GRID = 8;
const MAX_RAIL_WIDTH = 420;
const FIELD_ICON_SIZE = 18;

const C = {
  page: '#E5E0E5',
  card: '#9DAB9B',
  wine: '#722F37',
  coral: '#722F37',
  sage: '#7D9B76',
  charcoal: '#2D2D2D',
  charcoal70: 'rgba(45,45,45,0.7)',
  charcoal60: 'rgba(45,45,45,0.6)',
  charcoal50: 'rgba(45,45,45,0.5)',
  white: '#FFFFFF',
  white70: 'rgba(255,255,255,0.7)',
  inputBg: 'rgba(255,255,255,0.95)',
  inputBorder: 'rgba(255,255,255,0.6)',
  error: '#722F37',
  errorBg: 'rgba(229,224,229,0.95)',
  errorBorder: 'rgba(114,47,55,0.35)',
};

function passwordScore(pw: string): number {
  if (pw.length === 0) return 0;
  if (pw.length < 6) return 1;
  if (pw.length < 8) return 2;
  if (pw.length < 12) return 3;
  return 4;
}

function validateUsername(u: string): string {
  if (!u) return 'Username is required';
  if (u.length < 3) return 'At least 3 characters';
  if (u.length > 20) return 'Max 20 characters';
  if (!/^[a-zA-Z0-9_]+$/.test(u)) return 'Letters, numbers and underscores only';
  return '';
}

function validateEmail(e: string): string {
  if (!e) return 'Email is required';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) return 'Enter a valid email';
  return '';
}

const STRENGTH_LABELS = ['', 'Needs more characters', 'Good', 'Strong', 'Very strong'];
const STRENGTH_COLORS = ['', '#EF4444', '#F59E0B', '#22C55E', '#16A34A'];

export default function LoginScreen({ defaultMode = 'login' }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signInWithPassword, signInWithGoogle } = useAuthSession();

  const [authMode, setAuthMode] = useState<AuthMode>(defaultMode);

  const [username, setUsername] = useState('');
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [email, setEmail] = useState('');
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<'username' | 'email' | 'password' | null>(null);

  const tabAnim = useRef(new Animated.Value(defaultMode === 'login' ? 1 : 0)).current;
  const formOpacity = useRef(new Animated.Value(1)).current;
  const formTranslateY = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(1)).current;
  const titleTranslateY = useRef(new Animated.Value(0)).current;
  const [tabPillWidth, setTabPillWidth] = useState(0);

  const headerEntranceOpacity = useRef(new Animated.Value(0)).current;
  const headerEntranceY = useRef(new Animated.Value(GRID * 2)).current;
  const cardEntranceOpacity = useRef(new Animated.Value(0)).current;
  const cardEntranceY = useRef(new Animated.Value(GRID * 2.5)).current;
  const primaryFocusScale = useRef(new Animated.Value(0.98)).current;

  const switchMode = useCallback((mode: AuthMode) => {
    if (mode === authMode) return;

    Animated.spring(tabAnim, {
      toValue: mode === 'login' ? 1 : 0,
      damping: 20,
      stiffness: 220,
      mass: 0.85,
      useNativeDriver: true,
    }).start();

    Animated.parallel([
      Animated.timing(formOpacity, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(formTranslateY, { toValue: -(GRID * 0.75), duration: 120, useNativeDriver: true }),
      Animated.timing(titleOpacity, { toValue: 0, duration: 110, useNativeDriver: true }),
      Animated.timing(titleTranslateY, { toValue: -(GRID * 0.5), duration: 110, useNativeDriver: true }),
    ]).start(() => {
      setAuthMode(mode);
      setError('');
      formTranslateY.setValue(GRID);
      titleTranslateY.setValue(GRID * 0.5);

      Animated.parallel([
        Animated.timing(formOpacity, { toValue: 1, duration: 180, useNativeDriver: true }),
        Animated.timing(formTranslateY, { toValue: 0, duration: 180, useNativeDriver: true }),
        Animated.timing(titleOpacity, { toValue: 1, duration: 170, useNativeDriver: true }),
        Animated.timing(titleTranslateY, { toValue: 0, duration: 170, useNativeDriver: true }),
      ]).start();
    });
  }, [authMode, formOpacity, formTranslateY, tabAnim, titleOpacity, titleTranslateY]);

  useEffect(() => {
    const easeOut = Easing.out(Easing.cubic);

    Animated.parallel([
      Animated.timing(headerEntranceOpacity, {
        toValue: 1,
        duration: 260,
        easing: easeOut,
        useNativeDriver: true,
      }),
      Animated.timing(headerEntranceY, {
        toValue: 0,
        duration: 260,
        easing: easeOut,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.sequence([
      Animated.delay(70),
      Animated.parallel([
        Animated.timing(cardEntranceOpacity, {
          toValue: 1,
          duration: 280,
          easing: easeOut,
          useNativeDriver: true,
        }),
        Animated.timing(cardEntranceY, {
          toValue: 0,
          duration: 280,
          easing: easeOut,
          useNativeDriver: true,
        }),
      ]),
      Animated.spring(primaryFocusScale, {
        toValue: 1,
        damping: 18,
        stiffness: 230,
        mass: 0.9,
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardEntranceOpacity, cardEntranceY, headerEntranceOpacity, headerEntranceY, primaryFocusScale]);

  const isRegister = authMode === 'register';

  const usernameError = usernameTouched ? validateUsername(username) : '';
  const emailError = emailTouched ? validateEmail(email) : '';
  const pwScore = passwordScore(password);
  const usernameIsValid = isRegister && usernameTouched && !!username && !usernameError;
  const emailIsValid = emailTouched && !!email && !emailError;
  const passwordHasState = isRegister ? password.length > 0 : passwordTouched && password.length > 0;

  const isFormValid = isRegister
    ? !validateUsername(username) && !validateEmail(email) && pwScore >= 3 && consent
    : email.length > 0 && password.length > 0;

  const handleBack = useCallback(() => {
    router.push(routes.onboarding() as never);
  }, [router]);

  const handleSubmit = useCallback(async () => {
    if (!isFormValid || isSubmitting) return;
    setError('');
    setIsSubmitting(true);

    try {
      if (isRegister) {
        const emailRedirectTo = Linking.createURL('/auth/callback');
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
              account_type: 'user',
            },
            emailRedirectTo,
          },
        });
        if (signUpError) throw signUpError;

        await AsyncStorage.setItem('pending_verification_email', email);
        router.replace(routes.verifyEmail() as never);
        return;
      }

      await signInWithPassword(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setIsSubmitting(false);
    }
  }, [email, isFormValid, isRegister, isSubmitting, password, router, signInWithPassword, username]);

  const handleGoogle = useCallback(async () => {
    if (isGoogleLoading) return;
    setError('');
    setIsGoogleLoading(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in failed.');
      setIsGoogleLoading(false);
    }
  }, [isGoogleLoading, signInWithGoogle]);

  return (
    <View style={[styles.root, { backgroundColor: C.page }]}>
      <View style={[styles.backBtnWrap, { top: insets.top + GRID * 1.5 }]}>
        <Pressable style={styles.backBtn} onPress={handleBack} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={C.charcoal} />
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + GRID * 9,
              paddingBottom: insets.bottom + GRID * 4,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.rail}>
            <Animated.View
              style={{
                opacity: headerEntranceOpacity,
                transform: [{ translateY: headerEntranceY }],
              }}
            >
              <Animated.View style={[styles.titleBlock, { opacity: titleOpacity, transform: [{ translateY: titleTranslateY }] }]}>
                <Text style={styles.title}>{isRegister ? 'Create Your Account' : 'Welcome Back'}</Text>
                <Text style={styles.subtitle}>
                  {isRegister
                    ? 'Sign up today to share honest reviews and discover trusted businesses.'
                    : 'Sign in to continue discovering sayso.'}
                </Text>
              </Animated.View>
            </Animated.View>

            <Animated.View
              style={[
                styles.cardWrap,
                {
                  opacity: cardEntranceOpacity,
                  transform: [{ translateY: cardEntranceY }],
                },
              ]}
            >
              <LinearGradient
                colors={[C.card, C.card, 'rgba(157,171,155,0.95)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.card}
              >
                <View style={styles.tabRow}>
                  <View
                    style={styles.tabPill}
                    onLayout={(e) => setTabPillWidth(e.nativeEvent.layout.width)}
                  >
                    {tabPillWidth > 0 ? (
                      <Animated.View
                        style={[
                          styles.tabIndicator,
                          {
                            width: (tabPillWidth - GRID) / 2,
                            transform: [
                              {
                                translateX: tabAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0, (tabPillWidth - GRID) / 2],
                                }),
                              },
                            ],
                          },
                        ]}
                      />
                    ) : null}
                    {(['register', 'login'] as AuthMode[]).map((mode) => (
                      <Pressable key={mode} style={styles.tabBtn} onPress={() => switchMode(mode)}>
                        <Text style={[styles.tabTxt, authMode === mode && styles.tabTxtActive]}>
                          {mode === 'register' ? 'Register' : 'Login'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>

                <Animated.View style={{ opacity: formOpacity, transform: [{ translateY: formTranslateY }] }}>
                  {error ? (
                    <View style={styles.errorBanner}>
                      <Ionicons name="alert-circle" size={16} color={C.error} />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  ) : null}

                  {isRegister ? (
                    <View style={styles.fieldWrap}>
                      <Text style={styles.fieldLabel}>Username</Text>
                      <View
                        style={[
                          styles.inputRow,
                          focusedField === 'username' ? styles.inputRowFocused : null,
                          usernameError ? styles.inputRowError : null,
                        ]}
                      >
                        <Ionicons
                          name={usernameError ? 'alert-circle' : usernameIsValid ? 'checkmark-circle' : 'person'}
                          size={FIELD_ICON_SIZE}
                          color={usernameError
                            ? C.wine
                            : usernameIsValid
                              ? C.sage
                              : focusedField === 'username'
                                ? C.sage
                                : C.charcoal60}
                          style={styles.inputLeftIcon}
                        />
                        <TextInput
                          style={[styles.input, username ? styles.inputFilled : null]}
                          value={username}
                          onChangeText={setUsername}
                          onFocus={() => setFocusedField('username')}
                          onBlur={() => {
                            setFocusedField(null);
                            setUsernameTouched(true);
                          }}
                          placeholder="e.g. johndoe"
                          placeholderTextColor={C.charcoal50}
                          autoCapitalize="none"
                          autoCorrect={false}
                          autoComplete="username-new"
                          returnKeyType="next"
                        />
                      </View>
                      {usernameError ? <Text style={styles.fieldError}>{usernameError}</Text> : null}
                    </View>
                  ) : null}

                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>Email</Text>
                    <View
                      style={[
                        styles.inputRow,
                        focusedField === 'email' ? styles.inputRowFocused : null,
                        emailError ? styles.inputRowError : null,
                      ]}
                    >
                      <Ionicons
                        name={emailError ? 'alert-circle' : emailIsValid ? 'checkmark-circle' : 'mail'}
                        size={FIELD_ICON_SIZE}
                        color={emailError
                          ? C.wine
                          : emailIsValid
                            ? C.sage
                            : focusedField === 'email'
                              ? C.sage
                              : C.charcoal60}
                        style={styles.inputLeftIcon}
                      />
                      <TextInput
                        style={[styles.input, email ? styles.inputFilled : null]}
                        value={email}
                        onChangeText={setEmail}
                        onFocus={() => setFocusedField('email')}
                        onBlur={() => {
                          setFocusedField(null);
                          setEmailTouched(true);
                        }}
                        placeholder="you@example.com"
                        placeholderTextColor={C.charcoal50}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete="email"
                        returnKeyType="next"
                      />
                    </View>
                    {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}
                  </View>

                  <View style={styles.fieldWrap}>
                    <Text style={styles.fieldLabel}>Password</Text>
                    <View style={[styles.inputRow, focusedField === 'password' ? styles.inputRowFocused : null]}>
                      <Ionicons
                        name={
                          !passwordHasState
                            ? 'lock-closed'
                            : pwScore >= 3
                              ? 'checkmark-circle'
                              : 'alert-circle'
                        }
                        size={FIELD_ICON_SIZE}
                        color={!passwordHasState
                          ? focusedField === 'password'
                            ? C.sage
                            : C.charcoal60
                          : pwScore >= 3
                            ? C.sage
                            : '#F59E0B'}
                        style={styles.inputLeftIcon}
                      />
                      <TextInput
                        style={[styles.input, password ? styles.inputFilled : null, styles.passwordInput]}
                        value={password}
                        onChangeText={setPassword}
                        placeholder={isRegister ? 'Create a password' : 'Enter your password'}
                        placeholderTextColor={C.charcoal50}
                        secureTextEntry={!passwordVisible}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => {
                          setFocusedField(null);
                          setPasswordTouched(true);
                        }}
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoComplete={isRegister ? 'new-password' : 'current-password'}
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit}
                      />
                      <Pressable style={styles.eyeBtn} onPress={() => setPasswordVisible((v) => !v)} hitSlop={8}>
                        <Ionicons name={passwordVisible ? 'eye-off' : 'eye'} size={FIELD_ICON_SIZE} color={C.charcoal60} />
                      </Pressable>
                    </View>
                    {isRegister && password.length > 0 ? (
                      <View style={styles.strengthWrap}>
                        <View style={styles.strengthBars}>
                          {[1, 2, 3, 4].map((i) => (
                            <View
                              key={i}
                              style={[
                                styles.strengthBar,
                                { backgroundColor: i <= pwScore ? STRENGTH_COLORS[pwScore] : 'rgba(45,45,45,0.16)' },
                              ]}
                            />
                          ))}
                        </View>
                        <Text style={[styles.strengthLabel, { color: STRENGTH_COLORS[pwScore] || C.charcoal50 }]}>
                          {STRENGTH_LABELS[pwScore] ?? ''}
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  {!isRegister ? (
                    <Pressable onPress={() => router.push(routes.forgotPassword() as never)} style={styles.forgotWrap}>
                      <Text style={styles.forgotText}>Forgot password?</Text>
                    </Pressable>
                  ) : null}

                  {isRegister ? (
                    <Pressable style={styles.consentRow} onPress={() => setConsent((v) => !v)}>
                      <View style={[styles.checkbox, consent ? styles.checkboxChecked : null]}>
                        {consent ? <Ionicons name="checkmark" size={12} color={C.white} /> : null}
                      </View>
                      <Text style={styles.consentText}>
                        I agree to the{' '}
                        <Text style={styles.consentLink} onPress={() => router.push(routes.terms() as never)}>
                          Terms of Use
                        </Text>
                        {' '}and{' '}
                        <Text style={styles.consentLink} onPress={() => router.push(routes.privacy() as never)}>
                          Privacy Policy
                        </Text>
                      </Text>
                    </Pressable>
                  ) : null}

                  <Animated.View style={{ transform: [{ scale: primaryFocusScale }] }}>
                    <Pressable
                      style={({ pressed }) => [
                        styles.submitBtn,
                        (!isFormValid || isSubmitting) ? styles.submitBtnDisabled : null,
                        pressed && isFormValid ? styles.submitBtnPressed : null,
                      ]}
                      onPress={handleSubmit}
                      disabled={!isFormValid || isSubmitting}
                    >
                      <LinearGradient
                        colors={[C.coral, 'rgba(114,47,55,0.8)']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.submitBtnGradient}
                      >
                        <Text style={styles.submitTxt}>
                          {isSubmitting
                            ? isRegister ? 'Creating account…' : 'Signing in…'
                            : isRegister ? 'Create account' : 'Sign in'}
                        </Text>
                      </LinearGradient>
                    </Pressable>
                  </Animated.View>

                  <View style={styles.dividerRow}>
                    <View style={styles.dividerLine} />
                    <Text style={styles.dividerText}>or continue with</Text>
                    <View style={styles.dividerLine} />
                  </View>

                  <Pressable
                    style={({ pressed }) => [
                      styles.googleBtn,
                      pressed ? styles.googleBtnPressed : null,
                      isGoogleLoading ? styles.submitBtnDisabled : null,
                    ]}
                    onPress={handleGoogle}
                    disabled={isGoogleLoading}
                  >
                    {isGoogleLoading ? (
                      <Text style={styles.googleTxt}>Connecting…</Text>
                    ) : (
                      <>
                        <Ionicons name="logo-google" size={18} color="#DB4437" />
                        <Text style={styles.googleTxt}>Google</Text>
                      </>
                    )}
                  </Pressable>

                  <View style={styles.switchRow}>
                    <Text style={styles.switchText}>
                      {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                    </Text>
                    <Pressable onPress={() => switchMode(isRegister ? 'login' : 'register')}>
                      <Text style={styles.switchLink}>{isRegister ? 'Log in' : 'Sign up'}</Text>
                    </Pressable>
                  </View>
                </Animated.View>
              </LinearGradient>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },

  scroll: {
    paddingHorizontal: GRID * 2,
    alignItems: 'center',
  },

  rail: {
    width: '100%',
    maxWidth: MAX_RAIL_WIDTH,
    gap: GRID * 3,
  },

  backBtnWrap: {
    position: 'absolute',
    left: GRID * 2,
    zIndex: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(45,45,45,0.08)',
  },

  titleBlock: {
    alignItems: 'center',
    gap: GRID,
    paddingHorizontal: GRID,
  },
  title: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: '700',
    color: C.charcoal,
    textAlign: 'center',
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: C.charcoal70,
    textAlign: 'center',
    fontWeight: '400',
  },

  cardWrap: {
    width: '100%',
  },
  card: {
    width: '100%',
    backgroundColor: C.card,
    borderRadius: 12,
    paddingHorizontal: GRID,
    paddingVertical: GRID * 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },

  tabRow: {
    alignItems: 'center',
    marginBottom: GRID * 3,
  },
  tabPill: {
    width: '100%',
    flexDirection: 'row',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.16)',
    padding: GRID * 0.5,
    overflow: 'hidden',
  },
  tabIndicator: {
    position: 'absolute',
    top: GRID * 0.5,
    bottom: GRID * 0.5,
    left: GRID * 0.5,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: GRID * 1.25,
    zIndex: 1,
  },
  tabTxt: {
    fontSize: 13,
    fontWeight: '600',
    color: C.white70,
  },
  tabTxtActive: {
    color: C.charcoal,
  },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GRID,
    backgroundColor: C.errorBg,
    borderWidth: 1,
    borderColor: C.errorBorder,
    borderRadius: GRID * 1.5,
    padding: GRID * 1.5,
    marginBottom: GRID * 2,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: C.error,
    lineHeight: 18,
  },

  fieldWrap: {
    marginBottom: GRID * 2,
  },
  fieldLabel: {
    marginBottom: GRID,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.93)',
  },
  inputRow: {
    position: 'relative',
    minHeight: GRID * 7,
    justifyContent: 'center',
    borderRadius: 999,
    backgroundColor: C.inputBg,
    borderWidth: 1,
    borderColor: C.inputBorder,
  },
  inputRowError: {
    borderColor: C.wine,
  },
  inputRowFocused: {
    borderColor: C.wine,
    shadowColor: C.wine,
    shadowOpacity: 0.16,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
    elevation: 2,
  },
  inputLeftIcon: {
    position: 'absolute',
    left: GRID * 2,
    top: '50%',
    marginTop: -(FIELD_ICON_SIZE / 2),
    zIndex: 2,
  },
  input: {
    paddingLeft: GRID * 5.75,
    paddingRight: GRID * 2.5,
    paddingVertical: GRID * 1.75,
    fontSize: 16,
    color: C.charcoal,
    fontFamily: 'Urbanist_400Regular',
    borderRadius: 999,
  },
  inputFilled: {
    fontFamily: 'Urbanist_600SemiBold',
  },
  fieldError: {
    marginTop: GRID * 0.5,
    fontSize: 12,
    fontWeight: '600',
    color: '#FDE2D5',
  },

  passwordInput: {
    paddingRight: GRID * 6,
  },
  eyeBtn: {
    position: 'absolute',
    right: GRID * 1.75,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },

  strengthWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GRID,
    marginTop: GRID,
  },
  strengthBars: {
    flex: 1,
    flexDirection: 'row',
    gap: GRID * 0.5,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    borderRadius: 999,
  },
  strengthLabel: {
    width: 78,
    textAlign: 'right',
    fontSize: 12,
    fontWeight: '600',
  },

  forgotWrap: {
    alignItems: 'flex-end',
    marginBottom: GRID * 2,
  },
  forgotText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  consentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: GRID * 1.25,
    marginBottom: GRID * 2,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  checkboxChecked: {
    backgroundColor: C.sage,
    borderColor: C.sage,
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.86)',
    fontWeight: '400',
  },
  consentLink: {
    fontWeight: '600',
    color: '#FFFFFF',
    textDecorationLine: 'underline',
  },

  submitBtn: {
    borderRadius: 999,
    overflow: 'hidden',
    shadowColor: C.wine,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 6,
  },
  submitBtnGradient: {
    minHeight: GRID * 7,
    paddingVertical: GRID * 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  submitBtnDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  submitTxt: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GRID,
    marginVertical: GRID * 2,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.28)',
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.8)',
  },

  googleBtn: {
    minHeight: GRID * 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: GRID * 1.25,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderWidth: 0,
  },
  googleBtnPressed: {
    opacity: 0.92,
  },
  googleTxt: {
    fontSize: 14,
    fontWeight: '600',
    color: C.charcoal,
  },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: GRID * 2.5,
    paddingTop: GRID * 2,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
  },
  switchText: {
    fontSize: 14,
    color: C.white,
    fontWeight: '400',
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
