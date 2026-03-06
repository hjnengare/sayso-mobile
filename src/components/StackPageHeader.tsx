import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BusinessPageHeader } from './business-detail/BusinessPageHeader';
import { businessDetailColors, businessDetailSpacing } from './business-detail/styles';

type Props = {
  navigation: { canGoBack: () => boolean; goBack: () => void };
};

export function StackPageHeader({ navigation }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 10 }]}>
      <BusinessPageHeader
        onPressBack={() => navigation.goBack()}
        onPressNotifications={() => router.push('/(stack)/notifications')}
        onPressMessages={() => router.push('/(stack)/dm')}
        menuItems={[]}
        collapsed={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: businessDetailColors.page,
    paddingHorizontal: businessDetailSpacing.pageGutter,
    paddingBottom: 8,
  },
});
