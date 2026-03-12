import { Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../Typography';
import { businessDetailColors, businessDetailSpacing, CARD_GRADIENT, cardShadowStyle } from './styles';

type Props = {
  onPressLeaveReview: () => void;
  onPressEditBusiness?: () => void;
  isBusinessOwner?: boolean;
};

export function BusinessActionCard({ onPressLeaveReview, onPressEditBusiness, isBusinessOwner = false }: Props) {
  return (
    <LinearGradient colors={CARD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <Text style={styles.heading}>Take Action</Text>

      <Pressable style={styles.primaryButton} onPress={onPressLeaveReview}>
        <Text style={styles.primaryButtonText}>Leave a Review</Text>
      </Pressable>

      {isBusinessOwner ? (
        <Pressable style={styles.secondaryButton} onPress={onPressEditBusiness}>
          <Text style={styles.secondaryButtonText}>Edit Business</Text>
        </Pressable>
      ) : null}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: businessDetailSpacing.cardRadius,
    padding: businessDetailSpacing.cardPadding,
    gap: 10,
    ...cardShadowStyle,
  } as object,
  heading: {
    color: businessDetailColors.charcoal,
    fontSize: businessDetailSpacing.headingFontSize,
    fontWeight: businessDetailSpacing.headingFontWeight,
  },
  primaryButton: {
    borderRadius: 999,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: businessDetailColors.coral,
  },
  primaryButtonText: {
    color: businessDetailColors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryButton: {
    borderRadius: 999,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(229,224,229,0.66)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.36)',
  },
  secondaryButtonText: {
    color: businessDetailColors.charcoal,
    fontSize: 14,
    fontWeight: '600',
  },
});
