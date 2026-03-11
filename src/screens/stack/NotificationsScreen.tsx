import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useNotificationsList, useMarkAllRead } from '../../hooks/useNotificationsList';
import { useGlobalScrollToTop } from '../../hooks/useGlobalScrollToTop';
import { useAuthSession } from '../../hooks/useSession';
import { routes } from '../../navigation/routes';
import { NotificationItem } from '../../components/NotificationItem';
import { EmptyState } from '../../components/EmptyState';
import { SkeletonCard } from '../../components/SkeletonCard';
import { Text } from '../../components/Typography';
import { TransitionItem } from '../../components/motion/TransitionItem';
import { APP_PAGE_GUTTER } from '../../styles/layout';

export default function NotificationsScreen() {
  const { user } = useAuthSession();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useNotificationsList();
  const markAllRead = useMarkAllRead();
  const listRef = useRef<FlatList<any> | null>(null);
  const scrollTopVisibleRef = useRef(false);
  const [showScrollTopButton, setShowScrollTopButton] = useState(false);

  const setScrollTopVisible = useCallback((visible: boolean) => {
    if (scrollTopVisibleRef.current === visible) return;
    scrollTopVisibleRef.current = visible;
    setShowScrollTopButton(visible);
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setScrollTopVisible(event.nativeEvent.contentOffset.y > 220);
    },
    [setScrollTopVisible]
  );

  const handleScrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;
  const showNotificationList = notifications.length > 0 && !isLoading;

  useGlobalScrollToTop({
    visible: showScrollTopButton,
    enabled: Boolean(user) && showNotificationList,
    onScrollToTop: handleScrollToTop,
  });

  useEffect(() => {
    if (!user || !showNotificationList) {
      setScrollTopVisible(false);
    }
  }, [setScrollTopVisible, showNotificationList, user]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ title: 'Notifications' }} />
        <TransitionItem variant="card" index={0}>
          <EmptyState
            icon="notifications-outline"
            title="Sign in to see notifications"
            actionLabel="Sign in"
            onAction={() => router.push(routes.onboarding() as never)}
          />
        </TransitionItem>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title: 'Notifications' }} />
      <TransitionItem variant="header" index={0}>
        <View style={styles.header}>
          <Text style={styles.title}>Notifications</Text>
          {unreadCount > 0 ? (
            <TouchableOpacity onPress={() => markAllRead.mutate()} disabled={markAllRead.isPending}>
              <Text style={styles.markRead}>Mark all read</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </TransitionItem>

      {isLoading ? (
        <View style={{ paddingHorizontal: APP_PAGE_GUTTER, paddingVertical: 16 }}>
          {[1, 2, 3].map((item, index) => (
            <TransitionItem key={item} variant="listItem" index={index + 1}>
              <SkeletonCard />
            </TransitionItem>
          ))}
        </View>
      ) : notifications.length === 0 ? (
        <TransitionItem variant="card" index={1}>
          <EmptyState
            icon="notifications-outline"
            title="No notifications yet"
            message="We'll let you know when something happens."
          />
        </TransitionItem>
      ) : (
        <FlatList
          ref={listRef}
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TransitionItem variant="listItem" index={index + 1} animate={index < 10}>
              <NotificationItem notification={item} />
            </TransitionItem>
          )}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E0E5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: APP_PAGE_GUTTER,
    paddingTop: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  markRead: {
    fontSize: 14,
    color: '#2563EB',
    fontWeight: '500',
  },
});
