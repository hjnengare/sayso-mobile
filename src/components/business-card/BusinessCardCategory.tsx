import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Typography';
import { getCategoryIconName } from './businessCardUtils';

type Props = {
  category: string;
  subInterestId?: string;
  subInterestLabel?: string;
  style?: StyleProp<ViewStyle>;
};

export function BusinessCardCategory({ category, subInterestId, subInterestLabel, style }: Props) {
  const iconName = getCategoryIconName(category, subInterestId, subInterestLabel);

  return (
    <View style={[styles.wrap, style]}>
      <View style={styles.iconWrap}>
        <Ionicons name={iconName} size={16} color="rgba(45,45,45,0.70)" />
      </View>
      <Text numberOfLines={1} style={styles.label}>
        {category}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    maxWidth: '100%',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229, 224, 229, 0.2)',
  },
  label: {
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(45,45,45,0.8)',
    letterSpacing: 0.12,
    textAlign: 'center',
  },
});
