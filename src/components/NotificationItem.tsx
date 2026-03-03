import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NotificationDto } from '@sayso/contracts';
import { Text } from './Typography';

const TYPE_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  review: 'star-outline',
  business: 'storefront-outline',
  badge_earned: 'ribbon-outline',
  review_helpful: 'thumbs-up-outline',
  claim_approved: 'checkmark-circle-outline',
  business_approved: 'checkmark-circle-outline',
  comment_reply: 'chatbubble-outline',
  milestone_achievement: 'trophy-outline',
  message: 'mail-outline',
};

function timeAgo(dateStr: string): string {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

type Props = { notification: NotificationDto };

export function NotificationItem({ notification }: Props) {
  const icon = TYPE_ICONS[notification.type] ?? 'notifications-outline';

  return (
    <View style={[styles.container, !notification.read && styles.unread]}>
      <View style={styles.iconWrap}>
        <Ionicons name={icon} size={20} color="#374151" />
      </View>
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{notification.title}</Text>
        <Text style={styles.message} numberOfLines={2}>{notification.message}</Text>
        <Text style={styles.time}>{timeAgo(notification.created_at)}</Text>
      </View>
      {!notification.read && <View style={styles.dot} />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F3F4F6',
  },
  unread: {
    backgroundColor: '#F9FAFB',
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    flexShrink: 0,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  message: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
    lineHeight: 18,
  },
  time: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563EB',
    marginTop: 6,
    marginLeft: 8,
    flexShrink: 0,
  },
});
