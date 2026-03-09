import { useMemo } from 'react';
import { StyleSheet, View, type StyleProp } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BusinessPageHeader, type BusinessHeaderMenuItem } from './business-detail/BusinessPageHeader';
import { businessDetailColors, businessDetailSpacing } from './business-detail/styles';
import { routes } from '../navigation/routes';

type Props = {
  navigation: { canGoBack: () => boolean; goBack: () => void };
  options?: { headerStyle?: StyleProp<{ backgroundColor?: string }>; headerTintColor?: string };
  onPressBack?: () => void;
};

export function StackPageHeader({ navigation, options, onPressBack }: Props) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bgColor = (options?.headerStyle ? StyleSheet.flatten(options.headerStyle) : undefined)?.backgroundColor ?? businessDetailColors.page;
  const collapsed = options?.headerTintColor === '#FFFFFF';

  const menuItems = useMemo<BusinessHeaderMenuItem[]>(
    () => [
      { key: 'home', label: 'Home', onPress: () => router.push(routes.home() as never) },
      { key: 'trending', label: 'Trending', onPress: () => router.push(routes.trending() as never) },
      { key: 'events', label: 'Events & Specials', onPress: () => router.push(routes.eventsSpecials() as never) },
      { key: 'saved', label: 'Saved', onPress: () => router.push(routes.saved() as never) },
      { key: 'profile', label: 'Profile', onPress: () => router.push(routes.profile() as never) },
    ],
    [router]
  );

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + 14, backgroundColor: bgColor }]}>
      <BusinessPageHeader
        onPressBack={() => {
          if (onPressBack) {
            onPressBack();
            return;
          }
          if (navigation.canGoBack()) navigation.goBack();
        }}
        onPressNotifications={() => router.push('/(stack)/notifications')}
        onPressMessages={() => router.push('/(stack)/dm')}
        menuItems={menuItems}
        collapsed={collapsed}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: businessDetailColors.page,
    paddingHorizontal: businessDetailSpacing.pageGutter,
    paddingBottom: 12,
    zIndex: 50,
  },
});
