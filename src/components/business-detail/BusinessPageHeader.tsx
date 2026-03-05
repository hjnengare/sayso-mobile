import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Typography';
import { businessDetailColors } from './styles';

type Props = {
  businessName: string;
  onPressBack: () => void;
  onPressSave: () => void;
  onPressShare: () => void;
  isSaved: boolean;
};

export function BusinessPageHeader({ businessName, onPressBack, onPressSave, onPressShare, isSaved }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <Pressable style={styles.iconButton} onPress={onPressBack} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={19} color={businessDetailColors.charcoal} />
        </Pressable>

        <View style={styles.actions}>
          <Pressable style={styles.iconButton} onPress={onPressShare} accessibilityLabel="Share business">
            <Ionicons name="share-social-outline" size={16} color={businessDetailColors.charcoal} />
          </Pressable>
          <Pressable style={styles.iconButton} onPress={onPressSave} accessibilityLabel="Save business">
            <Ionicons
              name={isSaved ? 'bookmark' : 'bookmark-outline'}
              size={16}
              color={isSaved ? businessDetailColors.coral : businessDetailColors.charcoal}
            />
          </Pressable>
        </View>
      </View>

      <View style={styles.breadcrumbRow}>
        <Text style={styles.breadcrumb}>Home</Text>
        <Ionicons name="chevron-forward" size={12} color={businessDetailColors.textSubtle} />
        <Text style={styles.breadcrumbCurrent} numberOfLines={1}>
          {businessName}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,224,229,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.36)',
  },
  breadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  breadcrumb: {
    color: businessDetailColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  breadcrumbCurrent: {
    flex: 1,
    color: businessDetailColors.charcoal,
    fontSize: 12,
    fontWeight: '700',
  },
});
