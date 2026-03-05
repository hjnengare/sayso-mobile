import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { Text } from '../../../components/Typography';
import { homeTokens } from './HomeTokens';

type Props = {
  title: string;
  actionLabel?: string;
  onPress?: () => void;
};

export function HomeSectionHeader({ title, actionLabel, onPress }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onPress ? (
        <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: homeTokens.pageGutter,
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: homeTokens.charcoal,
    letterSpacing: -0.3,
  },
  action: {
    fontSize: 14,
    fontWeight: '600',
    color: homeTokens.charcoal,
  },
});
