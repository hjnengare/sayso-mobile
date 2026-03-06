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
import { ENV } from '../../lib/env';
import { supabase } from '../../lib/supabase';
import { StarRating } from '../../components/StarRating';
import { Text, TextInput } from '../../components/Typography';
import { useBusinessDetail } from '../../hooks/useBusinessDetail';
import type { WriteReviewParams } from '../../navigation/types';

const REVIEW_TITLES: Record<WriteReviewParams['type'], string> = {
  business: 'Write a Business Review',
  event: 'Write an Event Review',
  special: 'Write a Special Review',
};

type ReviewApiError = {
  success?: boolean;
  code?: string;
  message?: string;
  details?: unknown;
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
  const canSubmit = rating > 0 && !submitting;

  const submitEventOrSpecialReview = async () => {
    const formData = new FormData();
    formData.append('type', type);
    formData.append('target_id', id);
    formData.append('rating', String(rating));
    formData.append('content', body.trim() || 'No written review provided.');

    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;

    const headers = new Headers();
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    const response = await fetch(`${ENV.apiBaseUrl}/api/reviews`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const text = await response.text().catch(() => '');
    let parsed: ReviewApiError | null = null;
    try {
      parsed = text ? (JSON.parse(text) as ReviewApiError) : null;
    } catch {
      parsed = null;
    }

    if (!response.ok) {
      throw new Error(parsed?.message || `HTTP ${response.status}`);
    }

    qc.invalidateQueries({ queryKey: ['event-special-detail', id] });
    qc.invalidateQueries({ queryKey: ['event-reviews', id] });
    qc.invalidateQueries({ queryKey: ['event-ratings', id] });
    qc.invalidateQueries({ queryKey: ['event-related', id] });
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    try {
      if (isBusinessReview) {
        await apiFetch('/api/user/reviews', {
          method: 'POST',
          body: JSON.stringify({ business_id: resolvedBusinessId, rating, body: body.trim() || undefined }),
        });

        qc.invalidateQueries({ queryKey: ['business-reviews', resolvedBusinessId] });
        qc.invalidateQueries({ queryKey: ['business', resolvedBusinessId] });
      } else {
        await submitEventOrSpecialReview();
      }

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
            <Text style={styles.submitTxt}>{submitting ? 'Submitting...' : 'Submit Review'}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5E0E5' },
  content: { padding: 24, gap: 8 },
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
