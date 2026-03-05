import { Pressable, StyleSheet, View } from 'react-native';
import { Text } from '../Typography';
import { businessDetailColors, businessDetailSpacing } from './styles';

type Props = {
  onPressLeaveReview: () => void;
  onPressEditBusiness?: () => void;
  isBusinessOwner?: boolean;
};

export function BusinessActionCard({ onPressLeaveReview, onPressEditBusiness, isBusinessOwner = false }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Take Action</Text>

      <Pressable style={styles.primaryButton} onPress={onPressLeaveReview}>
        <Text style={styles.primaryButtonText}>Leave a Review</Text>
      </Pressable>

      {isBusinessOwner ? (
        <Pressable style={styles.secondaryButton} onPress={onPressEditBusiness}>
          <Text style={styles.secondaryButtonText}>Edit Business</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: businessDetailSpacing.cardRadius,
    borderWidth: 1,
    borderColor: businessDetailColors.borderSoft,
    backgroundColor: businessDetailColors.cardTint,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  heading: {
    color: businessDetailColors.charcoal,
    fontSize: 19,
    fontWeight: '700',
  },
  primaryButton: {
    borderRadius: 999,
    minHeight: 46,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: businessDetailColors.coral,
  },
  primaryButtonText: {
    color: businessDetailColors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  secondaryButton: {
    borderRadius: 999,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    backgroundColor: 'rgba(229,224,229,0.66)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.36)',
  },
  secondaryButtonText: {
    color: businessDetailColors.charcoal,
    fontSize: 14,
    fontWeight: '700',
  },
});
