import { useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useBusinessDetail } from '../../src/hooks/useBusinessDetail';
import { useBusinessReviews } from '../../src/hooks/useBusinessReviews';
import { useSaveBusiness, useUnsaveBusiness, useSavedBusinesses } from '../../src/hooks/useSavedBusinesses';
import { useAuthSession } from '../../src/hooks/useSession';
import { StarRating } from '../../src/components/StarRating';
import { EmptyState } from '../../src/components/EmptyState';
import { Text } from '../../src/components/Typography';

type Tab = 'overview' | 'reviews';

export default function BusinessDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthSession();
  const [tab, setTab] = useState<Tab>('overview');

  const { data: business, isLoading, isError } = useBusinessDetail(id);
  const { data: reviewsData, fetchNextPage, hasNextPage, isFetchingNextPage } = useBusinessReviews(id);
  const { data: savedData } = useSavedBusinesses();
  const saveMutation = useSaveBusiness();
  const unsaveMutation = useUnsaveBusiness();

  const isSaved = savedData?.businesses?.some((b) => b.id === id) ?? false;

  const allReviews = reviewsData?.pages.flatMap((p) => p.data) ?? [];

  const toggleSave = () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (isSaved) {
      unsaveMutation.mutate(id);
    } else {
      saveMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: '', headerBackTitle: 'Back' }} />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#111827" />
        </View>
      </SafeAreaView>
    );
  }

  if (isError || !business) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: '', headerBackTitle: 'Back' }} />
        <EmptyState
          icon="alert-circle-outline"
          title="Business not found"
          message="This business may no longer be available."
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: business.name,
          headerBackTitle: 'Back',
          headerRight: () => (
            <TouchableOpacity onPress={toggleSave} style={styles.headerBtn}>
              <Ionicons
                name={isSaved ? 'bookmark' : 'bookmark-outline'}
                size={22}
                color={isSaved ? '#2563EB' : '#111827'}
              />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Image */}
        <Image
          source={{ uri: business.image_url ?? undefined }}
          style={styles.heroImage}
          contentFit="cover"
          placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        />

        {/* Business Info */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.businessName}>{business.name}</Text>
            {business.verified && (
              <Ionicons name="checkmark-circle" size={20} color="#2563EB" style={{ marginLeft: 6 }} />
            )}
          </View>

          {business.category_label && (
            <Text style={styles.category}>{business.category_label}</Text>
          )}

          <View style={styles.ratingRow}>
            {typeof business.rating === 'number' && business.rating > 0 ? (
              <>
                <StarRating value={Math.round(business.rating)} size={16} />
                <Text style={styles.ratingText}>
                  {business.rating.toFixed(1)} ({business.reviews ?? 0} reviews)
                </Text>
              </>
            ) : (
              <Text style={styles.noRating}>No reviews yet</Text>
            )}
          </View>

          {/* Quick contact */}
          <View style={styles.contactRow}>
            {business.address && (
              <View style={styles.contactItem}>
                <Ionicons name="location-outline" size={15} color="#6B7280" />
                <Text style={styles.contactText} numberOfLines={2}>{business.address}</Text>
              </View>
            )}
            {business.phone && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => Linking.openURL(`tel:${business.phone}`)}
              >
                <Ionicons name="call-outline" size={15} color="#6B7280" />
                <Text style={[styles.contactText, styles.link]}>{business.phone}</Text>
              </TouchableOpacity>
            )}
            {business.website && (
              <TouchableOpacity
                style={styles.contactItem}
                onPress={() => business.website && Linking.openURL(business.website)}
              >
                <Ionicons name="globe-outline" size={15} color="#6B7280" />
                <Text style={[styles.contactText, styles.link]} numberOfLines={1}>
                  {business.website.replace(/^https?:\/\//, '')}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Tab Selector */}
        <View style={styles.tabBar}>
          {(['overview', 'reviews'] as Tab[]).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
              onPress={() => setTab(t)}
            >
              <Text style={[styles.tabLabel, tab === t && styles.tabLabelActive]}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {t === 'reviews' && allReviews.length > 0 ? ` (${reviewsData?.pages[0]?.pagination.total ?? ''})` : ''}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab Content */}
        {tab === 'overview' && (
          <View style={styles.tabContent}>
            {business.description ? (
              <>
                <Text style={styles.sectionHeading}>About</Text>
                <Text style={styles.description}>{business.description}</Text>
              </>
            ) : (
              <EmptyState
                icon="information-circle-outline"
                title="No description yet"
              />
            )}
          </View>
        )}

        {tab === 'reviews' && (
          <View style={styles.tabContent}>
            <TouchableOpacity
              style={styles.writeReviewBtn}
              onPress={() => {
                if (!user) {
                  router.push('/login');
                  return;
                }
                router.push(`/business/${id}/review`);
              }}
            >
              <Ionicons name="pencil-outline" size={16} color="#FFF" />
              <Text style={styles.writeReviewTxt}>Write a Review</Text>
            </TouchableOpacity>

            {allReviews.length === 0 ? (
              <EmptyState
                icon="star-outline"
                title="No reviews yet"
                message="Be the first to review this business."
              />
            ) : (
              <>
                {allReviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHeader}>
                      <Text style={styles.reviewerName}>
                        {review.display_name || review.username || 'Anonymous'}
                      </Text>
                      <StarRating value={review.rating} size={13} />
                    </View>
                    {review.body && (
                      <Text style={styles.reviewBody}>{review.body}</Text>
                    )}
                    <Text style={styles.reviewDate}>
                      {new Date(review.created_at).toLocaleDateString('en-ZA', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </Text>
                  </View>
                ))}

                {hasNextPage && (
                  <TouchableOpacity
                    style={styles.loadMoreBtn}
                    onPress={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                  >
                    <Text style={styles.loadMoreTxt}>
                      {isFetchingNextPage ? 'Loading...' : 'Load more reviews'}
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  headerBtn: { padding: 8 },
  heroImage: {
    width: '100%',
    height: 240,
    backgroundColor: '#F3F4F6',
  },
  infoSection: {
    padding: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center' },
  businessName: { fontSize: 22, fontWeight: '800', color: '#111827', flex: 1 },
  category: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  ratingText: { fontSize: 13, color: '#6B7280' },
  noRating: { fontSize: 13, color: '#9CA3AF' },
  contactRow: { marginTop: 14, gap: 8 },
  contactItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  contactText: { fontSize: 13, color: '#6B7280', flex: 1 },
  link: { color: '#2563EB' },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabBtnActive: { borderBottomColor: '#111827' },
  tabLabel: { fontSize: 14, fontWeight: '500', color: '#9CA3AF' },
  tabLabelActive: { color: '#111827', fontWeight: '700' },
  tabContent: { padding: 20 },
  sectionHeading: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  description: { fontSize: 14, color: '#374151', lineHeight: 22 },
  writeReviewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 20,
  },
  writeReviewTxt: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  reviewCard: {
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  reviewerName: { fontSize: 13, fontWeight: '600', color: '#374151' },
  reviewBody: { fontSize: 13, color: '#6B7280', lineHeight: 20 },
  reviewDate: { fontSize: 11, color: '#9CA3AF', marginTop: 6 },
  loadMoreBtn: { alignItems: 'center', paddingVertical: 12 },
  loadMoreTxt: { color: '#2563EB', fontWeight: '500', fontSize: 14 },
});
