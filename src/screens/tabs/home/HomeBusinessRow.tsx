import { StyleSheet, View, ScrollView } from 'react-native';
import type { BusinessListItemDto, FeaturedBusinessDto } from '@sayso/contracts';
import { BusinessCard } from '../../../components/BusinessCard';
import { Text } from '../../../components/Typography';
import { SkeletonCard } from '../../../components/SkeletonCard';
import { homeTokens } from './HomeTokens';
import { CARD_RADIUS } from '../../../styles/radii';

type Props<T extends BusinessListItemDto | FeaturedBusinessDto> = {
  items: T[];
  loading: boolean;
  error?: string | null;
  emptyTitle: string;
  emptyMessage: string;
  contentPaddingBottom?: number;
};

export function HomeBusinessRow<T extends BusinessListItemDto | FeaturedBusinessDto>({
  items,
  loading,
  error,
  emptyTitle,
  emptyMessage,
  contentPaddingBottom = 18,
}: Props<T>) {
  const resolvedContentPaddingBottom = Math.max(contentPaddingBottom, 12);

  if (loading) {
    return (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.row}
        contentContainerStyle={[styles.content, { paddingBottom: resolvedContentPaddingBottom }]}
      >
        {[1, 2, 3].map((item) => (
          <View key={`business-skeleton-${item}`} style={styles.cardWrap}>
            <SkeletonCard />
          </View>
        ))}
      </ScrollView>
    );
  }

  if (error) {
    return (
      <View style={styles.messageCard}>
        <Text style={styles.messageTitle}>Couldn&apos;t load this row right now.</Text>
        <Text style={styles.messageText}>{error}</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.messageCard}>
        <Text style={styles.messageTitle}>{emptyTitle}</Text>
        <Text style={styles.messageText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.row}
      contentContainerStyle={[styles.content, { paddingBottom: resolvedContentPaddingBottom }]}
    >
      {items.map((item) => (
        <BusinessCard key={item.id} business={item} style={styles.cardWrap} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    overflow: 'visible',
    backgroundColor: homeTokens.offWhite,
  },
  content: {
    paddingHorizontal: homeTokens.pageGutter,
    paddingTop: 4,
    gap: 14,
    backgroundColor: homeTokens.offWhite,
  },
  cardWrap: {
    width: 320,
  },
  messageCard: {
    marginHorizontal: homeTokens.pageGutter,
    padding: 20,
    borderRadius: CARD_RADIUS,
    borderWidth: 1,
    borderColor: homeTokens.borderSoft,
    backgroundColor: homeTokens.cardBg,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: homeTokens.charcoal,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(45,55,72,0.9)',
    marginTop: 6,
  },
});
