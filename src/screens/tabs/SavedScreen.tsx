import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import type { BusinessListItemDto } from '@sayso/contracts';
import { useSavedBusinesses, useUnsaveBusiness } from '../../hooks/useSavedBusinesses';
import { useAuthSession } from '../../hooks/useSession';
import { useGlobalScrollToTop } from '../../hooks/useGlobalScrollToTop';
import { routes } from '../../navigation/routes';
import { AppHeader } from '../../components/AppHeader';
import { BusinessCard } from '../../components/BusinessCard';
import { EmptyState } from '../../components/EmptyState';
import { TransitionItem } from '../../components/motion/TransitionItem';
import { SkeletonCard } from '../../components/SkeletonCard';
import { Text } from '../../components/Typography';

export default function SavedScreen() {
  const { user } = useAuthSession();
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useSavedBusinesses();
  const unsave = useUnsaveBusiness();
  const listRef = useRef<FlatList<BusinessListItemDto> | null>(null);
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

  const businesses = data?.businesses ?? [];
  const showSavedList = businesses.length > 0 && !isLoading;

  useGlobalScrollToTop({
    visible: showScrollTopButton,
    enabled: Boolean(user) && showSavedList,
    onScrollToTop: handleScrollToTop,
  });

  useEffect(() => {
    if (!user || !showSavedList) {
      setScrollTopVisible(false);
    }
  }, [setScrollTopVisible, showSavedList, user]);

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <TransitionItem variant="header" index={0}>
          <AppHeader title="Saved" subtitle="Your saved businesses and lists" />
        </TransitionItem>
        <TransitionItem variant="card" index={1}>
          <EmptyState
            icon="bookmark-outline"
            title="Sign in to see your saved places"
            message="Save your favorite businesses to find them again easily."
            actionLabel="Sign in"
            onAction={() => router.push(routes.onboarding() as never)}
          />
        </TransitionItem>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TransitionItem variant="header" index={0}>
        <AppHeader title="Saved" subtitle="Your bookmarks across the app" />
      </TransitionItem>

      {isLoading ? (
        <View style={styles.list}>
          {[1, 2, 3].map((item) => (
            <TransitionItem key={item} variant="listItem" index={item}>
              <SkeletonCard />
            </TransitionItem>
          ))}
        </View>
      ) : businesses.length === 0 ? (
        <TransitionItem variant="card" index={1}>
          <EmptyState
            icon="bookmark-outline"
            title="Nothing saved yet"
            message="Tap the bookmark on any business to save it here."
            actionLabel="Explore businesses"
            onAction={() => router.push(routes.home() as never)}
          />
        </TransitionItem>
      ) : (
        <FlatList
          ref={listRef}
          data={businesses}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <TransitionItem variant="listItem" index={index}>
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
            </TransitionItem>
          )}
          contentContainerStyle={styles.list}
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
