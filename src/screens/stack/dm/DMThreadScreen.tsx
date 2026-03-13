import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../../../lib/api';
import { useAuthSession } from '../../../hooks/useSession';
import { supabase } from '../../../lib/supabase';
import { SkeletonBlock } from '../../../components/SkeletonBlock';
import { Text } from '../../../components/Typography';

const GRID = 8;

const C = {
  page: '#E5E0E5',
  charcoal: '#2D2D2D',
  charcoal70: 'rgba(45,45,45,0.7)',
  charcoal60: 'rgba(45,45,45,0.6)',
  charcoal50: 'rgba(45,45,45,0.5)',
  charcoal12: 'rgba(45,45,45,0.12)',
  charcoal08: 'rgba(45,45,45,0.08)',
  white: '#FFFFFF',
  wine: '#722F37',
  sage: '#7D9B76',
  card: '#9DAB9B',
  myBubble: '#722F37',
  theirBubble: 'rgba(255,255,255,0.9)',
  inputBg: 'rgba(255,255,255,0.95)',
};

type MessageStatus = 'sending' | 'sent' | 'failed';

interface MessageDto {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  status?: MessageStatus;
  is_local?: boolean;
}

interface MessagesApiResponse {
  messages: MessageDto[];
  conversation?: {
    id: string;
    other_user_id: string;
    other_user_name: string;
    other_user_avatar?: string | null;
    business_name?: string | null;
  };
}

interface SendMessageResponse {
  message: MessageDto;
}

function formatMessageTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

function MessageBubble({
  message,
  isMine,
  isLastInGroup,
  onRetry,
  otherAvatar,
}: {
  message: MessageDto;
  isMine: boolean;
  isLastInGroup: boolean;
  onRetry?: () => void;
  otherAvatar?: string | null;
}) {
  const isFailed = message.status === 'failed';
  const isSending = message.status === 'sending';

  return (
    <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowTheirs]}>
      {/* Avatar on last message in group (their side only) */}
      {!isMine && (
        <View style={styles.bubbleAvatarSlot}>
          {isLastInGroup ? (
            otherAvatar ? (
              <Image source={{ uri: otherAvatar }} style={styles.bubbleAvatar} />
            ) : (
              <View style={[styles.bubbleAvatar, styles.bubbleAvatarFallback]}>
                <Ionicons name="person" size={12} color={C.charcoal50} />
              </View>
            )
          ) : null}
        </View>
      )}

      <View style={[styles.bubbleWrap, isMine ? styles.bubbleWrapMine : styles.bubbleWrapTheirs]}>
        <View
          style={[
            styles.bubble,
            isMine ? styles.bubbleMine : styles.bubbleTheirs,
            // Instagram-style corner radii — tighten the corner nearest adjacent bubble
            isMine
              ? isLastInGroup
                ? styles.bubbleMineLastInGroup
                : styles.bubbleMineMiddle
              : isLastInGroup
                ? styles.bubbleTheirsLastInGroup
                : styles.bubbleTheirsMiddle,
            isFailed ? styles.bubbleFailed : null,
          ]}
        >
          <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs]}>
            {message.body}
          </Text>
        </View>

        {/* Status row — only on mine, last in group */}
        {isMine && isLastInGroup && (
          <View style={styles.statusRow}>
            {isSending && (
              <ActivityIndicator size={10} color={C.charcoal50} style={styles.statusIcon} />
            )}
            {isFailed && (
              <Pressable style={styles.retryBtn} onPress={onRetry}>
                <Ionicons name="alert-circle" size={13} color={C.wine} />
                <Text style={styles.retryText}>Failed · Tap to retry</Text>
              </Pressable>
            )}
            {!isSending && !isFailed && (
              <Text style={styles.statusText}>{formatMessageTime(message.created_at)}</Text>
            )}
          </View>
        )}
        {/* Timestamp on their last in group */}
        {!isMine && isLastInGroup && (
          <Text style={styles.theirTimestamp}>{formatMessageTime(message.created_at)}</Text>
        )}
      </View>
    </View>
  );
}

export default function DMThreadScreen() {
  const { threadId } = useLocalSearchParams<{ threadId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthSession();
  const queryClient = useQueryClient();

  const [inputText, setInputText] = useState('');
  const [localMessages, setLocalMessages] = useState<MessageDto[]>([]);
  const listRef = useRef<FlatList<MessageDto>>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['messages', threadId],
    queryFn: () => apiFetch<MessagesApiResponse>(`/api/conversations/${threadId}/messages`),
    enabled: Boolean(threadId) && Boolean(user),
    staleTime: 15_000,
  });

  const conversation = data?.conversation;
  const serverMessages = data?.messages ?? [];
  const allMessages = [...serverMessages, ...localMessages];

  const sendMutation = useMutation({
    mutationFn: (body: string) =>
      apiFetch<SendMessageResponse>(`/api/conversations/${threadId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ body }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages', threadId] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });

  // Realtime subscription
  useEffect(() => {
    if (!threadId || !user?.id) return;

    const channel = supabase
      .channel(`messages-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${threadId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['messages', threadId] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [threadId, user?.id, queryClient]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (allMessages.length > 0) {
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [allMessages.length]);

  const handleSend = useCallback(async () => {
    const body = inputText.trim();
    if (!body) return;

    setInputText('');

    const localId = `local-${Date.now()}`;
    const localMsg: MessageDto = {
      id: localId,
      sender_id: user?.id ?? '',
      body,
      created_at: new Date().toISOString(),
      status: 'sending',
      is_local: true,
    };

    setLocalMessages((prev) => [...prev, localMsg]);

    try {
      await sendMutation.mutateAsync(body);
      setLocalMessages((prev) => prev.filter((m) => m.id !== localId));
    } catch {
      setLocalMessages((prev) =>
        prev.map((m) => m.id === localId ? { ...m, status: 'failed' } : m)
      );
    }
  }, [inputText, sendMutation, user?.id]);

  const handleRetry = useCallback((msg: MessageDto) => {
    const body = msg.body;
    setLocalMessages((prev) => prev.filter((m) => m.id !== msg.id));
    setInputText(body);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: MessageDto; index: number }) => {
      const isMine = item.sender_id === user?.id;
      const nextMsg = allMessages[index + 1];
      const isLastInGroup = !nextMsg || nextMsg.sender_id !== item.sender_id;

      return (
        <MessageBubble
          message={item}
          isMine={isMine}
          isLastInGroup={isLastInGroup}
          onRetry={item.status === 'failed' ? () => handleRetry(item) : undefined}
          otherAvatar={conversation?.other_user_avatar}
        />
      );
    },
    [allMessages, conversation?.other_user_avatar, handleRetry, user?.id]
  );

  const otherName = conversation?.other_user_name ?? 'Conversation';
  const businessName = conversation?.business_name;

  return (
    <View style={[styles.root, { backgroundColor: C.page }]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + GRID * 1.5 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={22} color={C.charcoal} />
        </Pressable>
        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{otherName}</Text>
          {businessName && (
            <View style={styles.headerBiz}>
              <Ionicons name="storefront-outline" size={11} color={C.charcoal50} />
              <Text style={styles.headerBizText} numberOfLines={1}>{businessName}</Text>
            </View>
          )}
        </View>
        {conversation?.other_user_avatar ? (
          <Image source={{ uri: conversation.other_user_avatar }} style={styles.headerAvatar} />
        ) : (
          <View style={[styles.headerAvatar, styles.headerAvatarFallback]}>
            <Ionicons name="person" size={16} color={C.charcoal50} />
          </View>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        {isLoading ? (
          <View style={styles.skeletonList}>
            {[0, 1, 2, 3].map((i) => (
              <SkeletonBlock
                key={i}
                style={[
                  styles.skeletonBubble,
                  i % 2 === 0 ? styles.skeletonBubbleMine : styles.skeletonBubbleTheirs,
                ]}
              />
            ))}
          </View>
        ) : error ? (
          <View style={styles.errorState}>
            <Text style={styles.errorText}>Could not load messages.</Text>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={allMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={[
              styles.messageList,
              { paddingBottom: GRID * 2 },
            ]}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
            ListEmptyComponent={
              <View style={styles.emptyThread}>
                <Text style={styles.emptyThreadText}>No messages yet. Say hello!</Text>
              </View>
            }
          />
        )}

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            { paddingBottom: insets.bottom + GRID },
          ]}
        >
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Message…"
              placeholderTextColor={C.charcoal50}
              multiline
              maxLength={2000}
              returnKeyType="default"
              blurOnSubmit={false}
            />
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.sendBtn,
              !inputText.trim() ? styles.sendBtnDisabled : null,
              pressed && inputText.trim() ? styles.sendBtnPressed : null,
            ]}
            onPress={handleSend}
            disabled={!inputText.trim()}
          >
            <Ionicons
              name="arrow-up"
              size={20}
              color={inputText.trim() ? C.white : C.charcoal50}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: GRID * 2,
    paddingBottom: GRID * 1.5,
    gap: GRID,
    borderBottomWidth: 1,
    borderBottomColor: C.charcoal08,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.charcoal08,
    flexShrink: 0,
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: C.charcoal,
    letterSpacing: -0.2,
  },
  headerBiz: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  headerBizText: {
    fontSize: 12,
    color: C.charcoal50,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 999,
    flexShrink: 0,
  },
  headerAvatarFallback: {
    backgroundColor: C.charcoal12,
    alignItems: 'center',
    justifyContent: 'center',
  },

  messageList: {
    paddingHorizontal: GRID * 2,
    paddingTop: GRID * 2,
    gap: 2,
  },

  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginVertical: 1,
  },
  bubbleRowMine: {
    justifyContent: 'flex-end',
  },
  bubbleRowTheirs: {
    justifyContent: 'flex-start',
  },
  bubbleAvatarSlot: {
    width: 28,
    marginRight: GRID,
  },
  bubbleAvatar: {
    width: 28,
    height: 28,
    borderRadius: 999,
  },
  bubbleAvatarFallback: {
    backgroundColor: C.charcoal12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleWrap: {
    maxWidth: '75%',
    gap: 3,
  },
  bubbleWrapMine: {
    alignItems: 'flex-end',
  },
  bubbleWrapTheirs: {
    alignItems: 'flex-start',
  },
  bubble: {
    paddingHorizontal: GRID * 1.75,
    paddingVertical: GRID * 1.25,
  },
  bubbleMine: {
    backgroundColor: C.myBubble,
    borderRadius: 20,
  },
  bubbleTheirs: {
    backgroundColor: C.theirBubble,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: C.charcoal08,
  },
  // Instagram-style: tighten inner corners when not last in group
  bubbleMineLastInGroup: {
    borderBottomRightRadius: 6,
  },
  bubbleMineMiddle: {
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
  },
  bubbleTheirsLastInGroup: {
    borderBottomLeftRadius: 6,
  },
  bubbleTheirsMiddle: {
    borderTopLeftRadius: 6,
    borderBottomLeftRadius: 6,
  },
  bubbleFailed: {
    opacity: 0.6,
  },
  bubbleText: {
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextMine: {
    color: C.white,
  },
  bubbleTextTheirs: {
    color: C.charcoal,
  },

  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 4,
  },
  statusIcon: {
    marginRight: 2,
  },
  statusText: {
    fontSize: 11,
    color: C.charcoal50,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  retryText: {
    fontSize: 11,
    color: C.wine,
    fontWeight: '600',
  },
  theirTimestamp: {
    fontSize: 11,
    color: C.charcoal50,
    paddingLeft: 4,
  },

  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: GRID,
    paddingHorizontal: GRID * 2,
    paddingTop: GRID * 1.5,
    borderTopWidth: 1,
    borderTopColor: C.charcoal08,
    backgroundColor: C.page,
  },
  inputWrap: {
    flex: 1,
    backgroundColor: C.inputBg,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(45,45,45,0.15)',
    paddingHorizontal: GRID * 2,
    paddingVertical: GRID * 1.25,
    minHeight: GRID * 5.5,
    justifyContent: 'center',
  },
  input: {
    fontSize: 15,
    color: C.charcoal,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: C.myBubble,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginBottom: 1,
  },
  sendBtnDisabled: {
    backgroundColor: C.charcoal12,
  },
  sendBtnPressed: {
    opacity: 0.85,
  },

  emptyThread: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: GRID * 8,
  },
  emptyThreadText: {
    fontSize: 14,
    color: C.charcoal50,
  },

  errorState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 15,
    color: C.charcoal50,
  },

  skeletonList: {
    flex: 1,
    paddingHorizontal: GRID * 2,
    paddingTop: GRID * 2,
    gap: GRID * 1.5,
  },
  skeletonBubble: {
    height: 44,
    borderRadius: 20,
    maxWidth: '65%',
  },
  skeletonBubbleMine: {
    alignSelf: 'flex-end',
  },
  skeletonBubbleTheirs: {
    alignSelf: 'flex-start',
  },
});
