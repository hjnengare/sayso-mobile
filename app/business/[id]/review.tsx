import { useState } from 'react';
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
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../src/lib/api';
import { StarRating } from '../../../src/components/StarRating';
import { Text, TextInput } from '../../../src/components/Typography';

export default function WriteReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [rating, setRating] = useState(0);
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = rating > 0 && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    try {
      await apiFetch('/api/user/reviews', {
        method: 'POST',
        body: JSON.stringify({ business_id: id, rating, body: body.trim() || undefined }),
      });
      qc.invalidateQueries({ queryKey: ['business-reviews', id] });
      qc.invalidateQueries({ queryKey: ['business', id] });
      Alert.alert('Thanks!', 'Your review has been submitted.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'Failed to submit review. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Write a Review', headerBackTitle: 'Back' }} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>Your rating</Text>
          <View style={styles.starsWrap}>
            <StarRating value={rating} onChange={setRating} size={40} />
          </View>
          {rating > 0 && (
            <Text style={styles.ratingHint}>
              {['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'][rating]}
            </Text>
          )}

          <Text style={styles.label}>Your review (optional)</Text>
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
              {submitting ? 'Submitting...' : 'Submit Review'}
            </Text>
          </TouchableOpacity>

          {rating === 0 && (
            <Text style={styles.hint}>Select a star rating to continue</Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
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
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitTxt: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  hint: { textAlign: 'center', fontSize: 13, color: '#9CA3AF', marginTop: 8 },
});
