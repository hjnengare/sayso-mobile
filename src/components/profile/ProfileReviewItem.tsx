import { Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Typography';
import { getBusinessPlaceholder } from '../../lib/businessPlaceholders';

type Props = {
  businessName: string;
  businessImageUrl?: string | null;
  businessCategorySlug?: string | null;
  rating: number;
  reviewText?: string | null;
  reviewTitle?: string | null;
  tags?: string[] | null;
  createdAt: string;
  onViewClick: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StarRow({ rating }: { rating: number }) {
  return (
    <View style={styles.starRow}>
      {Array.from({ length: 5 }, (_, index) => {
        const active = index < Math.round(rating);
        return (
          <Ionicons
            key={`rating-star-${index}`}
            name={active ? 'star' : 'star-outline'}
            size={16}
            color={active ? '#F5D547' : '#D1D5DB'}
          />
        );
      })}
    </View>
  );
}

export function ProfileReviewItem({
  businessName,
  businessImageUrl,
  businessCategorySlug,
  rating,
  reviewText,
  reviewTitle,
  tags,
  createdAt,
  onViewClick,
  onEdit,
  onDelete,
}: Props) {
  const placeholder = getBusinessPlaceholder(businessCategorySlug);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <View style={styles.identityRow}>
          <Image
            source={businessImageUrl ? { uri: businessImageUrl } : placeholder}
            style={styles.thumb}
            contentFit="cover"
            transition={120}
          />
          <View style={styles.titleWrap}>
            <Text style={styles.businessName} numberOfLines={1}>
              {businessName}
            </Text>
            <View style={styles.ratingRow}>
              <StarRow rating={rating} />
              <Text style={styles.ratingText}>({rating})</Text>
            </View>
          </View>
        </View>

        <View style={styles.actionRow}>
          <Pressable onPress={onEdit} style={styles.iconBtn} accessibilityLabel="Edit review">
            <Ionicons name="create-outline" size={14} color="rgba(45,45,45,0.82)" />
          </Pressable>
          <Pressable onPress={onDelete} style={styles.iconBtn} accessibilityLabel="Delete review">
            <Ionicons name="trash-outline" size={14} color="rgba(45,45,45,0.82)" />
          </Pressable>
        </View>
      </View>

      {(reviewTitle || reviewText) ? (
        <View style={styles.contentWrap}>
          {reviewTitle ? (
            <Text style={styles.reviewTitle} numberOfLines={1}>
              {reviewTitle}
            </Text>
          ) : null}
          {reviewText ? (
            <Text style={styles.reviewText} numberOfLines={3}>
              {reviewText}
            </Text>
          ) : null}
          {tags && tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {tags.slice(0, 4).map((tag, i) => (
                <View key={i} style={styles.tagPill}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
              {tags.length > 4 ? (
                <View style={styles.tagPill}>
                  <Text style={styles.tagText}>+{tags.length - 4} more</Text>
                </View>
              ) : null}
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.footerRow}>
        <Pressable onPress={onViewClick} style={styles.viewCta} accessibilityLabel={`Read full review for ${businessName}`}>
          <Text style={styles.viewCtaText}>Read full review</Text>
          <Ionicons name="arrow-forward" size={14} color="#722F37" />
        </Pressable>
        <Text style={styles.dateText}>{formatDate(createdAt)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(125,155,118,0.10)',
    paddingVertical: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  identityRow: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  thumb: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(229,224,229,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(45,45,45,0.08)',
  },
  titleWrap: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  businessName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  starRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 14,
    color: 'rgba(45,45,45,0.7)',
    fontWeight: '500',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,224,229,0.72)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 1,
  },
  contentWrap: {
    marginLeft: 60,
    gap: 4,
  },
  reviewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  reviewText: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(45,45,45,0.80)',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  tagPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(157,171,155,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(125,155,118,0.20)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#7D9B76',
  },
  footerRow: {
    marginLeft: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  viewCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewCtaText: {
    fontSize: 14,
    color: '#722F37',
    fontWeight: '500',
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(45,45,45,0.55)',
  },
});
