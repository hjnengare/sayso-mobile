import { StyleSheet, View } from 'react-native';
import { Text } from '../Typography';
import { businessDetailColors, businessDetailSpacing } from './styles';

type Props = {
  description: string;
};

export function BusinessDescriptionCard({ description }: Props) {
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>About</Text>
      <Text style={styles.body}>{description}</Text>
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
    gap: 8,
  },
  heading: {
    color: businessDetailColors.charcoal,
    fontSize: 19,
    fontWeight: '700',
  },
  body: {
    color: businessDetailColors.textMuted,
    fontSize: 14,
    lineHeight: 22,
  },
});
