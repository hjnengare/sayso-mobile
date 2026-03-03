import {
  FlatList,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSavedBusinesses, useUnsaveBusiness } from '../../src/hooks/useSavedBusinesses';
import { useAuthSession } from '../../src/hooks/useSession';
import { BusinessCard } from '../../src/components/BusinessCard';
import { EmptyState } from '../../src/components/EmptyState';
import { SkeletonCard } from '../../src/components/SkeletonCard';
import { Text } from '../../src/components/Typography';

export default function SavedScreen() {
  const { user } = useAuthSession();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useSavedBusinesses();
  const unsave = useUnsaveBusiness();

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon="bookmark-outline"
          title="Sign in to see your saved places"
          message="Save your favourite Cape Town businesses to find them again easily."
          actionLabel="Sign in"
          onAction={() => router.replace('/login')}
        />
      </SafeAreaView>
    );
  }

  const businesses = data?.businesses ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Saved</Text>
        {businesses.length > 0 && (
          <Text style={styles.count}>
            {businesses.length} place{businesses.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {isLoading ? (
        <View style={styles.list}>
          {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </View>
      ) : businesses.length === 0 ? (
        <EmptyState
          icon="bookmark-outline"
          title="Nothing saved yet"
          message="Tap the bookmark on any business to save it here."
          actionLabel="Explore businesses"
          onAction={() => router.push('/')}
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
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  count: {
    fontSize: 14,
    color: '#6B7280',
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
    borderRadius: 8,
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
