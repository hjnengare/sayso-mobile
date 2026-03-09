import { StyleSheet, View } from 'react-native';
import { HeaderBellButton } from './HeaderBellButton';
import { HeaderDmButton } from './HeaderDmButton';

export function HeaderDmBellActions() {
  return (
    <View style={styles.actions}>
      <HeaderDmButton />
      <HeaderBellButton />
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
});
