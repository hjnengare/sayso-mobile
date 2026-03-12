import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from '../Typography';
import { businessDetailColors, businessDetailSpacing, CARD_GRADIENT, cardShadowStyle } from './styles';

type Props = {
  description: string;
};

export function BusinessDescriptionCard({ description }: Props) {
  return (
    <LinearGradient colors={CARD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <Text style={styles.heading}>About</Text>
      <Text style={styles.body}>{description}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: businessDetailSpacing.cardRadius,
    padding: businessDetailSpacing.cardPadding,
    gap: 8,
    ...cardShadowStyle,
  } as object,
  heading: {
    color: businessDetailColors.charcoal,
    fontSize: businessDetailSpacing.headingFontSize,
    fontWeight: businessDetailSpacing.headingFontWeight,
  },
  body: {
    color: businessDetailColors.textMuted,
    fontSize: businessDetailSpacing.bodyFontSize,
    lineHeight: businessDetailSpacing.bodyLineHeight,
  },
});
