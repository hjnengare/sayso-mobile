import { useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Typography';
import { useAuth } from '../../providers/AuthProvider';
import { useReviewHelpful } from '../../hooks/useReviewHelpful';

// ─── Shared review data type (normalised from both ReviewItem & EventReviewItem)
export interface ReviewCardData {
  id: string;
  userId: string | null;
  rating: number;
  title?: string;
  content: string;
  tags?: string[];
  helpfulCount: number;
  createdAt: string;
  user: {
    id: string | null;
    name: string;
    avatarUrl?: string | null;
  };
  images?: string[];
}

// ─── Colors
const C = {
  offWhite: '#E5E0E5',
  charcoal: '#2D2D2D',
  sage: '#7D9B76',
  coral: '#722F37',
  white: '#FFFFFF',
  charcoal60: 'rgba(45,45,45,0.60)',
  charcoal45: 'rgba(45,45,45,0.45)',
  charcoal40: 'rgba(45,45,45,0.40)',
  charcoal30: 'rgba(45,45,45,0.30)',
  amber: '#F5D547',
  amberDark: '#E6A547',
  sageBorder: 'rgba(125,155,118,0.10)',
  offWhiteBg: 'rgba(229,224,229,0.95)',
};

// ─── Relative date (no dayjs needed)
function relativeDate(iso: string): string {
  if (!iso) return 'Recently';
  const diff = Date.now() - new Date(iso).getTime();
  if (isNaN(diff)) return 'Recently';
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

// ─── Avatar
function Avatar({ src, name }: { src?: string | null; name: string }) {
  const [imgError, setImgError] = useState(false);
  const initial = (name || 'U')[0].toUpperCase();

  if (src && !imgError) {
    return (
      <Image
        source={{ uri: src }}
        style={styles.avatar}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <View style={styles.avatarFallback}>
      <Text style={styles.avatarInitial}>{initial}</Text>
    </View>
  );
}

// ─── Stars (gold gradient matching web)
function Stars({ rating }: { rating: number }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={16}
          color={i <= rating ? C.amber : '#D1D5DB'}
        />
      ))}
    </View>
  );
}

// ─── ReviewCard
export function ReviewCard({ review }: { review: ReviewCardData }) {
  const { user } = useAuth();
  const { count, isHelpful, loading, toggle } = useReviewHelpful(
    review.id,
    review.helpfulCount,
  );

  const isAnonymous = !review.userId;

  return (
    <LinearGradient
      colors={['#9DAB9B', '#9DAB9B', 'rgba(157,171,155,0.95)']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.row}>
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <Avatar src={review.user.avatarUrl} name={review.user.name} />
        </View>

        <View style={styles.content}>
          {/* Header: name + verified + stars + date */}
          <View style={styles.headerRow}>
            <View style={styles.headerLeft}>
              <View style={styles.nameRow}>
                <Text style={styles.name} numberOfLines={1}>
                  {review.user.name}
                </Text>
                {isAnonymous ? (
                  <View style={styles.anonPill}>
                    <Text style={styles.anonText}>Anonymous</Text>
                  </View>
                ) : (
                  <Ionicons name="checkmark-circle" size={14} color={C.sage} />
                )}
              </View>
            </View>

            <View style={styles.headerRight}>
              <Stars rating={review.rating} />
              <Text style={styles.date}>{relativeDate(review.createdAt)}</Text>
            </View>
          </View>

          {/* Title */}
          {review.title ? (
            <Text style={styles.title}>{review.title}</Text>
          ) : null}

          {/* Body */}
          <Text style={styles.body}>{review.content}</Text>

          {/* Tags */}
          {review.tags && review.tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {review.tags.map((tag) => (
                <View key={tag} style={styles.tagPill}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          ) : null}

          {/* Images */}
          {review.images && review.images.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imagesScroll}
              contentContainerStyle={styles.imagesContent}
            >
              {review.images.map((uri, i) => (
                <Image
                  key={i}
                  source={{ uri }}
                  style={styles.reviewImage}
                />
              ))}
            </ScrollView>
          ) : null}

          {/* Actions */}
          <View style={styles.actionsRow}>
            <Pressable
              style={[styles.helpfulBtn, isHelpful && styles.helpfulBtnActive]}
              onPress={toggle}
              disabled={!user || loading}
              accessibilityLabel="Mark review as helpful"
            >
              <Ionicons
                name={isHelpful ? 'heart' : 'heart-outline'}
                size={16}
                color={isHelpful ? C.sage : C.charcoal45}
              />
              <Text
                style={[
                  styles.helpfulText,
                  isHelpful && styles.helpfulTextActive,
                ]}
              >
                Helpful ({count})
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  } as object,
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  avatarWrap: {
    flexShrink: 0,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.40)',
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(125,155,118,0.20)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.40)',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: C.sage,
  },
  content: {
    flex: 1,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeft: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: C.charcoal,
    flexShrink: 1,
  },
  anonPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(45,45,45,0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  anonText: {
    fontSize: 11,
    fontWeight: '600',
    color: C.charcoal60,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 3,
    flexShrink: 0,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  date: {
    fontSize: 12,
    fontWeight: '600',
    color: C.charcoal45,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: C.charcoal,
  },
  body: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(45,45,45,0.90)',
    lineHeight: 24,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(125,155,118,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(125,155,118,0.20)',
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.sage,
  },
  imagesScroll: {
    marginTop: 4,
  },
  imagesContent: {
    gap: 8,
  },
  reviewImage: {
    width: 120,
    height: 80,
    borderRadius: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(125,155,118,0.10)',
    gap: 12,
  },
  helpfulBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  helpfulBtnActive: {
    backgroundColor: 'rgba(125,155,118,0.10)',
  },
  helpfulText: {
    fontSize: 13,
    fontWeight: '500',
    color: C.charcoal45,
  },
  helpfulTextActive: {
    color: C.sage,
  },
});
