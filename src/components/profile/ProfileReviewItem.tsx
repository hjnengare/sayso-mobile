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
            size={14}
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
    borderBottomColor: 'rgba(125,155,118,0.16)',
    paddingVertical: 14,
    gap: 10,
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
    fontSize: 17,
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
    fontSize: 12,
    color: 'rgba(45,45,45,0.7)',
    fontWeight: '600',
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
    borderWidth: 1,
    borderColor: 'rgba(45,45,45,0.08)',
  },
  contentWrap: {
    marginLeft: 58,
    gap: 4,
  },
  reviewTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  reviewText: {
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(45,45,45,0.84)',
  },
  footerRow: {
    marginLeft: 58,
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
    fontSize: 12,
    color: '#722F37',
    fontWeight: '700',
  },
  dateText: {
    fontSize: 12,
    color: 'rgba(45,45,45,0.55)',
  },
});
