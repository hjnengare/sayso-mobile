import { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../lib/api';
import { StarRating } from '../../components/StarRating';
import { Text, TextInput } from '../../components/Typography';
import { useBusinessDetail } from '../../hooks/useBusinessDetail';
import type { WriteReviewParams } from '../../navigation/types';

const REVIEW_TITLES: Record<WriteReviewParams['type'], string> = {
  business: 'Write a Business Review',
  event: 'Write an Event Review',
  special: 'Write a Special Review',
};

export default function WriteReviewScreen() {
  const { id, type } = useLocalSearchParams<WriteReviewParams>();
  const router = useRouter();
  const qc = useQueryClient();

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isBusinessReview = type === 'business';
  const { data: businessDetail } = useBusinessDetail(isBusinessReview ? id : '');
  const resolvedBusinessId = businessDetail?.id ?? id;
  const title = useMemo(() => REVIEW_TITLES[type] ?? 'Write a Review', [type]);
  const canSubmit = rating > 0 && !submitting && isBusinessReview;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      await apiFetch('/api/user/reviews', {
        method: 'POST',
        body: JSON.stringify({ business_id: resolvedBusinessId, rating, body: body.trim() || undefined }),
      });
      qc.invalidateQueries({ queryKey: ['business-reviews', resolvedBusinessId] });
      qc.invalidateQueries({ queryKey: ['business', resolvedBusinessId] });
      Alert.alert('Thanks', 'Your review has been submitted.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to submit your review.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {!isBusinessReview ? (
            <View style={styles.notice}>
              <Text style={styles.noticeTitle}>Event and special reviews are not wired yet</Text>
              <Text style={styles.noticeBody}>
                This modal route is in place for the mobile navigation architecture. Business review
                submission works today; event and special submission can plug into the same composer
                when the API is ready.
              </Text>
            </View>
          ) : null}

          <Text style={styles.label}>Your rating</Text>
          <View style={styles.starsWrap}>
            <StarRating value={rating} onChange={setRating} size={40} />
          </View>
          {rating > 0 ? (
            <Text style={styles.ratingHint}>
              {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][rating]}
            </Text>
          ) : null}

          <Text style={styles.label}>Your review</Text>
          <TextInput
            style={styles.textArea}
            value={body}
            onChangeText={setBody}
            placeholder="Share your experience..."
            placeholderTextColor="#9CA3AF"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={1000}
          />
          <Text style={styles.charCount}>{body.length}/1000</Text>

          <TouchableOpacity
            style={[styles.submitBtn, !canSubmit && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit}
          >
            <Text style={styles.submitTxt}>
              {submitting ? 'Submitting...' : isBusinessReview ? 'Submit Review' : 'Coming Soon'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5E0E5' },
  content: { padding: 24, gap: 8 },
  notice: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 16,
    padding: 16,
    gap: 8,
    marginBottom: 8,
  },
  noticeTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  noticeBody: { fontSize: 14, lineHeight: 22, color: '#4B5563' },
  label: { fontSize: 15, fontWeight: '600', color: '#374151', marginTop: 16, marginBottom: 8 },
  starsWrap: { alignItems: 'flex-start' },
  ratingHint: { fontSize: 13, color: '#6B7280', marginTop: 6 },
  textArea: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#111827',
    minHeight: 140,
    backgroundColor: '#FAFAFA',
  },
  charCount: { fontSize: 12, color: '#9CA3AF', textAlign: 'right' },
  submitBtn: {
    marginTop: 24,
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitTxt: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
