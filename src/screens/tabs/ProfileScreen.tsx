import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthSession } from '../../hooks/useSession';
import { useNotifications } from '../../hooks/useNotifications';
import { useProfile, useUpdateProfile } from '../../hooks/useProfile';
import { useGlobalScrollToTop } from '../../hooks/useGlobalScrollToTop';
import { routes } from '../../navigation/routes';
import { AppHeader } from '../../components/AppHeader';
import { LinkRow } from '../../components/LinkRow';
import { SkeletonBlock } from '../../components/SkeletonBlock';
import { Text, TextInput } from '../../components/Typography';
import { useSecurity } from '../../providers/SecurityProvider';

function ProfileSkeleton() {
  return (
    <>
      <View style={styles.avatarSection}>
        <SkeletonBlock style={styles.skeletonAvatar} />
        <SkeletonBlock style={styles.skeletonName} />
        <SkeletonBlock style={styles.skeletonUsername} />
        <SkeletonBlock style={styles.skeletonEmail} />
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <SkeletonBlock style={styles.skeletonStatNum} />
          <SkeletonBlock style={styles.skeletonStatLabel} />
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <SkeletonBlock style={styles.skeletonStatNum} />
          <SkeletonBlock style={styles.skeletonStatLabel} />
        </View>
      </View>

      <View style={styles.links}>
        {Array.from({ length: 7 }, (_, index) => (
          <View key={`profile-link-skeleton-${index}`} style={styles.linkSkeletonRow}>
            <View style={styles.linkSkeletonCopy}>
              <SkeletonBlock style={styles.linkSkeletonTitle} />
              <SkeletonBlock style={styles.linkSkeletonSubtitle} />
            </View>
            <SkeletonBlock style={styles.linkSkeletonChevron} />
          </View>
        ))}
      </View>
    </>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuthSession();
  const { guardSensitiveAction } = useSecurity();
  const { unreadCount } = useNotifications();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useProfile();
  const updateProfile = useUpdateProfile();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollTopVisibleRef = useRef(false);
  const [showScrollTopButton, setShowScrollTopButton] = useState(false);

  const profile = data?.data;

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
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  useGlobalScrollToTop({
    visible: showScrollTopButton,
    enabled: Boolean(user),
    onScrollToTop: handleScrollToTop,
  });

  useEffect(() => {
    if (!user) {
      setScrollTopVisible(false);
    }
  }, [setScrollTopVisible, user]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Profile" subtitle="Sign in to access your account" showBell />
        <View style={styles.center}>
          <Text style={styles.sub}>You're not signed in.</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.push(routes.login() as never)}>
            <Text style={styles.btnTxt}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.btn, styles.secondaryBtn]}
            onPress={() => router.push(routes.register() as never)}
          >
            <Text style={styles.secondaryBtnTxt}>Create account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async () => {
    if (!displayName.trim()) return;
    try {
      await updateProfile.mutateAsync({ display_name: displayName.trim() });
      setEditing(false);
    } catch {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const handleSignOut = async () => {
    const gate = guardSensitiveAction('account_action');
    if (!gate.allowed) {
      Alert.alert('Action blocked', gate.reason || 'This action is blocked on this device.');
      return;
    }
    try {
      await signOut();
    } catch {
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        ref={scrollRef}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        <AppHeader title="Profile" subtitle="Account, achievements, and settings" showBell />

        {isLoading ? (
          <ProfileSkeleton />
        ) : (
          <>
            <View style={styles.avatarSection}>
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.avatar} contentFit="cover" />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={36} color="#9CA3AF" />
                </View>
              )}

              {editing ? (
                <View style={styles.editRow}>
                  <TextInput
                    style={styles.nameInput}
                    value={displayName}
                    onChangeText={setDisplayName}
                    placeholder="Display name"
                    autoFocus
                  />
                  <TouchableOpacity onPress={handleSave} disabled={updateProfile.isPending}>
                    <Text style={styles.saveBtn}>
                      {updateProfile.isPending ? 'Saving...' : 'Save'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => setEditing(false)}>
                    <Text style={styles.cancelBtn}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.nameRow}
                  onPress={() => {
                    setDisplayName(profile?.display_name ?? '');
                    setEditing(true);
                  }}
                >
                  <Text style={styles.displayName}>
                    {profile?.display_name || user.email?.split('@')[0] || 'User'}
                  </Text>
                  <Ionicons
                    name="pencil-outline"
                    size={16}
                    color="#9CA3AF"
                    style={{ marginLeft: 6 }}
                  />
                </TouchableOpacity>
              )}

              {profile?.username ? <Text style={styles.username}>@{profile.username}</Text> : null}
              <Text style={styles.email}>{user.email}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{(profile as { review_count?: number })?.review_count ?? 0}</Text>
                <Text style={styles.statLabel}>Reviews</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>{(profile as { badge_count?: number })?.badge_count ?? 0}</Text>
                <Text style={styles.statLabel}>Badges</Text>
              </View>
            </View>

            <View style={styles.links}>
              <LinkRow
                title="Notifications"
                subtitle="Reads, replies, and updates"
                badge={unreadCount > 0 ? (unreadCount > 99 ? '99+' : unreadCount) : undefined}
                onPress={() => router.push(routes.notifications() as never)}
              />
              <LinkRow
                title="Messages"
                subtitle="Your direct conversations"
                onPress={() => router.push(routes.dmInbox() as never)}
              />
              <LinkRow
                title="Achievements"
                subtitle="Track your milestones"
                onPress={() => router.push(routes.achievements() as never)}
              />
              <LinkRow
                title="Badges"
                subtitle="See your earned badges"
                onPress={() => router.push(routes.badges() as never)}
              />
              <LinkRow
                title="Interests"
                subtitle="Tune recommendations"
                onPress={() => router.push(routes.interests() as never)}
              />
              <LinkRow
                title="Deal breakers"
                subtitle="Control what gets filtered out"
                onPress={() => router.push(routes.dealBreakers() as never)}
              />
              <LinkRow
                title="Leaderboard"
                subtitle="See top contributors"
                onPress={() => router.push(routes.leaderboard() as never)}
              />
              <LinkRow title="About" subtitle="Learn about Sayso" onPress={() => router.push(routes.about() as never)} />
              <LinkRow title="Contact" subtitle="Reach support" onPress={() => router.push(routes.contact() as never)} />
              <LinkRow title="Privacy" subtitle="Privacy policy" onPress={() => router.push(routes.privacy() as never)} />
              <LinkRow title="Terms" subtitle="Terms of use" onPress={() => router.push(routes.terms() as never)} />
            </View>
          </>
        )}

        <View style={styles.actions}>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
            <Ionicons name="log-out-outline" size={18} color="#EF4444" />
            <Text style={styles.signOutTxt}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E5E0E5' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  sub: { fontSize: 15, color: '#6B7280', marginTop: 8 },
  btn: {
    marginTop: 20,
    backgroundColor: '#111827',
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  btnTxt: { color: '#FFF', fontWeight: '600', fontSize: 14 },
  secondaryBtnTxt: { color: '#111827', fontWeight: '600', fontSize: 14 },
  avatarSection: { alignItems: 'center', paddingTop: 24, paddingBottom: 16 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#F3F4F6' },
  avatarPlaceholder: { alignItems: 'center', justifyContent: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  displayName: { fontSize: 20, fontWeight: '700', color: '#111827' },
  username: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  email: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
  editRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14 },
  nameInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 15,
    color: '#111827',
    minWidth: 140,
  },
  saveBtn: { color: '#2563EB', fontWeight: '600', fontSize: 14 },
  cancelBtn: { color: '#9CA3AF', fontSize: 14 },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: 32,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    borderRadius: 16,
    overflow: 'hidden',
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 16 },
  statNum: { fontSize: 22, fontWeight: '800', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#F3F4F6' },
  links: {
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  actions: { padding: 24, marginTop: 8 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 999,
    paddingVertical: 14,
    backgroundColor: '#FFF9F9',
  },
  signOutTxt: { color: '#EF4444', fontWeight: '600', fontSize: 15 },
  skeletonAvatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
  },
  skeletonName: {
    width: 186,
    height: 22,
    borderRadius: 10,
    marginTop: 14,
  },
  skeletonUsername: {
    width: 108,
    height: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  skeletonEmail: {
    width: 156,
    height: 12,
    borderRadius: 6,
    marginTop: 6,
  },
  skeletonStatNum: {
    width: 42,
    height: 22,
    borderRadius: 10,
  },
  skeletonStatLabel: {
    width: 52,
    height: 11,
    borderRadius: 6,
    marginTop: 6,
  },
  linkSkeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  linkSkeletonCopy: {
    flex: 1,
    gap: 6,
    paddingRight: 12,
  },
  linkSkeletonTitle: {
    width: '46%',
    height: 14,
    borderRadius: 7,
  },
  linkSkeletonSubtitle: {
    width: '72%',
    height: 11,
    borderRadius: 6,
  },
  linkSkeletonChevron: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});
