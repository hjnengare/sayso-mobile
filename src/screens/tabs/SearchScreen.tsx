import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BusinessListItemDto } from '@sayso/contracts';
import { useSearch } from '../../hooks/useSearch';
import { useGlobalScrollToTop } from '../../hooks/useGlobalScrollToTop';
import { AppHeader } from '../../components/AppHeader';
import { BusinessCard } from '../../components/BusinessCard';
import { EmptyState } from '../../components/EmptyState';
import { SkeletonBlock } from '../../components/SkeletonBlock';
import { SkeletonCard } from '../../components/SkeletonCard';
import { TextInput } from '../../components/Typography';

export default function SearchScreen() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultsRef = useRef<FlatList<BusinessListItemDto> | null>(null);
  const scrollTopVisibleRef = useRef(false);
  const [showScrollTopButton, setShowScrollTopButton] = useState(false);

  const handleChange = (text: string) => {
    setInput(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setQuery(text.trim());
    }, 300);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const { data, isLoading, isFetching } = useSearch(query);
  const businesses = data?.businesses ?? [];
  const showResults = query.length >= 2;

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
    resultsRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  useGlobalScrollToTop({
    visible: showScrollTopButton,
    enabled: showResults && businesses.length > 0,
    onScrollToTop: handleScrollToTop,
  });

  useEffect(() => {
    if (!showResults || businesses.length === 0) {
      setScrollTopVisible(false);
    }
  }, [businesses.length, setScrollTopVisible, showResults]);

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Search" subtitle="Find businesses, events, and specials" />

      <View style={styles.headerWrap}>
        <View style={styles.inputWrap}>
          <Ionicons name="search" size={18} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.input}
            placeholder="Restaurants, salons, gyms..."
            placeholderTextColor="#9CA3AF"
            value={input}
            onChangeText={handleChange}
            autoCorrect={false}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
          {isFetching && showResults ? (
            <SkeletonBlock style={styles.fetchingIndicator} />
          ) : null}
        </View>
      </View>

      {!showResults ? (
        <EmptyState
          icon="search"
          title="Find your next favorite spot"
          message="Search for restaurants, salons, gyms, and more."
        />
      ) : isLoading ? (
        <View style={styles.loadingList}>
          {Array.from({ length: 4 }, (_, index) => (
            <SkeletonCard key={`search-loading-${index}`} />
          ))}
        </View>
      ) : businesses.length === 0 ? (
        <EmptyState
          icon="storefront"
          title={`No results for "${query}"`}
          message="Try a different search term."
        />
      ) : (
        <FlatList
          ref={resultsRef}
          data={businesses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <BusinessCard business={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
  headerWrap: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: 44,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#111827',
  },
  fetchingIndicator: {
    width: 16,
    height: 16,
    borderRadius: 999,
    marginLeft: 8,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  loadingList: {
    padding: 16,
    gap: 12,
  },
});
