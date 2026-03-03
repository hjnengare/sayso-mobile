import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSearch } from '../../src/hooks/useSearch';
import { BusinessCard } from '../../src/components/BusinessCard';
import { EmptyState } from '../../src/components/EmptyState';
import { Text, TextInput } from '../../src/components/Typography';

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
      <View style={styles.headerWrap}>
        <Text style={styles.title}>Search</Text>
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
          {isFetching && showResults && (
            <ActivityIndicator size="small" color="#6B7280" style={styles.spinner} />
          )}
        </View>
      </View>

      {!showResults ? (
        <EmptyState
          icon="search-outline"
          title="Find your next favourite spot"
          message="Search for restaurants, salons, gyms, and more in Cape Town."
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
          renderItem={({ item }) => <BusinessCard business={item} style={styles.card} />}
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
    backgroundColor: '#F9FAFB',
  },
  headerWrap: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 12,
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
  card: {},
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
