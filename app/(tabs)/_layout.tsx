import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, StyleSheet, View } from 'react-native';
import { useNotifications } from '../../src/hooks/useNotifications';
import { FROSTED_CARD_BORDER_COLOR } from '../../src/styles/cardSurface';

const NAVBAR_BG_COLOR = '#722F37';

export default function TabsLayout() {
  const { unreadCount } = useNotifications();
  const isWeb = Platform.OS === 'web';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#E5E0E5' },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: 'rgba(255,255,255,0.72)',
        tabBarStyle: isWeb ? styles.webTabBar : styles.nativeTabBar,
        tabBarBackground: isWeb ? undefined : () => <View style={styles.nativeTabBarBackground} />,
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="search/index"
        options={{
          title: 'Leaderboard',
          href: '/leaderboard',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'trophy' : 'trophy-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="saved/index"
        options={{
          title: 'Saved',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'bookmark' : 'bookmark-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarBadge: unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined,
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  webTabBar: {
    borderTopColor: '#5C252B',
    backgroundColor: NAVBAR_BG_COLOR,
  },
  nativeTabBar: {
    borderTopWidth: 0,
    backgroundColor: 'transparent',
    position: 'absolute',
    elevation: 0,
  },
  nativeTabBarBackground: {
    flex: 1,
    backgroundColor: NAVBAR_BG_COLOR,
    borderTopWidth: 1,
    borderTopColor: FROSTED_CARD_BORDER_COLOR,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 10,
  },
});
