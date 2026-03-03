import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useNotificationsList, useMarkAllRead } from '../../src/hooks/useNotificationsList';
import { useAuthSession } from '../../src/hooks/useSession';
import { NotificationItem } from '../../src/components/NotificationItem';
import { EmptyState } from '../../src/components/EmptyState';
import { SkeletonCard } from '../../src/components/SkeletonCard';
import { Text } from '../../src/components/Typography';

export default function NotificationsScreen() {
  const { user } = useAuthSession();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useNotificationsList();
  const markAllRead = useMarkAllRead();

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="notifications-outline"
          title="Sign in to see notifications"
          actionLabel="Sign in"
          onAction={() => router.replace('/login')}
        />
      </SafeAreaView>
    );
  }

  const notifications = data?.notifications ?? [];
  const unreadCount = data?.unreadCount ?? 0;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notifications</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            onPress={() => markAllRead.mutate()}
            disabled={markAllRead.isPending}
          >
            <Text style={styles.markRead}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <View style={{ padding: 16 }}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          title="No notifications yet"
          message="We'll let you know when something happens."
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <NotificationItem notification={item} />}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
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
