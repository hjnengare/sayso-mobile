import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, apiFetch } from '../../lib/api';
import { Text, TextInput } from '../../components/Typography';
import { useAuth } from '../../providers/AuthProvider';
import { useSecurity } from '../../providers/SecurityProvider';
import { useBusinessDetail } from '../../hooks/useBusinessDetail';
import { useEventSpecialDetail } from '../../hooks/useEventSpecialDetail';
import type { WriteReviewParams } from '../../navigation/types';

// ─── Constants
const MIN_CHARS = 10;
const MAX_CHARS = 5000;
const MAX_TITLE_CHARS = 200;
const MAX_PHOTOS = 2;

const RATING_LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

const WRITING_PROMPTS = [
  'What made this experience stand out?',
  'Would you recommend this to a friend?',
  'What was the highlight of your visit?',
  'How was the service and atmosphere?',
  'Share the details that matter most...',
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
  if (result.code && REVIEW_ERROR_MESSAGES[result.code]) {
    return REVIEW_ERROR_MESSAGES[result.code];
  }
  if (result.error) return result.error;
  return 'An error occurred. Please try again.';
}

// ─── Colors (matching web design tokens)
const C = {
  offWhite: '#E5E0E5',
  charcoal: '#2D2D2D',
  charcoal60: 'rgba(45,45,45,0.60)',
  charcoal45: 'rgba(45,45,45,0.45)',
  charcoal30: 'rgba(45,45,45,0.30)',
  charcoal10: 'rgba(45,45,45,0.10)',
  coral: '#722F37',
  sage: '#7D9B76',
  white: '#FFFFFF',
  amber: '#F5D547',
  amberDark: '#E6A547',
  sageBorder: 'rgba(125,155,118,0.10)',
  cardBg: 'rgba(229,224,229,0.95)',
  errorBg: 'rgba(114,47,55,0.08)',
  errorBorder: 'rgba(114,47,55,0.25)',
};

// ─── Section label
function SectionLabel({ children }: { children: ReactNode }) {
  return <Text style={sStyles.label}>{children}</Text>;
}
const sStyles = StyleSheet.create({
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: C.charcoal60,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
});

// ─── Rating selector
function RatingSelector({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <View style={rStyles.wrap}>
      <View style={rStyles.starsRow}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Pressable
            key={i}
            onPress={() => !disabled && onChange(i)}
            style={rStyles.starBtn}
            accessibilityRole="button"
            accessibilityLabel={`Rate ${i} star${i !== 1 ? 's' : ''}`}
          >
            <Ionicons
              name={i <= value ? 'star' : 'star-outline'}
              size={42}
              color={i <= value ? C.amber : C.charcoal30}
            />
          </Pressable>
        ))}
      </View>
      {value > 0 && (
        <Text style={rStyles.ratingLabel}>{RATING_LABELS[value]}</Text>
      )}
    </View>
  );
}
const rStyles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 10 },
  starsRow: { flexDirection: 'row', gap: 6 },
  starBtn: { padding: 4 },
  ratingLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: C.coral,
    letterSpacing: 0.3,
  },
});

// ─── Tag selector (up to 4)
function TagSelector({
  tags,
  selected,
  onToggle,
  disabled,
}: {
  tags: string[];
  selected: string[];
  onToggle: (tag: string) => void;
  disabled?: boolean;
}) {
  const maxReached = selected.length >= 4;
  return (
    <View style={tStyles.wrap}>
      {tags.map((tag) => {
        const isOn = selected.includes(tag);
        const isDisabled = disabled || (!isOn && maxReached);
        return (
          <Pressable
            key={tag}
            onPress={() => !isDisabled && onToggle(tag)}
            style={[tStyles.pill, isOn && tStyles.pillOn, isDisabled && !isOn && tStyles.pillDim]}
          >
            <Ionicons
              name={isOn ? 'checkmark' : 'add'}
              size={13}
              color={isOn ? C.white : isDisabled ? C.charcoal30 : C.sage}
            />
            <Text style={[tStyles.pillText, isOn && tStyles.pillTextOn, isDisabled && !isOn && tStyles.pillTextDim]}>
              {tag}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
const tStyles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(125,155,118,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(125,155,118,0.20)',
  },
  pillOn: { backgroundColor: C.sage, borderColor: C.sage },
  pillDim: { opacity: 0.4 },
  pillText: { fontSize: 13, fontWeight: '600', color: C.sage },
  pillTextOn: { color: C.white },
  pillTextDim: { color: C.charcoal30 },
});

// ─── Main screen
export default function WriteReviewScreen() {
  const { id, type } = useLocalSearchParams<WriteReviewParams>();
  const router = useRouter();
  const qc = useQueryClient();
  const { user } = useAuth();
  const { guardSensitiveAction } = useSecurity();

  // Form state
  const [rating, setRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewText, setReviewText] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  // Photos: stored as { uri, name, type } — requires expo-image-picker to populate
  const [selectedImages, setSelectedImages] = useState<Array<{ uri: string; name: string; mimeType: string }>>([]);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [quickTags, setQuickTags] = useState<string[]>(FALLBACK_TAGS);
  const [promptIndex, setPromptIndex] = useState(0);

  const isBusinessReview = type === 'business';
  const { data: businessDetail, isLoading: bizLoading } = useBusinessDetail(isBusinessReview ? id : '');
  const { data: eventSpecial, isLoading: esLoading } = useEventSpecialDetail(!isBusinessReview ? id : null);
  const isLoading = isBusinessReview ? bizLoading : esLoading;

  // Rotate writing prompts every 4 s
  useEffect(() => {
    const t = setInterval(() => setPromptIndex((i) => (i + 1) % WRITING_PROMPTS.length), 4000);
    return () => clearInterval(t);
  }, []);

  // Fetch dealbreaker quick tags
  useEffect(() => {
    let active = true;
    apiFetch<{ dealBreakers?: Array<{ label?: string }> }>('/api/deal-breakers')
      .then((payload) => {
        if (!active || !payload) return;
        const labels: string[] = (payload.dealBreakers ?? [])
          .map((item: { label?: string }) => (item?.label ?? '').trim())
          .filter(Boolean);
        if (labels.length > 0) setQuickTags([...new Set(labels)] as string[]);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  // Derived
  const hasContent =
    rating > 0 ||
    reviewText.trim().length > 0 ||
    reviewTitle.trim().length > 0 ||
    selectedTags.length > 0 ||
    selectedImages.length > 0;

  const isFormValid = rating > 0 && reviewText.trim().length >= MIN_CHARS && !submitting;
  const charProgress = Math.min(1, reviewText.trim().length / MIN_CHARS);

  // Handlers
  const handleTagToggle = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : prev.length < 4 ? [...prev, tag] : prev,
    );
  };

  const handleBack = useCallback(() => {
    if (!hasContent) {
      router.back();
      return;
    }
    Alert.alert(
      'Discard Review?',
      'You have unsaved changes. Are you sure you want to leave?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ],
    );
  }, [hasContent, router]);

  const handlePickImage = () => {
    // Install expo-image-picker to enable photo uploads:
    //   npx expo install expo-image-picker
    // Then replace this handler with ImagePicker.launchImageLibraryAsync(...)
    Alert.alert(
      'Photo Upload',
      'Photo upload requires expo-image-picker.\n\nRun: npx expo install expo-image-picker',
    );
  };

  const handleRemoveImage = (index: number) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;
    const gate = guardSensitiveAction('write_review');
    if (!gate.allowed) {
      setFormError(gate.reason || 'This action is temporarily unavailable on this device.');
      return;
    }
    setFormError(null);
    setSubmitting(true);

    try {
      if (isBusinessReview) {
        // Business reviews use JSON endpoint
        await apiFetch('/api/user/reviews', {
          method: 'POST',
          body: JSON.stringify({
            business_id: businessDetail?.id ?? id,
            rating,
            body: reviewText.trim(),
            ...(reviewTitle.trim() ? { title: reviewTitle.trim() } : {}),
          }),
        });
        qc.invalidateQueries({ queryKey: ['business-reviews', businessDetail?.id ?? id] });
        qc.invalidateQueries({ queryKey: ['business', businessDetail?.id ?? id] });
      } else {
        // Event / special reviews use multipart FormData
        const formData = new FormData();
        formData.append('target_id', id);
        formData.append('type', type);
        formData.append('rating', String(rating));
        formData.append('content', reviewText.trim());
        if (reviewTitle.trim()) {
          formData.append('title', reviewTitle.trim());
        }
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
          {
            method: 'POST',
            body: formData,
            includeAnonymousIdOnMissingAuth: true,
            timeoutMs: 20_000,
          }
        );

        if (result.success === false) {
          setFormError(getErrorMessage(result));
          return;
        }

        qc.invalidateQueries({ queryKey: ['event-special-detail', id] });
        qc.invalidateQueries({ queryKey: ['event-reviews', id] });
        qc.invalidateQueries({ queryKey: ['event-ratings', id] });
        qc.invalidateQueries({ queryKey: ['event-related', id] });
      }

      Alert.alert('Review Submitted!', 'Thanks for sharing your experience.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      if (err instanceof ApiError) {
        setFormError(getErrorMessage({ message: err.message, code: err.code }));
        return;
      }
      setFormError(err instanceof Error ? err.message : 'Failed to submit your review.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Resolve target display values
  let displayTitle = '';
  let displayImage: string | null = null;
  let businessName: string | null = null;
  let displayDate: string | null = null;
  let displayVenue: string | null = null;
  let displayValidUntil: string | null = null;

  if (isBusinessReview && businessDetail) {
    displayTitle = businessDetail.name ?? '';
    displayImage = businessDetail.image_url ?? businessDetail.images?.[0] ?? null;
  } else if (eventSpecial) {
    const es = eventSpecial as Record<string, unknown>;
    displayTitle = String(es.name ?? es.title ?? '');
    displayImage = String(es.imageUrl ?? es.image_url ?? '') || null;
    businessName = String(es.businessName ?? es.business_name ?? '') || null;
    if (type === 'event') {
      displayDate = eventSpecial.startDate ?? null;
      displayVenue = String(es.venue ?? es.venue_name ?? '') || null;
    } else {
      const vu = es.valid_until ?? es.validUntil ?? null;
      if (vu) {
        try {
          displayValidUntil = new Date(String(vu)).toLocaleDateString();
        } catch {
          displayValidUntil = null;
        }
      }
    }
  }

  const screenTitle =
    type === 'business' ? 'Write a Review' :
    type === 'event' ? 'Write an Event Review' :
    'Write a Special Review';

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen
        options={{
          title: screenTitle,
          headerLeft: () => (
            <Pressable onPress={handleBack} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={C.charcoal} />
            </Pressable>
          ),
        }}
      />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Target info header */}
          {!isLoading && displayTitle ? (
            <View style={styles.targetCard}>
              <View style={styles.targetRow}>
                {displayImage ? (
                  <Image source={{ uri: displayImage }} style={styles.targetImg} />
                ) : (
                  <View style={styles.targetImgFallback}>
                    <Ionicons name="star-outline" size={28} color={C.charcoal30} />
                  </View>
                )}

                <View style={styles.targetInfo}>
                  <Text style={styles.targetTitle} numberOfLines={2}>{displayTitle}</Text>
                  {businessName ? (
                    <Text style={styles.targetByLine}>by {businessName}</Text>
                  ) : null}

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

          {/* ── Anonymous notice */}
          {!user ? (
            <View style={styles.anonNotice}>
              <Text style={styles.anonTitle}>Posting as Anonymous</Text>
              <Text style={styles.anonBody}>Sign in to tie this review to your profile identity.</Text>
            </View>
          ) : null}

          {/* ── Rating */}
          <View style={styles.section}>
            <SectionLabel>Your Rating</SectionLabel>
            <RatingSelector
              value={rating}
              onChange={(v) => { setFormError(null); setRating(v); }}
              disabled={submitting}
            />
          </View>

          {/* ── Tags */}
          <View style={styles.section}>
            <SectionLabel>Quick Tags (up to 4)</SectionLabel>
            <TagSelector
              tags={quickTags}
              selected={selectedTags}
              onToggle={(tag) => { setFormError(null); handleTagToggle(tag); }}
              disabled={submitting}
            />
          </View>

          {/* ── Title (optional) */}
          <View style={styles.section}>
            <SectionLabel>Title (Optional)</SectionLabel>
            <TextInput
              style={styles.titleInput}
              value={reviewTitle}
              onChangeText={(t) => { setFormError(null); setReviewTitle(t); }}
              placeholder="Give your review a headline..."
              placeholderTextColor={C.charcoal30}
              maxLength={MAX_TITLE_CHARS}
              editable={!submitting}
            />
            <Text style={styles.charCount}>{reviewTitle.length}/{MAX_TITLE_CHARS}</Text>
          </View>

          {/* ── Body */}
          <View style={styles.section}>
            <SectionLabel>Your Review</SectionLabel>
            <TextInput
              style={styles.bodyInput}
              value={reviewText}
              onChangeText={(t) => { setFormError(null); setReviewText(t); }}
              placeholder={WRITING_PROMPTS[promptIndex]}
              placeholderTextColor={C.charcoal30}
              multiline
              textAlignVertical="top"
              maxLength={MAX_CHARS}
              editable={!submitting}
            />

            {/* Progress bar toward MIN_CHARS */}
            <View style={styles.progressRow}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${charProgress * 100}%` },
                    charProgress >= 1 && styles.progressFillDone,
                  ]}
                />
              </View>
              <Text style={styles.charCount}>{reviewText.length}/{MAX_CHARS}</Text>
            </View>

            {reviewText.length > 0 && reviewText.trim().length < MIN_CHARS ? (
              <Text style={styles.minCharsHint}>
                {MIN_CHARS - reviewText.trim().length} more character
                {MIN_CHARS - reviewText.trim().length !== 1 ? 's' : ''} needed
              </Text>
            ) : null}
          </View>

          {/* ── Photos */}
          <View style={styles.section}>
            <SectionLabel>Photos (up to {MAX_PHOTOS})</SectionLabel>

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
              <Pressable
                style={styles.photoPickerZone}
                onPress={handlePickImage}
                disabled={submitting}
              >
                <View style={styles.photoPickerIcon}>
                  <Ionicons name="image-outline" size={22} color={C.charcoal60} />
                </View>
                <Text style={styles.photoPickerLabel}>Tap to add photos</Text>
                <Text style={styles.photoPickerSub}>
                  {selectedImages.length > 0
                    ? `${selectedImages.length}/${MAX_PHOTOS} added`
                    : `Up to ${MAX_PHOTOS} images, max 2MB each`}
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* ── Error banner */}
          {formError ? (
            <View style={styles.errorBanner}>
              <Ionicons name="alert-circle" size={18} color={C.coral} />
              <Text style={styles.errorText}>{formError}</Text>
            </View>
          ) : null}

          {/* ── Submit */}
          <View style={styles.submitWrap}>
            <Pressable
              style={[styles.submitBtn, !isFormValid && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={!isFormValid}
            >
              <Text style={styles.submitText}>
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Text>
              {isFormValid && !submitting ? (
                <Ionicons name="send" size={16} color={C.white} />
              ) : null}
            </Pressable>

            {!isFormValid ? (
              <Text style={styles.invalidHint}>
                Add a rating and at least 10 characters to submit
              </Text>
            ) : null}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: C.offWhite,
  },
  closeBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  content: {
    padding: 20,
    gap: 0,
    paddingBottom: 48,
  },
  section: {
    marginTop: 28,
  },

  // Target header card
  targetCard: {
    backgroundColor: C.cardBg,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: C.sageBorder,
    marginBottom: 4,
  },
  targetRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
  },
  targetImg: {
    width: 72,
    height: 72,
    borderRadius: 10,
    flexShrink: 0,
  },
  targetImgFallback: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: C.charcoal10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  targetInfo: {
    flex: 1,
    gap: 4,
  },
  targetTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: C.charcoal,
    lineHeight: 22,
  },
  targetByLine: {
    fontSize: 13,
    fontWeight: '500',
    color: C.charcoal60,
  },
  targetMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: C.charcoal60,
  },

  // Anonymous notice
  anonNotice: {
    marginTop: 16,
    backgroundColor: 'rgba(125,155,118,0.08)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(125,155,118,0.20)',
    padding: 12,
    gap: 2,
  },
  anonTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: C.charcoal,
  },
  anonBody: {
    fontSize: 13,
    fontWeight: '500',
    color: C.charcoal60,
  },

  // Title input
  titleInput: {
    backgroundColor: C.cardBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(125,155,118,0.15)',
    padding: 14,
    fontSize: 15,
    color: C.charcoal,
  },

  // Body input
  bodyInput: {
    backgroundColor: C.cardBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(125,155,118,0.15)',
    padding: 14,
    fontSize: 15,
    color: C.charcoal,
    minHeight: 140,
    lineHeight: 22,
  },

  // Char count / progress
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  progressTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.charcoal10,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: C.charcoal30,
  },
  progressFillDone: {
    backgroundColor: C.sage,
  },
  charCount: {
    fontSize: 12,
    color: C.charcoal45,
    textAlign: 'right',
    marginTop: 4,
  },
  minCharsHint: {
    fontSize: 12,
    color: C.coral,
    marginTop: 4,
  },

  // Photos
  photosRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  photoThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  photoImg: {
    width: 80,
    height: 80,
  },
  photoRemoveBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: C.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPickerZone: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(45,45,45,0.20)',
    borderRadius: 12,
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.charcoal10,
  },
  photoPickerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(45,45,45,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  photoPickerLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: C.charcoal60,
  },
  photoPickerSub: {
    fontSize: 13,
    fontWeight: '400',
    color: C.charcoal45,
  },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 10,
    backgroundColor: C.errorBg,
    borderWidth: 1,
    borderColor: C.errorBorder,
    marginTop: 24,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: C.coral,
    lineHeight: 20,
  },

  // Submit
  submitWrap: {
    marginTop: 32,
    gap: 12,
    alignItems: 'center',
  },
  submitBtn: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 999,
    backgroundColor: C.coral,
  },
  submitBtnDisabled: {
    backgroundColor: C.charcoal10,
  },
  submitText: {
    fontSize: 16,
    fontWeight: '700',
    color: C.white,
  },
  invalidHint: {
    fontSize: 13,
    color: C.charcoal45,
    textAlign: 'center',
  },
});
