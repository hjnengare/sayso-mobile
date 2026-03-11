import { useCallback, useRef } from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { useNavigation } from 'expo-router';
import { homeTokens } from '../../src/screens/tabs/home/HomeTokens';
import { EventsSpecialsFeedScreen } from '../../src/screens/shared/EventsSpecialsFeedScreen';

const NAVBAR_BG = '#722F37';
const SCROLL_COLOR_THRESHOLD = 60;

export default function EventsSpecialsRoute() {
  const navigation = useNavigation();
  const headerCollapsedRef = useRef(false);

  const handleScrollY = useCallback((y: number) => {
    const collapsed = y > SCROLL_COLOR_THRESHOLD;
    if (collapsed === headerCollapsedRef.current) return;
    headerCollapsedRef.current = collapsed;
    navigation.setOptions({
      headerStyle: {
        backgroundColor: collapsed ? NAVBAR_BG : homeTokens.offWhite,
      },
      headerTintColor: collapsed ? '#FFFFFF' : homeTokens.charcoal,
    });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Events & Specials' }} />
      <EventsSpecialsFeedScreen
        subtitle="Upcoming events and live specials worth checking out next."
        onScrollY={handleScrollY}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: homeTokens.offWhite,
  },
});
