import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

type Props = {
  rating?: number;
};

function getStarName(rating: number, index: number): 'star' | 'star-half' | 'star-outline' {
  const threshold = index + 1;
  if (rating >= threshold) {
    return 'star';
  }
  if (rating >= threshold - 0.5) {
    return 'star-half';
  }
  return 'star-outline';
}

export function BusinessCardReviewStars({ rating = 0 }: Props) {
  const safeRating = Number.isFinite(rating) ? Math.max(0, Math.min(rating, 5)) : 0;

  return (
    <View style={styles.wrap} pointerEvents="none">
      {Array.from({ length: 5 }).map((_, index) => {
        const starName = getStarName(safeRating, index);
        const color = starName === 'star-outline' ? 'rgba(45, 55, 72, 0.42)' : '#2D3748';
        return <Ionicons key={`featured-star-${index}`} name={starName} size={14} color={color} />;
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
});
