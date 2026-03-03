import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useAuthSession } from '../../src/hooks/useSession';
import { useProfile, useUpdateProfile } from '../../src/hooks/useProfile';
import { Text, TextInput } from '../../src/components/Typography';

export default function ProfileScreen() {
  const { user, signOut } = useAuthSession();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useProfile();
  const updateProfile = useUpdateProfile();

  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState('');

  const profile = data?.data;

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.sub}>You're not signed in.</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.replace('/login')}>
            <Text style={styles.btnTxt}>Sign in</Text>
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
    try {
      await signOut();
    } catch {
      Alert.alert('Error', 'Failed to sign out.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#111827" />
          </View>
        ) : (
          <>
            <View style={styles.avatarSection}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatar}
                  contentFit="cover"
                />
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

              {profile?.username && (
                <Text style={styles.username}>@{profile.username}</Text>
              )}
              <Text style={styles.email}>{user.email}</Text>
            </View>

            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Text style={styles.statNum}>{(profile as any)?.review_count ?? 0}</Text>
                <Text style={styles.statLabel}>Reviews</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <Text style={styles.statNum}>{(profile as any)?.badge_count ?? 0}</Text>
                <Text style={styles.statLabel}>Badges</Text>
              </View>
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
  container: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  sub: { fontSize: 15, color: '#6B7280', marginTop: 8 },
  btn: {
    marginTop: 20,
    backgroundColor: '#111827',
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  btnTxt: { color: '#FFF', fontWeight: '600', fontSize: 14 },
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
  actions: { padding: 24, marginTop: 8 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    borderRadius: 12,
    paddingVertical: 14,
    backgroundColor: '#FFF9F9',
  },
  signOutTxt: { color: '#EF4444', fontWeight: '600', fontSize: 15 },
});
