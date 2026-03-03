import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useTrending } from '../../src/hooks/useTrending';
import { BusinessCard } from '../../src/components/BusinessCard';
import { SkeletonCard } from '../../src/components/SkeletonCard';
import { EmptyState } from '../../src/components/EmptyState';
import { Text } from '../../src/components/Typography';

export default function HomeScreen() {
  const { data, isLoading, isError, refetch, isRefetching } = useTrending(20);

  const businesses = data?.businesses ?? [];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.appName}>Sayso</Text>
          <Text style={styles.subtitle}>Discover Cape Town</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trending Now</Text>

          {isLoading ? (
            <View style={styles.grid}>
              {[1, 2, 3, 4].map((i) => (
                <View key={i} style={styles.gridItem}>
                  <SkeletonCard />
                </View>
              ))}
            </View>
          ) : isError ? (
            <EmptyState
              icon="wifi-outline"
              title="Couldn't load businesses"
              message="Check your connection and pull down to retry."
            />
          ) : businesses.length === 0 ? (
            <EmptyState
              icon="storefront-outline"
              title="Nothing trending yet"
              message="Check back soon!"
            />
          ) : (
            <View style={styles.grid}>
              {businesses.map((b) => (
                <View key={b.id} style={styles.gridItem}>
                  <BusinessCard business={b} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 8,
  },
  appName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#6B7280',
    marginTop: 2,
  },
  section: {
    paddingTop: 20,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  grid: {
    paddingHorizontal: 16,
    gap: 12,
  },
  gridItem: {
    flex: 1,
  },
});
