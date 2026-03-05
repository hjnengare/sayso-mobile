import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSavedBusinesses, useUnsaveBusiness } from '../../hooks/useSavedBusinesses';
import { useAuthSession } from '../../hooks/useSession';
import { routes } from '../../navigation/routes';
import { AppHeader } from '../../components/AppHeader';
import { BusinessCard } from '../../components/BusinessCard';
import { EmptyState } from '../../components/EmptyState';
import { SkeletonCard } from '../../components/SkeletonCard';
import { Text } from '../../components/Typography';

export default function SavedScreen() {
  const { user } = useAuthSession();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useSavedBusinesses();
  const unsave = useUnsaveBusiness();

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <AppHeader title="Saved" subtitle="Your saved businesses and lists" />
        <EmptyState
          icon="bookmark-outline"
          title="Sign in to see your saved places"
          message="Save your favorite businesses to find them again easily."
          actionLabel="Sign in"
          onAction={() => router.push(routes.login() as never)}
        />
      </SafeAreaView>
    );
  }

  const businesses = data?.businesses ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Saved" subtitle="Your bookmarks across the app" />

      {isLoading ? (
        <View style={styles.list}>
          {[1, 2, 3].map((item) => (
            <SkeletonCard key={item} />
          ))}
        </View>
      ) : businesses.length === 0 ? (
        <EmptyState
          icon="bookmark-outline"
          title="Nothing saved yet"
          message="Tap the bookmark on any business to save it here."
          actionLabel="Explore businesses"
          onAction={() => router.push(routes.home() as never)}
        />
      ) : (
        <FlatList
          data={businesses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View>
              <BusinessCard business={item} />
              <TouchableOpacity
                style={styles.unsaveBtn}
                onPress={() => unsave.mutate(item.id)}
                activeOpacity={0.7}
              >
                <Text style={styles.unsaveTxt}>Remove</Text>
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          showsVerticalScrollIndicator={false}
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
  list: {
    padding: 16,
    gap: 12,
  },
  unsaveBtn: {
    alignSelf: 'flex-end',
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFF',
  },
  unsaveTxt: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
});
