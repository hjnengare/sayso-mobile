import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api';
import { useAuthSession } from '../../../hooks/useSession';
import { supabase } from '../../../lib/supabase';
import { routes } from '../../../navigation/routes';
import { SkeletonBlock } from '../../../components/SkeletonBlock';
import { Text } from '../../../components/Typography';

const GRID = 8;

const C = {
  page: '#E5E0E5',
  card: '#9DAB9B',
  charcoal: '#2D2D2D',
  charcoal70: 'rgba(45,45,45,0.7)',
  charcoal60: 'rgba(45,45,45,0.6)',
  charcoal50: 'rgba(45,45,45,0.5)',
  charcoal20: 'rgba(45,45,45,0.2)',
  charcoal08: 'rgba(45,45,45,0.08)',
  white: '#FFFFFF',
  wine: '#722F37',
  sage: '#7D9B76',
  inputBg: 'rgba(255,255,255,0.9)',
};

export interface ConversationDto {
  id: string;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar?: string | null;
  business_id?: string | null;
  business_name?: string | null;
  last_message?: string | null;
  last_message_at?: string | null;
  unread_count: number;
}

interface ConversationsApiResponse {
  conversations: ConversationDto[];
}

function formatTimestamp(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) {
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function ConversationRow({ item, onPress }: { item: ConversationDto; onPress: () => void }) {
  const hasUnread = item.unread_count > 0;

  return (
    <Pressable
      style={({ pressed }) => [styles.convRow, pressed ? styles.convRowPressed : null]}
      onPress={onPress}
    >
      {/* Avatar */}
      <View style={styles.convAvatarWrap}>
        {item.other_user_avatar ? (
          <Image source={{ uri: item.other_user_avatar }} style={styles.convAvatar} />
        ) : (
          <View style={[styles.convAvatar, styles.convAvatarFallback]}>
            <Text style={styles.convAvatarInitial}>
              {item.other_user_name.charAt(0).toUpperCase()}
            </Text>
          </View>
        )}
        {hasUnread && <View style={styles.unreadDot} />}
      </View>

      {/* Content */}
      <View style={styles.convContent}>
        <View style={styles.convTopRow}>
          <Text style={[styles.convName, hasUnread ? styles.convNameUnread : null]} numberOfLines={1}>
            {item.other_user_name}
          </Text>
          <Text style={styles.convTime}>{formatTimestamp(item.last_message_at)}</Text>
        </View>
        {item.business_name && (
          <View style={styles.convBizTag}>
            <Ionicons name="storefront-outline" size={11} color={C.charcoal50} />
            <Text style={styles.convBizName} numberOfLines={1}>{item.business_name}</Text>
          </View>
        )}
        <Text
          style={[styles.convPreview, hasUnread ? styles.convPreviewUnread : null]}
          numberOfLines={1}
        >
          {item.last_message ?? 'No messages yet'}
        </Text>
      </View>

      {hasUnread && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadBadgeText}>
            {item.unread_count > 99 ? '99+' : String(item.unread_count)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function ConversationSkeleton() {
  return (
    <View style={styles.skeletonRow}>
      <SkeletonBlock style={styles.skeletonAvatar} />
      <View style={styles.skeletonContent}>
        <SkeletonBlock style={styles.skeletonName} />
        <SkeletonBlock style={styles.skeletonPreview} />
      </View>
    </View>
  );
}

export default function DMInboxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthSession();
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['conversations', user?.id],
    queryFn: () => apiFetch<ConversationsApiResponse>('/api/conversations'),
    enabled: Boolean(user),
    staleTime: 30_000,
  });

  const conversations = data?.conversations ?? [];

  const filteredConversations = searchQuery.trim()
    ? conversations.filter(
        (c) =>
          c.other_user_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (c.business_name ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  // Realtime subscription for new messages
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`dm-inbox-${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'conversations', filter: `user_id=eq.${user.id}` },
        () => { refetch(); }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, refetch]);

  const handleConversationPress = useCallback(
    (id: string) => { router.push(routes.dmThread(id) as never); },
    [router]
  );

  if (!user) {
    return (
      <SafeAreaView style={[styles.root, { backgroundColor: C.page }]}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={styles.unauthState}>
          <Ionicons name="chatbubble-outline" size={48} color={C.charcoal50} />
          <Text style={styles.unauthTitle}>Sign in to view messages</Text>
          <Text style={styles.unauthSubtitle}>
            Messages with businesses will appear here once you're signed in.
          </Text>
          <Pressable
            style={({ pressed }) => [styles.signInBtn, pressed ? styles.signInBtnPressed : null]}
            onPress={() => router.push(routes.login() as never)}
          >
            <Text style={styles.signInBtnText}>Sign in</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: C.page }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + GRID * 1.5 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={C.charcoal} />
        </Pressable>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchRow}>
          <Ionicons name="search-outline" size={16} color={C.charcoal50} />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search conversations…"
            placeholderTextColor={C.charcoal50}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={C.charcoal50} />
            </Pressable>
          )}
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View style={styles.skeletonList}>
          {[0, 1, 2, 3, 4].map((i) => <ConversationSkeleton key={i} />)}
        </View>
      ) : error ? (
        <View style={styles.errorState}>
          <Ionicons name="alert-circle-outline" size={40} color={C.charcoal50} />
          <Text style={styles.errorText}>Could not load messages.</Text>
          <Pressable style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryText}>Try again</Text>
          </Pressable>
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="chatbubbles-outline" size={48} color={C.charcoal50} />
          <Text style={styles.emptyTitle}>
            {searchQuery ? 'No conversations match your search' : 'No messages yet'}
          </Text>
          {!searchQuery && (
            <Text style={styles.emptySubtitle}>
              Messages from businesses you've interacted with will appear here.
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConversationRow
              item={item}
              onPress={() => handleConversationPress(item.id)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: insets.bottom + GRID * 2 },
          ]}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GRID * 2,
    paddingBottom: GRID * 1.5,
    gap: GRID,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(45,45,45,0.08)',
    flexShrink: 0,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: C.charcoal,
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
  },

  searchWrap: {
    paddingHorizontal: GRID * 2,
    paddingBottom: GRID * 1.5,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: GRID,
    backgroundColor: C.inputBg,
    borderRadius: 999,
    paddingHorizontal: GRID * 2,
    minHeight: GRID * 5.5,
    borderWidth: 1,
    borderColor: 'rgba(45,45,45,0.12)',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: C.charcoal,
  },

  listContent: {
    paddingHorizontal: GRID * 2,
  },
  separator: {
    height: 1,
    backgroundColor: C.charcoal08,
    marginLeft: GRID * 2 + 52,
  },

  convRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: GRID * 1.5,
    gap: GRID * 1.5,
  },
  convRowPressed: {
    opacity: 0.7,
  },
  convAvatarWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  convAvatar: {
    width: 52,
    height: 52,
    borderRadius: 999,
  },
  convAvatarFallback: {
    backgroundColor: C.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  convAvatarInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: C.white,
  },
  unreadDot: {
    position: 'absolute',
    top: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 999,
    backgroundColor: C.wine,
    borderWidth: 2,
    borderColor: C.page,
  },
  convContent: {
    flex: 1,
    gap: 3,
  },
  convTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID,
  },
  convName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: C.charcoal,
  },
  convNameUnread: {
    fontWeight: '700',
  },
  convTime: {
    fontSize: 12,
    color: C.charcoal50,
    flexShrink: 0,
  },
  convBizTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  convBizName: {
    fontSize: 12,
    color: C.charcoal50,
  },
  convPreview: {
    fontSize: 14,
    color: C.charcoal60,
    lineHeight: 19,
  },
  convPreviewUnread: {
    color: C.charcoal,
    fontWeight: '500',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: C.wine,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    flexShrink: 0,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: C.white,
  },

  // Unauthenticated
  unauthState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: GRID * 4,
    gap: GRID * 2,
  },
  unauthTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: C.charcoal,
    textAlign: 'center',
  },
  unauthSubtitle: {
    fontSize: 14,
    color: C.charcoal60,
    textAlign: 'center',
    lineHeight: 20,
  },
  signInBtn: {
    paddingHorizontal: GRID * 3,
    paddingVertical: GRID * 1.5,
    borderRadius: 999,
    backgroundColor: C.wine,
  },
  signInBtnPressed: { opacity: 0.88 },
  signInBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.white,
  },

  // Empty / Error
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: GRID * 4,
    gap: GRID * 1.5,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: C.charcoal,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: C.charcoal60,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: GRID * 1.5,
  },
  errorText: {
    fontSize: 15,
    color: C.charcoal60,
  },
  retryBtn: {
    paddingHorizontal: GRID * 3,
    paddingVertical: GRID * 1.25,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: C.charcoal20,
  },
  retryText: {
    fontSize: 14,
    fontWeight: '600',
    color: C.charcoal,
  },

  // Skeleton
  skeletonList: {
    paddingHorizontal: GRID * 2,
    gap: GRID,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: GRID * 1.5,
    gap: GRID * 1.5,
  },
  skeletonAvatar: {
    width: 52,
    height: 52,
    borderRadius: 999,
    flexShrink: 0,
  },
  skeletonContent: {
    flex: 1,
    gap: GRID,
  },
  skeletonName: {
    height: 14,
    borderRadius: 999,
    width: '50%',
  },
  skeletonPreview: {
    height: 12,
    borderRadius: 999,
    width: '80%',
  },
});
