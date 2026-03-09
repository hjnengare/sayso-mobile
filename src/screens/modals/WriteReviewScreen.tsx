import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, apiFetch } from '../../lib/api';
import { Text, TextInput } from '../../components/Typography';
import { StackPageHeader } from '../../components/StackPageHeader';
import { useAuth } from '../../providers/AuthProvider';
import { useSecurity } from '../../providers/SecurityProvider';
import { useBusinessDetail } from '../../hooks/useBusinessDetail';
import { useBusinessReviews, type ReviewItem } from '../../hooks/useBusinessReviews';
import { useEventSpecialDetail } from '../../hooks/useEventSpecialDetail';
import { useEventReviews, type EventReviewItem } from '../../hooks/useEventReviews';
import { useGlobalScrollToTop } from '../../hooks/useGlobalScrollToTop';
import { useRealtimeQueryInvalidation } from '../../hooks/useRealtimeQueryInvalidation';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import type { WriteReviewParams } from '../../navigation/types';
import { NAVBAR_BG_COLOR, CARD_BG_COLOR } from '../../styles/colors';
import { getBusinessPlaceholder } from '../../lib/businessPlaceholders';
import { BusinessHeroCarousel } from '../../components/business-detail';
import { normalizeBusinessRating } from '../../components/business-detail/utils';
import { businessDetailColors } from '../../components/business-detail/styles';
import { ScrollToTopFab } from '../../components/ScrollToTopFab';

// ─── Constants
const MIN_CHARS = 10;
const MAX_CHARS = 5000;
const MAX_TITLE_CHARS = 200;
const MAX_PHOTOS = 2;
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HERO_WIDTH = SCREEN_WIDTH - 16; // matches page inline padding (px-2)
const HERO_HEIGHT = Math.round(SCREEN_HEIGHT * 0.50); // matches web h-[50vh]

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

const WRITING_PROMPTS = [
  'What did you enjoy most?',
  'How was the service?',
  'Would you recommend this place?',
  'Any tips for others?',
];

const FALLBACK_TAGS = ['Trustworthy', 'On Time', 'Friendly', 'Good Value'];

const REVIEW_ERROR_MESSAGES: Record<string, string> = {
  NOT_AUTHENTICATED: 'You can post as Anonymous, or sign in for a verified profile review.',
  MISSING_FIELDS: 'Please fill in all required fields.',
  INVALID_RATING: 'Please select a rating (1–5 stars).',
  CONTENT_TOO_SHORT: 'Your review is too short. Please write at least 10 characters.',
  VALIDATION_FAILED: 'Please check your review and try again.',
  CONTENT_MODERATION_FAILED: "Your review contains content that doesn't meet our guidelines.",
  EVENT_NOT_FOUND: "We couldn't find that event. It may have been removed.",
  SPECIAL_NOT_FOUND: "We couldn't find that special. It may have expired.",
  DUPLICATE_ANON_REVIEW: 'You already posted an anonymous review for this item on this device.',
  RATE_LIMITED: 'Too many anonymous reviews in a short time. Please try again later.',
  SPAM_DETECTED: 'This review was flagged as spam-like. Please adjust wording and try again.',
  DB_ERROR: "We couldn't save your review. Please try again.",
  SERVER_ERROR: 'Something went wrong on our side. Please try again.',
};

function getErrorMessage(result: { message?: string; code?: string; error?: string }): string {
  if (result.message) return result.message;
  if (result.code && REVIEW_ERROR_MESSAGES[result.code]) return REVIEW_ERROR_MESSAGES[result.code];
  if (result.error) return result.error;
  return 'An error occurred. Please try again.';
}

function isPlaceholderImage(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return (
    url.includes('businessImagePlaceholders/') ||
    url.includes('assets/businessImagePlaceholders/')
  );
}

// ─── Colors — brand tokens from src/styles/colors.ts; rest derived inline
const C = {
  offWhite: '#E5E0E5',
  charcoal: '#2D2D2D',
  charcoal60: 'rgba(45,45,45,0.60)',
  charcoal45: 'rgba(45,45,45,0.45)',
  charcoal30: 'rgba(45,45,45,0.30)',
  charcoal10: 'rgba(45,45,45,0.10)',
  coral: NAVBAR_BG_COLOR,   // navbar-bg #722F37
  sage: CARD_BG_COLOR,      // card-bg   #9DAB9B
  white: '#FFFFFF',
  amber: '#F5D547',
  sageBorder: 'rgba(125,155,118,0.10)',
  cardBg: CARD_BG_COLOR,
  errorBg: 'rgba(114,47,55,0.08)',
  errorBorder: 'rgba(114,47,55,0.25)',
};

// ─── Divider
function Divider() {
  return <View style={{ height: 1, backgroundColor: 'rgba(45,45,45,0.08)', marginVertical: 4 }} />;
}

// ─── Hero Image Carousel
function ReviewHeroCarousel({ images, name, subcategorySlug }: { images: string[]; name: string; subcategorySlug?: string | null }) {
  const reducedMotion = useReducedMotion();
  const scrollRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [imgErrors, setImgErrors] = useState<Record<number, boolean>>({});

  const validImages = images.filter((img) => img && img.trim() !== '' && !isPlaceholderImage(img));
  const total = validImages.length;

  if (total === 0) {
    const placeholder = getBusinessPlaceholder(subcategorySlug);
    return (
      <View style={carouselStyles.container}>
        {/* blurred bg layer — same as real images */}
        <Image source={placeholder} style={carouselStyles.bgImage} blurRadius={20} />
        <Image source={placeholder} style={carouselStyles.fgImage} resizeMode="cover" />
      </View>
    );
  }

  const goTo = (index: number) => {
    const clamped = Math.max(0, Math.min(index, total - 1));
    scrollRef.current?.scrollTo({ x: clamped * HERO_WIDTH, animated: !reducedMotion });
    setCurrentIndex(clamped);
  };

  const handleScroll = (e: { nativeEvent: { contentOffset: { x: number } } }) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / HERO_WIDTH);
    setCurrentIndex(Math.max(0, Math.min(index, total - 1)));
  };

  return (
    <View style={carouselStyles.container}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        scrollEnabled={total > 1}
      >
        {validImages.map((uri, i) => (
          <View key={i} style={carouselStyles.slide}>
            {!imgErrors[i] && (
              <Image
                source={{ uri }}
                style={carouselStyles.bgImage}
                blurRadius={20}
                onError={() => setImgErrors((prev) => ({ ...prev, [i]: true }))}
              />
            )}
            {imgErrors[i] ? (
              <View style={carouselStyles.errorState}>
                <Ionicons name="image-outline" size={40} color="rgba(45,45,45,0.30)" />
                <Text style={carouselStyles.errorText}>Image unavailable</Text>
              </View>
            ) : (
              <Image source={{ uri }} style={carouselStyles.fgImage} resizeMode="cover" />
            )}
          </View>
        ))}
      </ScrollView>

      {total > 1 && (
        <>
          <Pressable style={[carouselStyles.navBtn, carouselStyles.navBtnLeft]} onPress={() => goTo(currentIndex - 1)}>
            <Ionicons name="chevron-back" size={22} color={C.charcoal} />
          </Pressable>
          <Pressable style={[carouselStyles.navBtn, carouselStyles.navBtnRight]} onPress={() => goTo(currentIndex + 1)}>
            <Ionicons name="chevron-forward" size={22} color={C.charcoal} />
          </Pressable>
          <View style={carouselStyles.dotsRow}>
            {validImages.map((_, i) => (
              <Pressable key={i} onPress={() => goTo(i)}>
                <View style={[carouselStyles.dot, i === currentIndex && carouselStyles.dotActive]} />
              </Pressable>
            ))}
          </View>
          <View style={carouselStyles.counterPill}>
            <Text style={carouselStyles.counterText}>{currentIndex + 1} / {total}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const carouselStyles = StyleSheet.create({
  container: {
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
    borderWidth: 1,
    borderColor: 'rgba(125,155,118,0.12)',
    backgroundColor: C.cardBg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    overflow: 'hidden',
  },
  slide: {
    width: HERO_WIDTH,
    height: HERO_HEIGHT,
    overflow: 'hidden',
  },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6,
  },
  fgImage: {
    ...StyleSheet.absoluteFillObject,
  },
  navBtn: {
    position: 'absolute',
    top: HERO_HEIGHT / 2 - 22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  navBtnLeft: { left: 12 },
  navBtnRight: { right: 12 },
  dotsRow: {
    position: 'absolute',
    bottom: 14,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: {
    width: 28,
    borderRadius: 4,
    backgroundColor: C.white,
  },
  counterPill: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(45,45,45,0.80)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  counterText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.white,
  },
  errorState: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.charcoal10,
  },
  errorText: {
    fontSize: 12,
    color: 'rgba(45,45,45,0.45)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});

// ─── Animated writing tip (matches web: opacity + y slide, AnimatePresence mode="wait")
function AnimatedTip({ promptIndex, reducedMotion }: { promptIndex: number; reducedMotion: boolean }) {
  const opacity = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const [visibleIndex, setVisibleIndex] = useState(promptIndex);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) { isFirst.current = false; return; }
    if (reducedMotion) { setVisibleIndex(promptIndex); return; }

    // Exit: fade out + slide up (web: opacity 0, y -8, 300ms)
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -8, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      setVisibleIndex(promptIndex);
      translateY.setValue(8); // reset to entry position (web: initial y 8)
      // Enter: fade in + slide to rest (web: opacity 1, y 0, 300ms)
      Animated.parallel([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  }, [promptIndex]);

  return (
    <Animated.View style={[styles.tipOverlay, { opacity, transform: [{ translateY }] }]} pointerEvents="none">
      <Ionicons name="bulb-outline" size={14} color={C.coral} style={{ opacity: 0.6 }} />
      <Text style={styles.tipText}>Tip: {WRITING_PROMPTS[visibleIndex]}</Text>
    </Animated.View>
  );
}

// ─── Rating selector
function RatingSelector({
  value, onChange, disabled,
}: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const reducedMotion = useReducedMotion();

  // Animated label (matches web: AnimatePresence mode="wait", key=displayRating)
  const labelOpacity = useRef(new Animated.Value(1)).current;
  const labelTranslateY = useRef(new Animated.Value(0)).current;
  const labelScale = useRef(new Animated.Value(1)).current;
  const [visibleRating, setVisibleRating] = useState(value);
  const isFirstRating = useRef(true);

  useEffect(() => {
    if (isFirstRating.current) { isFirstRating.current = false; setVisibleRating(value); return; }
    if (reducedMotion) { setVisibleRating(value); return; }
    // Exit: opacity 0, y +8, scale 0.9 (web: initial exit)
    Animated.parallel([
      Animated.timing(labelOpacity, { toValue: 0, duration: 100, useNativeDriver: true }),
      Animated.timing(labelTranslateY, { toValue: 8, duration: 100, useNativeDriver: true }),
      Animated.timing(labelScale, { toValue: 0.9, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      setVisibleRating(value);
      labelTranslateY.setValue(-8); // enter from above
      Animated.parallel([
        Animated.timing(labelOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(labelTranslateY, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(labelScale, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  }, [value]);

  // Per-star press scale + active-star wiggle
  const starScales = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(1))).current;
  const starRotates = useRef([0, 1, 2, 3, 4].map(() => new Animated.Value(0))).current;

  const handleStarPress = (i: number) => {
    if (disabled) return;
    onChange(i);
    if (!reducedMotion) {
      Animated.sequence([
        Animated.timing(starRotates[i - 1], { toValue: -10, duration: 80, useNativeDriver: true }),
        Animated.timing(starRotates[i - 1], { toValue: 10, duration: 80, useNativeDriver: true }),
        Animated.timing(starRotates[i - 1], { toValue: 0, duration: 80, useNativeDriver: true }),
      ]).start();
    }
  };

  const label = visibleRating > 0 ? RATING_LABELS[visibleRating] : null;

  return (
    <View style={rStyles.wrap}>
      <Text style={rStyles.heading}>How was your experience?</Text>
      <Animated.View style={[rStyles.labelSlot, { opacity: labelOpacity, transform: [{ translateY: labelTranslateY }, { scale: labelScale }] }]}>
        {label ? (
          <View style={rStyles.labelPill}><Text style={rStyles.labelText}>{label}</Text></View>
        ) : (
          <Text style={rStyles.tapHint}>Tap a star to rate</Text>
        )}
      </Animated.View>
      <View style={rStyles.starsRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Animated.View key={i} style={{ transform: [{ scale: starScales[i - 1] }, { rotate: starRotates[i - 1].interpolate({ inputRange: [-10, 0, 10], outputRange: ['-10deg', '0deg', '10deg'] }) }] }}>
            <Pressable
              onPress={() => handleStarPress(i)}
              onPressIn={() => !reducedMotion && Animated.timing(starScales[i - 1], { toValue: 0.9, duration: 80, useNativeDriver: true }).start()}
              onPressOut={() => !reducedMotion && Animated.timing(starScales[i - 1], { toValue: 1, duration: 120, useNativeDriver: true }).start()}
              style={rStyles.starBtn}
              accessibilityRole="button"
              accessibilityLabel={`Rate ${i} star${i !== 1 ? 's' : ''}`}
            >
              <Ionicons name={i <= value ? 'star' : 'star-outline'} size={42} color={i <= value ? C.amber : C.charcoal30} />
            </Pressable>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}
const rStyles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10, paddingVertical: 4 },
  heading: { fontSize: 16, fontWeight: '600', color: C.charcoal },
  tapHint: { fontSize: 14, color: C.charcoal60 },
  labelPill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 999, backgroundColor: C.charcoal10 },
  labelText: { fontSize: 16, fontWeight: '700', color: C.charcoal },
  labelSlot: { minHeight: 30, alignItems: 'center', justifyContent: 'center' },
  starsRow: { flexDirection: 'row', gap: 4, marginTop: 4 },
  starBtn: { padding: 6 },
});

// ─── Tag selector
function TagSelector({
  tags, selected, onToggle, disabled,
}: { tags: string[]; selected: string[]; onToggle: (tag: string) => void; disabled?: boolean }) {
  const reducedMotion = useReducedMotion();
  const maxReached = selected.length >= 4;

  // Per-tag animated values (entrance + icon swap)
  const tagAnimsRef = useRef(new Map<string, { opacity: Animated.Value; scale: Animated.Value; iconScale: Animated.Value; iconRotate: Animated.Value }>()).current;

  const getTagAnim = (tag: string) => {
    if (!tagAnimsRef.has(tag)) {
      tagAnimsRef.set(tag, {
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0.8),
        iconScale: new Animated.Value(1),
        iconRotate: new Animated.Value(0),
      });
    }
    return tagAnimsRef.get(tag)!;
  };

  // Entrance stagger when tags array changes
  useEffect(() => {
    const anims = tags.map((tag, index) => {
      const anim = getTagAnim(tag);
      if (reducedMotion) {
        anim.opacity.setValue(1);
        anim.scale.setValue(1);
        return null;
      }
      anim.opacity.setValue(0);
      anim.scale.setValue(0.8);
      return Animated.sequence([
        Animated.delay(index * 30),
        Animated.parallel([
          Animated.timing(anim.opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(anim.scale, { toValue: 1, duration: 200, useNativeDriver: true }),
        ]),
      ]);
    }).filter(Boolean) as Animated.CompositeAnimation[];
    if (anims.length) Animated.parallel(anims).start();
  }, [tags]);

  // Animate icon on toggle
  const handleToggle = (tag: string) => {
    const isOn = selected.includes(tag);
    if (disabled || (!isOn && maxReached)) return;
    const anim = getTagAnim(tag);
    if (!reducedMotion) {
      Animated.timing(anim.iconScale, { toValue: 0, duration: 80, useNativeDriver: true }).start(() => {
        onToggle(tag);
        const willBeOn = !isOn;
        anim.iconRotate.setValue(willBeOn ? -180 : 0);
        Animated.parallel([
          Animated.timing(anim.iconScale, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(anim.iconRotate, { toValue: 0, duration: 150, useNativeDriver: true }),
        ]).start();
      });
    } else {
      onToggle(tag);
    }
  };

  // Remove hint slide-in
  const removeHintOpacity = useRef(new Animated.Value(0)).current;
  const removeHintTranslateY = useRef(new Animated.Value(-8)).current;
  const wasMaxReached = useRef(false);

  useEffect(() => {
    if (maxReached && !wasMaxReached.current) {
      wasMaxReached.current = true;
      if (reducedMotion) {
        removeHintOpacity.setValue(1);
        removeHintTranslateY.setValue(0);
      } else {
        removeHintOpacity.setValue(0);
        removeHintTranslateY.setValue(-8);
        Animated.parallel([
          Animated.timing(removeHintOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
          Animated.timing(removeHintTranslateY, { toValue: 0, duration: 200, useNativeDriver: true }),
        ]).start();
      }
    } else if (!maxReached) {
      wasMaxReached.current = false;
      removeHintOpacity.setValue(0);
      removeHintTranslateY.setValue(-8);
    }
  }, [maxReached]);

  return (
    <View style={tStyles.section}>
      <View style={tStyles.header}>
        <View style={tStyles.headerLeft}>
          <Ionicons name="sparkles" size={16} color={C.coral} style={{ opacity: 0.8 }} />
          <Text style={tStyles.heading}>Quick tags</Text>
        </View>
        <View style={[tStyles.counterPill, selected.length > 0 && tStyles.counterPillActive]}>
          <Text style={[tStyles.counterText, selected.length > 0 && tStyles.counterTextActive]}>
            {selected.length}/4 selected
          </Text>
        </View>
      </View>
      <View style={tStyles.wrap}>
        {tags.map((tag) => {
          const isOn = selected.includes(tag);
          const isDisabled = disabled || (!isOn && maxReached);
          const anim = getTagAnim(tag);
          return (
            <Animated.View key={tag} style={{ opacity: anim.opacity, transform: [{ scale: anim.scale }] }}>
              <Pressable
                onPress={() => handleToggle(tag)}
                style={[tStyles.pill, isOn && tStyles.pillOn, isDisabled && !isOn && tStyles.pillDim]}
              >
                <Animated.View style={{ transform: [{ scale: anim.iconScale }, { rotate: anim.iconRotate.interpolate({ inputRange: [-180, 0], outputRange: ['-180deg', '0deg'] }) }] }}>
                  <Ionicons
                    name={isOn ? 'checkmark' : 'add'}
                    size={13}
                    color={isOn ? C.coral : isDisabled ? C.charcoal30 : C.charcoal60}
                    style={{ opacity: isOn ? 1 : 0.6 }}
                  />
                </Animated.View>
                <Text style={[tStyles.pillText, isOn && tStyles.pillTextOn, isDisabled && !isOn && tStyles.pillTextDim]}>
                  {tag}
                </Text>
              </Pressable>
            </Animated.View>
          );
        })}
      </View>
      {maxReached ? (
        <Animated.Text style={[tStyles.removeHint, { opacity: removeHintOpacity, transform: [{ translateY: removeHintTranslateY }] }]}>
          Tap a selected tag to remove it
        </Animated.Text>
      ) : null}
    </View>
  );
}
const tStyles = StyleSheet.create({
  section: { gap: 12 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 4 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heading: { fontSize: 16, fontWeight: '600', color: C.charcoal },
  counterPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: C.charcoal10 },
  counterPillActive: { backgroundColor: 'rgba(114,47,55,0.15)' },
  counterText: { fontSize: 13, color: C.charcoal60 },
  counterTextActive: { color: C.coral },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 999, backgroundColor: C.charcoal10, borderWidth: 2, borderColor: 'rgba(45,45,45,0.20)',
  },
  pillOn: { backgroundColor: 'rgba(114,47,55,0.20)', borderColor: C.coral },
  pillDim: { opacity: 0.4 },
  pillText: { fontSize: 14, fontWeight: '600', color: 'rgba(45,45,45,0.70)' },
  pillTextOn: { color: C.charcoal },
  pillTextDim: { color: C.charcoal30 },
  removeHint: { fontSize: 13, color: C.charcoal60, textAlign: 'center', marginTop: 4 },
});

// ─── Community review card
type CommunityReview = {
  id: string;
  userName: string;
  avatarUrl?: string | null;
  rating: number;
  text: string;
  date: string;
};

function CommunityReviewCard({ review }: { review: CommunityReview }) {
  const [avatarError, setAvatarError] = useState(false);
  return (
    <View style={crStyles.card}>
      <View style={crStyles.topRow}>
        <View style={crStyles.avatar}>
          {review.avatarUrl && !avatarError ? (
            <Image source={{ uri: review.avatarUrl }} style={crStyles.avatarImg} onError={() => setAvatarError(true)} />
          ) : (
            <Ionicons name="person" size={16} color={C.sage} style={{ opacity: 0.7 }} />
          )}
        </View>
        <View style={crStyles.meta}>
          <Text style={crStyles.userName} numberOfLines={1}>{review.userName}</Text>
          <Text style={crStyles.date}>{review.date}</Text>
        </View>
        <View style={crStyles.ratingRow}>
          <Ionicons name="star" size={12} color={C.coral} />
          <Text style={crStyles.ratingText}>{review.rating}</Text>
        </View>
      </View>
      <Text style={crStyles.text} numberOfLines={4}>{review.text}</Text>
    </View>
  );
}

function CommunityReviewCardSkeleton() {
  return (
    <View style={crStyles.card}>
      <View style={crStyles.topRow}>
        <View style={[crStyles.avatar, { backgroundColor: C.charcoal10 }]} />
        <View style={crStyles.meta}>
          <View style={{ width: 80, height: 10, borderRadius: 5, backgroundColor: C.charcoal10 }} />
          <View style={{ width: 50, height: 8, borderRadius: 4, backgroundColor: C.charcoal10, marginTop: 4 }} />
        </View>
      </View>
      <View style={{ gap: 6, marginTop: 8 }}>
        <View style={{ height: 10, borderRadius: 5, backgroundColor: C.charcoal10 }} />
        <View style={{ height: 10, borderRadius: 5, backgroundColor: C.charcoal10 }} />
        <View style={{ width: '70%', height: 10, borderRadius: 5, backgroundColor: C.charcoal10 }} />
      </View>
    </View>
  );
}

const crStyles = StyleSheet.create({
  card: {
    width: 240, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: 'rgba(125,155,118,0.12)', marginRight: 12,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(125,155,118,0.12)', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', flexShrink: 0,
  },
  avatarImg: { width: 36, height: 36 },
  meta: { flex: 1, minWidth: 0 },
  userName: { fontSize: 13, fontWeight: '600', color: C.charcoal },
  date: { fontSize: 11, color: C.charcoal45, marginTop: 1 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 0 },
  ratingText: { fontSize: 12, color: C.charcoal60, fontWeight: '500' },
  text: { fontSize: 13, color: 'rgba(45,45,45,0.85)', lineHeight: 19 },
});

// ─── "What others are saying" section
function CommunityReviewsSection({ reviews, isLoading }: { reviews: CommunityReview[]; isLoading: boolean }) {
  return (
    <View style={communityStyles.section}>
      <Text style={communityStyles.heading}>What others are saying</Text>
      {isLoading ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={communityStyles.list}>
          {[0, 1, 2].map((i) => <CommunityReviewCardSkeleton key={i} />)}
        </ScrollView>
      ) : reviews.length === 0 ? (
        <View style={communityStyles.empty}>
          <Ionicons name="chatbubble-outline" size={24} color={C.sage} style={{ opacity: 0.6 }} />
          <Text style={communityStyles.emptyTitle}>No reviews yet</Text>
          <Text style={communityStyles.emptyBody}>Be the first to review this business!</Text>
        </View>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={communityStyles.list}>
          {reviews.map((r) => <CommunityReviewCard key={r.id} review={r} />)}
        </ScrollView>
      )}
    </View>
  );
}

const communityStyles = StyleSheet.create({
  section: { marginTop: 32, marginLeft: -20, marginRight: -20 },
  heading: {
    fontSize: 28, fontWeight: '800', color: C.charcoal,
    textAlign: 'center',
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: 'rgba(45,45,45,0.10)', marginBottom: 12,
  },
  list: { paddingHorizontal: 20, paddingBottom: 8 },
  empty: {
    marginHorizontal: 20, backgroundColor: 'rgba(255,255,255,0.70)',
    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(125,155,118,0.12)',
    padding: 24, alignItems: 'center', gap: 6,
  },
  emptyTitle: { fontSize: 14, fontWeight: '600', color: 'rgba(45,45,45,0.80)' },
  emptyBody: { fontSize: 12, color: C.charcoal60, textAlign: 'center', lineHeight: 18 },
});

// ─── Main screen
export default function WriteReviewScreen() {
  const { id, type } = useLocalSearchParams<WriteReviewParams>();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { guardSensitiveAction } = useSecurity();
  const reducedMotion = useReducedMotion();
  const headerCollapsedRef = useRef(false);
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollTopVisibleRef = useRef(false);
  const [headerCollapsed, setHeaderCollapsed] = useState(false);
  const [showScrollTopButton, setShowScrollTopButton] = useState(false);

  const [rating, setRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedImages, setSelectedImages] = useState<Array<{ uri: string; name: string; mimeType: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [quickTags, setQuickTags] = useState<string[]>(FALLBACK_TAGS);
  const [promptIndex, setPromptIndex] = useState(0);
  const [textFocused, setTextFocused] = useState(false);
  const [titleFocused, setTitleFocused] = useState(false);

  // Form card entrance (matches web: opacity 0→1, y 20→0, duration 0.4s)
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(20)).current;

  // Section stagger: [rating, tags, title, body, photos, submit]
  const SECTION_DELAYS = [100, 150, 200, 200, 250, 300];
  const sectionAnims = useRef(SECTION_DELAYS.map(() => ({
    opacity: new Animated.Value(0),
    translateX: new Animated.Value(-20),
  }))).current;

  // Input focus scale
  const titleScale = useRef(new Animated.Value(1)).current;
  const bodyScale = useRef(new Animated.Value(1)).current;

  // Validation message (matches web: opacity 0, y -4 → opacity 1, y 0)
  const validationOpacity = useRef(new Animated.Value(0)).current;
  const validationTranslateY = useRef(new Animated.Value(-4)).current;
  const wasShowingValidation = useRef(false);

  // Progress bar animated width
  const progressAnim = useRef(new Animated.Value(0)).current;

  const isBusinessReview = type === 'business';
  const { data: businessDetail, isLoading: bizLoading } = useBusinessDetail(isBusinessReview ? id : '');
  const { data: eventSpecial, isLoading: esLoading } = useEventSpecialDetail(!isBusinessReview ? id : null);
  const isLoading = isBusinessReview ? bizLoading : esLoading;

  // Realtime: invalidate review + business/event data when the reviews table changes
  const realtimeTargets = useMemo(() => isBusinessReview
    ? [
        {
          key: `write-review-biz-reviews-${id}`,
          table: 'reviews',
          filter: `business_id=eq.${id}`,
          queryKeys: [['business-reviews', id], ['business', id]],
          enabled: Boolean(id),
        },
      ]
    : [
        {
          key: `write-review-event-reviews-${id}`,
          table: 'reviews',
          filter: `event_id=eq.${id}`,
          queryKeys: [['event-reviews', id], ['event-ratings', id], ['event-special-detail', id]],
          enabled: Boolean(id),
        },
      ],
  [id, isBusinessReview]);

  useRealtimeQueryInvalidation(realtimeTargets);

  // Community reviews
  const bizReviewsQuery = useBusinessReviews(isBusinessReview ? id : '');
  const eventReviewsQuery = useEventReviews(!isBusinessReview ? id : null);

  const communityReviews: CommunityReview[] = isBusinessReview
    ? (bizReviewsQuery.data?.pages[0]?.data ?? []).map((r: ReviewItem) => ({
        id: r.id,
        userName: r.display_name ?? r.username ?? 'Anonymous',
        avatarUrl: r.avatar_url,
        rating: r.rating,
        text: r.body ?? '',
        date: r.created_at ? new Date(r.created_at).toLocaleDateString() : '',
      }))
    : (eventReviewsQuery.reviews ?? []).map((r: EventReviewItem) => ({
        id: r.id,
        userName: r.user.name,
        avatarUrl: r.user.avatarUrl,
        rating: r.rating,
        text: r.content,
        date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : '',
      }));

  const communityLoading = isBusinessReview ? bizReviewsQuery.isLoading : eventReviewsQuery.isLoading;

  // Hero images — align source precedence with web
  const heroImages: string[] = isBusinessReview && businessDetail
    ? (() => {
        const allImages: string[] = [];
        const pushIfValid = (candidate: unknown, allowPlaceholder = false) => {
          if (typeof candidate !== 'string') return;
          const trimmed = candidate.trim();
          if (!trimmed) return;
          if (!allowPlaceholder && isPlaceholderImage(trimmed)) return;
          if (!allImages.includes(trimmed)) allImages.push(trimmed);
        };

        const uploaded = (businessDetail as any).uploaded_images;
        if (Array.isArray(uploaded)) {
          uploaded.forEach((url) => pushIfValid(url));
        }
        pushIfValid((businessDetail as any).image_url);
        if (Array.isArray((businessDetail as any).images)) {
          (businessDetail as any).images.forEach((url: unknown) => pushIfValid(url));
        }
        pushIfValid((businessDetail as any).image);
        return allImages;
      })()
    : eventSpecial
    ? (() => {
        const es = eventSpecial as unknown as Record<string, unknown>;
        const firstArrayImage = Array.isArray(es.images) ? es.images[0] : null;
        const displayImageCandidate =
          es.image ?? es.imageUrl ?? es.image_url ?? firstArrayImage ?? null;
        if (typeof displayImageCandidate !== 'string') return [];
        const trimmed = displayImageCandidate.trim();
        return trimmed ? [trimmed] : [];
      })()
    : [];

  const charCount = reviewText.length;
  const charProgress = Math.min(1, charCount / MIN_CHARS);

  // Form entrance + section stagger on mount
  useEffect(() => {
    if (reducedMotion) {
      formOpacity.setValue(1);
      formTranslateY.setValue(0);
      sectionAnims.forEach((a) => { a.opacity.setValue(1); a.translateX.setValue(0); });
      return;
    }
    Animated.parallel([
      Animated.timing(formOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.timing(formTranslateY, { toValue: 0, duration: 400, useNativeDriver: true }),
    ]).start();
    sectionAnims.forEach((anim, index) => {
      Animated.sequence([
        Animated.delay(SECTION_DELAYS[index]),
        Animated.parallel([
          Animated.timing(anim.opacity, { toValue: 1, duration: 300, useNativeDriver: true }),
          Animated.timing(anim.translateX, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]),
      ]).start();
    });
  }, []);

  // Title input focus scale
  useEffect(() => {
    if (reducedMotion) return;
    Animated.timing(titleScale, { toValue: titleFocused ? 1.01 : 1, duration: 200, useNativeDriver: true }).start();
  }, [titleFocused]);

  // Body textarea focus scale
  useEffect(() => {
    if (reducedMotion) return;
    Animated.timing(bodyScale, { toValue: textFocused ? 1.01 : 1, duration: 200, useNativeDriver: true }).start();
  }, [textFocused]);

  // Validation message fade+slide
  const showValidation = reviewText.length > 0 && reviewText.length < MIN_CHARS;
  useEffect(() => {
    if (showValidation && !wasShowingValidation.current) {
      wasShowingValidation.current = true;
      if (reducedMotion) { validationOpacity.setValue(1); validationTranslateY.setValue(0); return; }
      validationOpacity.setValue(0);
      validationTranslateY.setValue(-4);
      Animated.parallel([
        Animated.timing(validationOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(validationTranslateY, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    } else if (!showValidation) {
      wasShowingValidation.current = false;
      validationOpacity.setValue(0);
      validationTranslateY.setValue(-4);
    }
  }, [showValidation]);

  // Progress bar animated width
  useEffect(() => {
    Animated.timing(progressAnim, { toValue: charProgress, duration: reducedMotion ? 0 : 300, useNativeDriver: false }).start();
  }, [charProgress]);

  useEffect(() => {
    if (reviewText.length === 0 && !textFocused) {
      const t = setInterval(() => setPromptIndex((i) => (i + 1) % WRITING_PROMPTS.length), 4000);
      return () => clearInterval(t);
    }
  }, [reviewText.length, textFocused]);

  useEffect(() => {
    let active = true;
    apiFetch<{ dealBreakers?: Array<{ label?: string }> }>('/api/deal-breakers')
      .then((payload) => {
        if (!active || !payload) return;
        const labels = (payload.dealBreakers ?? [])
          .map((item: { label?: string }) => (item?.label ?? '').trim())
          .filter(Boolean);
        if (labels.length > 0) setQuickTags([...new Set(labels)] as string[]);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const hasContent = rating > 0 || reviewText.trim().length > 0 || reviewTitle.trim().length > 0 ||
    selectedTags.length > 0 || selectedImages.length > 0;

  const isFormValid = rating > 0 && reviewText.trim().length >= MIN_CHARS && !submitting;

  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 4 ? [...prev, tag] : prev,
    );
  };

  const handleBack = useCallback(() => {
    if (!hasContent) { router.back(); return; }
    Alert.alert('Discard Review?', 'You have unsaved changes. Are you sure you want to leave?', [
      { text: 'Keep Editing', style: 'cancel' },
      { text: 'Discard', style: 'destructive', onPress: () => router.back() },
    ]);
  }, [hasContent, router]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const y = event.nativeEvent.contentOffset.y;
      const showScrollTop = y > 320;
      if (scrollTopVisibleRef.current !== showScrollTop) {
        scrollTopVisibleRef.current = showScrollTop;
        setShowScrollTopButton(showScrollTop);
      }

      const collapsed = y > 60;
      if (collapsed !== headerCollapsedRef.current) {
        headerCollapsedRef.current = collapsed;
        setHeaderCollapsed(collapsed);
      }
    },
    []
  );

  const handleScrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  useGlobalScrollToTop({
    visible: showScrollTopButton,
    enabled: true,
    onScrollToTop: handleScrollToTop,
  });

  const handlePickImage = () => {
    Alert.alert('Photo Upload', 'Photo upload requires expo-image-picker.\n\nRun: npx expo install expo-image-picker');
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;
    const gate = guardSensitiveAction('write_review');
    if (!gate.allowed) { setFormError(gate.reason || 'This action is temporarily unavailable on this device.'); return; }
    setFormError(null);
    setSubmitting(true);

    try {
      if (isBusinessReview) {
        const formData = new FormData();
        formData.append('business_id', businessDetail?.id ?? id);
        formData.append('rating', String(rating));
        formData.append('content', reviewText.trim());
        if (reviewTitle.trim()) formData.append('title', reviewTitle.trim());
        selectedTags.forEach((tag) => formData.append('tags', tag));
        selectedImages.forEach((img, i) => {
          formData.append('images', {
            uri: img.uri,
            name: img.name || `photo_${Date.now()}_${i}.jpg`,
            type: img.mimeType || 'image/jpeg',
          } as unknown as Blob);
        });

        const result = await apiFetch<{ message?: string; code?: string; error?: string; success?: boolean }>(
          '/api/reviews',
          { method: 'POST', body: formData, includeAnonymousIdOnMissingAuth: true, timeoutMs: 20_000 }
        );
        if (result.success === false) { setFormError(getErrorMessage(result)); return; }

        qc.invalidateQueries({ queryKey: ['business-reviews', businessDetail?.id ?? id] });
        qc.invalidateQueries({ queryKey: ['business', businessDetail?.id ?? id] });
      } else {
        const formData = new FormData();
        formData.append('target_id', id);
        formData.append('type', type);
        formData.append('rating', String(rating));
        formData.append('content', reviewText.trim());
        if (reviewTitle.trim()) formData.append('title', reviewTitle.trim());
        selectedTags.forEach((tag) => formData.append('tags', tag));
        selectedImages.forEach((img, i) => {
          formData.append('images', {
            uri: img.uri,
            name: img.name || `photo_${Date.now()}_${i}.jpg`,
            type: img.mimeType || 'image/jpeg',
          } as unknown as Blob);
        });

        const result = await apiFetch<{ message?: string; code?: string; error?: string; success?: boolean }>(
          '/api/reviews',
          { method: 'POST', body: formData, includeAnonymousIdOnMissingAuth: true, timeoutMs: 20_000 }
        );
        if (result.success === false) { setFormError(getErrorMessage(result)); return; }

        qc.invalidateQueries({ queryKey: ['event-special-detail', id] });
        qc.invalidateQueries({ queryKey: ['event-reviews', id] });
        qc.invalidateQueries({ queryKey: ['event-ratings', id] });
        qc.invalidateQueries({ queryKey: ['event-related', id] });
      }

      Alert.alert('Review Submitted!', 'Thanks for sharing your experience.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      if (err instanceof ApiError) { setFormError(getErrorMessage({ message: err.message, code: err.code })); return; }
      setFormError(err instanceof Error ? err.message : 'Failed to submit your review.');
    } finally {
      setSubmitting(false);
    }
  };

  // Resolve display values
  let displayTitle = '';
  let displayImage: string | null = null;
  let businessName: string | null = null;
  let displayDate: string | null = null;
  let displayVenue: string | null = null;
  let displayValidUntil: string | null = null;

  if (isBusinessReview && businessDetail) {
    displayTitle = businessDetail.name ?? '';
    displayImage = (businessDetail as any).image_url ?? (businessDetail as any).images?.[0] ?? (businessDetail as any).image ?? null;
  } else if (eventSpecial) {
    const es = eventSpecial as unknown as Record<string, unknown>;
    displayTitle = String(es.name ?? es.title ?? '');
    const firstArrayImage = Array.isArray(es.images) ? es.images[0] : null;
    const displayImageCandidate = es.image ?? es.imageUrl ?? es.image_url ?? firstArrayImage ?? null;
    displayImage =
      typeof displayImageCandidate === 'string' && displayImageCandidate.trim().length > 0
        ? displayImageCandidate.trim()
        : null;
    businessName = String(es.businessName ?? es.business_name ?? '') || null;
    if (type === 'event') {
      displayDate = eventSpecial.startDate ?? null;
      displayVenue = String(es.venue ?? es.venue_name ?? '') || null;
    } else {
      const vu = es.valid_until ?? es.validUntil ?? null;
      if (vu) {
        try { displayValidUntil = new Date(String(vu)).toLocaleDateString(); } catch { displayValidUntil = null; }
      }
    }
  }

  return (
    <SafeAreaView style={[styles.safeArea, isBusinessReview && { backgroundColor: businessDetailColors.page }]}>
      {!isBusinessReview && (
        <LinearGradient
          colors={['rgba(125,155,118,0.12)', C.offWhite, 'rgba(114,47,55,0.06)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
      )}
      <Stack.Screen
        options={{
          header: (props) => <StackPageHeader {...props} onPressBack={handleBack} />,
          headerStyle: { backgroundColor: headerCollapsed ? C.coral : C.offWhite },
          headerTintColor: headerCollapsed ? '#FFFFFF' : C.charcoal,
        }}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >

          {/* ── Hero carousel — always shown; falls back to subcategory placeholder */}
          {!isLoading && (
            isBusinessReview && businessDetail ? (
              <BusinessHeroCarousel
                businessName={displayTitle}
                images={heroImages}
                rating={normalizeBusinessRating(businessDetail).rating}
                verified={businessDetail.verified ?? undefined}
                subcategorySlug={
                  businessDetail.primary_subcategory_slug
                    ?? (businessDetail as any).sub_interest_id
                    ?? (businessDetail as any).subInterestId
                }
                interestId={
                  (businessDetail as any).primary_category_slug
                    ?? (businessDetail as any).interest_id
                    ?? (businessDetail as any).interestId
                }
              />
            ) : (
              <ReviewHeroCarousel
                images={heroImages}
                name={displayTitle}
                subcategorySlug={undefined}
              />
            )
          )}

          {/* ── Target info card — only for events/specials (web doesn't show for business) */}
          {!isLoading && displayTitle && !isBusinessReview ? (
            <View style={styles.targetCard}>
              <View style={styles.targetRow}>
                {heroImages.length === 0 && displayImage ? (
                  <Image source={{ uri: displayImage }} style={styles.targetImg} />
                ) : heroImages.length === 0 ? (
                  <View style={styles.targetImgFallback}>
                    <Ionicons name="star-outline" size={28} color={C.charcoal30} />
                  </View>
                ) : null}
                <View style={[styles.targetInfo, heroImages.length > 0 && { flex: 1 }]}>
                  <Text style={styles.targetTitle} numberOfLines={2}>{displayTitle}</Text>
                  {businessName ? <Text style={styles.targetByLine}>by {businessName}</Text> : null}
                  <View style={styles.targetMetaRow}>
                    {displayDate ? (
                      <View style={styles.metaChip}>
                        <Ionicons name="calendar-outline" size={12} color={C.charcoal60} />
                        <Text style={styles.metaChipText}>{displayDate}</Text>
                      </View>
                    ) : null}
                    {displayVenue ? (
                      <View style={styles.metaChip}>
                        <Ionicons name="location-outline" size={12} color={C.charcoal60} />
                        <Text style={styles.metaChipText} numberOfLines={1}>{displayVenue}</Text>
                      </View>
                    ) : null}
                    {displayValidUntil ? (
                      <View style={styles.metaChip}>
                        <Ionicons name="time-outline" size={12} color={C.charcoal60} />
                        <Text style={styles.metaChipText}>Valid until {displayValidUntil}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            </View>
          ) : null}

          {/* ── Form card entrance (matches web: opacity 0→1, y 20→0, duration 0.4s) */}
          <Animated.View style={[styles.formCard, { opacity: formOpacity, transform: [{ translateY: formTranslateY }] }]}>

          {/* ── Anonymous notice — web shows this ABOVE the form header */}
          {!user ? (
            <View style={styles.anonNotice}>
              <Text style={styles.anonTitle}>Posting as Anonymous</Text>
              <Text style={styles.anonBody}>Sign in to tie this review to your profile identity.</Text>
            </View>
          ) : null}

          {/* ── Form header */}
          <View style={styles.formHeader}>
            <Ionicons name="create-outline" size={20} color={C.coral} />
            <View style={styles.formHeaderText}>
              <Text style={styles.formHeaderTitle}>Write a Review</Text>
              {displayTitle ? <Text style={styles.formHeaderSub}>Share your experience with {displayTitle}</Text> : null}
            </View>
          </View>

          {/* ── Rating — stagger delay 100ms, slide from x:-20 */}
          <Animated.View style={[styles.section, { opacity: sectionAnims[0].opacity, transform: [{ translateX: sectionAnims[0].translateX }] }]}>
            <RatingSelector value={rating} onChange={(v) => { setFormError(null); setRating(v); }} disabled={submitting} />
          </Animated.View>

          <Divider />

          {/* ── Tags — stagger delay 150ms */}
          <Animated.View style={[styles.section, { opacity: sectionAnims[1].opacity, transform: [{ translateX: sectionAnims[1].translateX }] }]}>
            <TagSelector
              tags={quickTags} selected={selectedTags}
              onToggle={(tag) => { setFormError(null); handleTagToggle(tag); }}
              disabled={submitting}
            />
          </Animated.View>

          <Divider />

          {/* ── Title — stagger delay 200ms, focus scale 1→1.01 */}
          <Animated.View style={[styles.section, { opacity: sectionAnims[2].opacity, transform: [{ translateX: sectionAnims[2].translateX }] }]}>
            <View style={styles.fieldHeaderRow}>
              <View style={styles.fieldHeader}>
                <Ionicons name="text-outline" size={16} color={C.charcoal60} />
                <Text style={styles.fieldLabel}>Title <Text style={styles.fieldOptional}>(optional)</Text></Text>
              </View>
            </View>
            <Animated.View style={{ transform: [{ scale: titleScale }] }}>
              <TextInput
                style={styles.titleInput} value={reviewTitle}
                onChangeText={(t) => { setFormError(null); setReviewTitle(t); }}
                onFocus={() => setTitleFocused(true)} onBlur={() => setTitleFocused(false)}
                placeholder="Summarize your experience..." placeholderTextColor={C.charcoal30}
                maxLength={MAX_TITLE_CHARS} editable={!submitting}
              />
            </Animated.View>
            <Text style={styles.charCount}>{reviewTitle.length}/{MAX_TITLE_CHARS}</Text>
          </Animated.View>

          {/* ── Body — stagger delay 200ms, focus scale 1→1.01 */}
          <Animated.View style={[styles.section, { opacity: sectionAnims[3].opacity, transform: [{ translateX: sectionAnims[3].translateX }] }]}>
            <View style={styles.fieldHeaderRow}>
              <View style={styles.fieldHeader}>
                <Ionicons name="chatbubble-outline" size={16} color={C.charcoal60} />
                <Text style={styles.fieldLabel}>Your review</Text>
              </View>
              <Text style={[styles.charCount, charCount > 4500 && styles.charCountWarn]}>{charCount}/{MAX_CHARS}</Text>
            </View>
            <Animated.View style={[{ position: 'relative' }, { transform: [{ scale: bodyScale }] }]}>
              <TextInput
                style={styles.bodyInput} value={reviewText}
                onChangeText={(t) => { setFormError(null); setReviewText(t); }}
                onFocus={() => setTextFocused(true)} onBlur={() => setTextFocused(false)}
                placeholder="Share your experience with others..." placeholderTextColor={C.charcoal30}
                multiline textAlignVertical="top" maxLength={MAX_CHARS} editable={!submitting}
              />
              {reviewText.length === 0 && !textFocused ? (
                <AnimatedTip promptIndex={promptIndex} reducedMotion={reducedMotion} />
              ) : null}
            </Animated.View>
            {showValidation ? (
              <Animated.View style={{ opacity: validationOpacity, transform: [{ translateY: validationTranslateY }] }}>
                <Text style={styles.minCharsHint}>
                  {MIN_CHARS - reviewText.trim().length} more character{MIN_CHARS - reviewText.trim().length !== 1 ? 's' : ''} needed
                </Text>
                <View style={styles.progressRow}>
                  <View style={styles.progressTrack}>
                    <Animated.View style={[styles.progressFill, { width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }]} />
                  </View>
                </View>
              </Animated.View>
            ) : null}
          </Animated.View>

          <Divider />

          {/* ── Photos — stagger delay 250ms */}
          <Animated.View style={[styles.section, { opacity: sectionAnims[4].opacity, transform: [{ translateX: sectionAnims[4].translateX }] }]}>
            <View style={styles.fieldHeaderRow}>
              <View style={styles.fieldHeader}>
                <Ionicons name="camera-outline" size={16} color={C.charcoal60} />
                <Text style={styles.fieldLabel}>Photos <Text style={styles.fieldOptional}>(optional)</Text></Text>
              </View>
              {selectedImages.length > 0 ? <Text style={styles.charCount}>{selectedImages.length}/{MAX_PHOTOS}</Text> : null}
            </View>
            {selectedImages.length > 0 ? (
              <View style={styles.photosRow}>
                {selectedImages.map((img, i) => (
                  <View key={i} style={styles.photoThumb}>
                    <Image source={{ uri: img.uri }} style={styles.photoImg} />
                    <Pressable style={styles.photoRemoveBtn} onPress={() => handleRemoveImage(i)}>
                      <Ionicons name="close" size={11} color={C.white} />
                    </Pressable>
                  </View>
                ))}
              </View>
            ) : null}
            {selectedImages.length < MAX_PHOTOS ? (
              <Pressable style={styles.photoPickerZone} onPress={handlePickImage} disabled={submitting}>
                <View style={styles.photoPickerIcon}>
                  <Ionicons name="image-outline" size={22} color={C.charcoal60} />
                </View>
                <Text style={styles.photoPickerLabel}>Tap to add photos</Text>
                <Text style={styles.photoPickerSub}>
                  {selectedImages.length > 0 ? `${selectedImages.length}/${MAX_PHOTOS} added` : `Up to ${MAX_PHOTOS} images, max 2MB each`}
                </Text>
              </Pressable>
            ) : null}
          </Animated.View>

          {/* ── Error */}
          {formError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={C.coral} />
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          ) : null}

          {/* ── Submit — stagger delay 300ms */}
          <Animated.View style={[styles.submitWrap, { opacity: sectionAnims[5].opacity, transform: [{ translateY: sectionAnims[5].translateX }] }]}>
            <Pressable onPress={handleSubmit} disabled={!isFormValid} style={{ width: '100%' }}>
              {isFormValid ? (
                <LinearGradient colors={[C.coral, 'rgba(114,47,55,0.90)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.submitBtn}>
                  <Text style={styles.submitText}>{submitting ? 'Submitting...' : 'Submit Review'}</Text>
                  {!submitting ? <Ionicons name="send" size={16} color={C.white} /> : null}
                </LinearGradient>
              ) : (
                <View style={[styles.submitBtn, styles.submitBtnDisabled]}>
                  <Text style={[styles.submitText, styles.submitTextDisabled]}>Submit Review</Text>
                </View>
              )}
            </Pressable>
            {!isFormValid ? <Text style={styles.invalidHint}>Add a rating and at least 10 characters to submit</Text> : null}
          </Animated.View>

          </Animated.View>{/* end formCard */}

          {/* ── Context card (mobile equivalent of web sidebar) */}
          {!isLoading && displayTitle && !isBusinessReview ? (
            <View style={styles.contextCard}>
              <Text style={styles.contextHeading}>
                {type === 'event' ? 'About this Event' : 'About this Special'}
              </Text>

              {displayImage ? (
                <Image source={{ uri: displayImage }} style={styles.contextImage} resizeMode="cover" />
              ) : (
                <View style={styles.contextImageFallback}>
                  <Ionicons name="image-outline" size={28} color={C.charcoal45} />
                </View>
              )}

              <Text style={styles.contextTitle} numberOfLines={2}>{displayTitle}</Text>
              {businessName ? <Text style={styles.contextSub}>by {businessName}</Text> : null}

              <View style={styles.contextMetaWrap}>
                {displayDate ? <Text style={styles.contextMetaText}>{displayDate}</Text> : null}
                {displayVenue ? <Text style={styles.contextMetaText}>{displayVenue}</Text> : null}
                {displayValidUntil ? <Text style={styles.contextMetaText}>Valid until {displayValidUntil}</Text> : null}
              </View>
            </View>
          ) : null}

        </ScrollView>
      </KeyboardAvoidingView>
      <ScrollToTopFab visible={showScrollTopButton} onPress={handleScrollToTop} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  formCard: {
    backgroundColor: C.cardBg,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 4,
  },
  content: { paddingHorizontal: 8, paddingTop: 20, paddingBottom: 48, gap: 16 },

  formHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 4, paddingTop: 16, marginBottom: 4 },
  formHeaderText: { flex: 1, gap: 2 },
  formHeaderTitle: { fontSize: 20, fontWeight: '700', color: C.charcoal },
  formHeaderSub: { fontSize: 14, color: C.charcoal60 },

  targetCard: { backgroundColor: C.cardBg, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: C.sageBorder },
  targetRow: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  targetImg: { width: 72, height: 72, borderRadius: 10, flexShrink: 0 },
  targetImgFallback: { width: 72, height: 72, borderRadius: 10, backgroundColor: C.charcoal10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  targetInfo: { flex: 1, gap: 4 },
  targetTitle: { fontSize: 17, fontWeight: '700', color: C.charcoal, lineHeight: 22 },
  targetByLine: { fontSize: 13, fontWeight: '500', color: C.charcoal60 },
  targetMetaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaChipText: { fontSize: 12, fontWeight: '500', color: C.charcoal60 },

  anonNotice: { marginBottom: 16, backgroundColor: 'rgba(125,155,118,0.08)', borderRadius: 10, borderWidth: 1, borderColor: 'rgba(125,155,118,0.20)', padding: 12, gap: 2 },
  anonTitle: { fontSize: 14, fontWeight: '700', color: C.charcoal },
  anonBody: { fontSize: 13, fontWeight: '500', color: C.charcoal60 },

  section: { paddingVertical: 20 },
  fieldHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  fieldHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, paddingHorizontal: 4 },
  fieldLabel: { fontSize: 16, fontWeight: '600', color: C.charcoal },
  fieldOptional: { fontSize: 14, fontWeight: '400', color: 'rgba(45,45,45,0.45)' },

  titleInput: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 999, borderWidth: 2, borderColor: 'rgba(255,255,255,0.60)', paddingHorizontal: 20, paddingVertical: 14, fontSize: 15, fontWeight: '600', color: C.charcoal },
  bodyInput: { backgroundColor: 'rgba(255,255,255,0.95)', borderRadius: 12, borderWidth: 2, borderColor: 'rgba(255,255,255,0.60)', paddingHorizontal: 20, paddingVertical: 16, fontSize: 15, fontWeight: '500', color: C.charcoal, minHeight: 120, lineHeight: 22 },

  tipOverlay: { position: 'absolute', bottom: 16, left: 20, right: 20, flexDirection: 'row', alignItems: 'center', gap: 6 },
  tipText: { fontSize: 13, color: C.charcoal60, flexShrink: 1 },

  progressRow: { marginTop: 8 },
  progressTrack: { height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.15)', overflow: 'hidden' },
  progressFill: { height: 4, borderRadius: 2, backgroundColor: 'rgba(114,47,55,0.60)' },
  charCount: { fontSize: 12, color: 'rgba(45,45,45,0.45)', textAlign: 'right', marginTop: 4 },
  charCountWarn: { color: '#E88D67' },
  minCharsHint: { fontSize: 12, color: C.coral, marginTop: 6, paddingHorizontal: 4 },

  photosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 12 },
  photoThumb: { width: 80, height: 80, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  photoImg: { width: 80, height: 80 },
  photoRemoveBtn: { position: 'absolute', top: 4, right: 4, width: 20, height: 20, borderRadius: 10, backgroundColor: C.coral, alignItems: 'center', justifyContent: 'center' },
  photoPickerZone: { borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(45,45,45,0.20)', borderRadius: 12, paddingVertical: 24, paddingHorizontal: 16, alignItems: 'center', gap: 6, backgroundColor: C.charcoal10, marginTop: 12 },
  photoPickerIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(45,45,45,0.08)', alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  photoPickerLabel: { fontSize: 15, fontWeight: '600', color: C.charcoal60 },
  photoPickerSub: { fontSize: 13, fontWeight: '400', color: 'rgba(45,45,45,0.45)' },

  errorBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: 12, backgroundColor: C.errorBg, borderWidth: 1, borderColor: C.errorBorder, marginTop: 24 },
  errorText: { flex: 1, fontSize: 14, fontWeight: '500', color: C.coral, lineHeight: 20 },

  submitWrap: { marginTop: 32, gap: 12, alignItems: 'center' },
  submitBtn: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 999, minHeight: 56 },
  submitBtnDisabled: { backgroundColor: C.charcoal10 },
  submitText: { fontSize: 16, fontWeight: '700', color: C.white },
  submitTextDisabled: { color: C.charcoal60 },
  invalidHint: { fontSize: 13, color: 'rgba(45,45,45,0.45)', textAlign: 'center' },

  contextCard: {
    backgroundColor: C.cardBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.sageBorder,
    padding: 16,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  contextHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: C.charcoal,
    marginBottom: 2,
  },
  contextImage: {
    width: '100%',
    height: 160,
    borderRadius: 8,
  },
  contextImageFallback: {
    width: '100%',
    height: 160,
    borderRadius: 8,
    backgroundColor: C.charcoal10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contextTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: C.charcoal,
    marginTop: 4,
  },
  contextSub: {
    fontSize: 13,
    color: C.charcoal60,
  },
  contextMetaWrap: {
    gap: 4,
    marginTop: 2,
  },
  contextMetaText: {
    fontSize: 12,
    color: C.charcoal60,
    lineHeight: 18,
  },
});
