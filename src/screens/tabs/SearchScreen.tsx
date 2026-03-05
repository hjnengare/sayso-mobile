import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSearch } from '../../hooks/useSearch';
import { AppHeader } from '../../components/AppHeader';
import { BusinessCard } from '../../components/BusinessCard';
import { EmptyState } from '../../components/EmptyState';
import { TextInput } from '../../components/Typography';

export default function SearchScreen() {
  const [input, setInput] = useState('');
  const [query, setQuery] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  return (
    <SafeAreaView style={styles.container}>
      <AppHeader title="Search" subtitle="Find businesses, events, and specials" />

      <View style={styles.headerWrap}>
        <View style={styles.inputWrap}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" style={styles.searchIcon} />
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
            <ActivityIndicator size="small" color="#6B7280" style={styles.spinner} />
          ) : null}
        </View>
      </View>

      {!showResults ? (
        <EmptyState
          icon="search-outline"
          title="Find your next favorite spot"
          message="Search for restaurants, salons, gyms, and more."
        />
      ) : isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#111827" />
        </View>
      ) : businesses.length === 0 ? (
        <EmptyState
          icon="storefront-outline"
          title={`No results for "${query}"`}
          message="Try a different search term."
        />
      ) : (
        <FlatList
          data={businesses}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <BusinessCard business={item} />}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
  spinner: {
    marginLeft: 8,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
