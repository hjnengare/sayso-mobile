import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BusinessListItemDto, SavedBusinessDto } from '@sayso/contracts';
import { Text } from './Typography';

type Props = {
  business: BusinessListItemDto | SavedBusinessDto;
  style?: object;
};

export function BusinessCard({ business, style }: Props) {
  const router = useRouter();

  return (
    <TouchableOpacity
      style={[styles.card, style]}
      onPress={() => router.push(`/business/${business.id}`)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: business.image ?? undefined }}
        style={styles.image}
        contentFit="cover"
        placeholder={{ blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
      />
      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{business.name}</Text>
          {business.verified && (
            <Ionicons name="checkmark-circle" size={15} color="#2563EB" style={styles.verifiedIcon} />
          )}
        </View>
        {business.category_label ? (
          <Text style={styles.category} numberOfLines={1}>{business.category_label}</Text>
        ) : null}
        {business.location ? (
          <Text style={styles.location} numberOfLines={1}>{business.location}</Text>
        ) : null}
        <View style={styles.ratingRow}>
          {typeof business.rating === 'number' && business.rating > 0 ? (
            <>
              <Ionicons name="star" size={13} color="#F59E0B" />
              <Text style={styles.rating}>{business.rating.toFixed(1)}</Text>
              {typeof business.reviews === 'number' ? (
                <Text style={styles.reviewCount}>({business.reviews})</Text>
              ) : null}
            </>
          ) : (
            <Text style={styles.noRating}>No reviews yet</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: '#F3F4F6',
  },
  body: {
    padding: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  category: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  location: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 1,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 3,
  },
  rating: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
  },
  reviewCount: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  noRating: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
