import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../../../components/Typography';
import { apiFetch } from '../../../lib/api';
import {
  ALGOLIA_CONFIGURED,
  fetchAlgoliaSuggestions,
  getAlgoliaClient,
  BUSINESSES_INDEX,
  type BusinessHit,
  type FacetSuggestion,
} from '../../../lib/algolia';
import { homeTokens } from './HomeTokens';

// ─── Types ────────────────────────────────────────────────────────────────────
type BusinessSuggestion = {
  id: string;
  name: string;
  category?: string;
  category_label?: string;
  location?: string;
};

type SuggestionState = {
  facets: FacetSuggestion[];
  businesses: BusinessSuggestion[];
  loading: boolean;
};

// ─── Hook ─────────────────────────────────────────────────────────────────────
function useSuggestions(query: string): SuggestionState {
  const [state, setState] = useState<SuggestionState>({
    facets: [],
    businesses: [],
    loading: false,
  });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setState({ facets: [], businesses: [], loading: false });
      return;
    }

    setState((prev) => ({ ...prev, loading: true }));

    debounceRef.current = setTimeout(async () => {
      abortRef.current?.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      try {
        if (ALGOLIA_CONFIGURED) {
          // Direct Algolia: facets + business hits in parallel
          const [facets, searchResult] = await Promise.all([
            fetchAlgoliaSuggestions(query.trim()),
            getAlgoliaClient()!.searchSingleIndex<BusinessHit>({
              indexName: BUSINESSES_INDEX,
              searchParams: { query: query.trim(), hitsPerPage: 6 },
            }),
          ]);

          if (!ctrl.signal.aborted) {
            setState({
              facets,
              businesses: searchResult.hits.map((h) => ({
                id: h.objectID,
                name: h.name,
                category: h.category,
                category_label: h.category_label,
                location: h.location,
              })),
              loading: false,
            });
          }
        } else {
          // Fallback: /api/search
          const data = await apiFetch<{ results?: BusinessSuggestion[] }>(
            `/api/search?q=${encodeURIComponent(query.trim())}&limit=6`
          );
          if (!ctrl.signal.aborted) {
            setState({
              facets: [],
              businesses: data.results?.slice(0, 6) ?? [],
              loading: false,
            });
          }
        }
      } catch {
        if (!ctrl.signal.aborted) {
          setState((prev) => ({ ...prev, loading: false }));
        }
      }
    }, 200);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  return state;
}

// ─── Component ────────────────────────────────────────────────────────────────
type Props = {
  query: string;
  onSelect: (businessId: string) => void;
  onSelectQuery?: (q: string) => void;
};

export function HomeSearchSuggestions({ query, onSelect, onSelectQuery }: Props) {
  const { facets, businesses, loading } = useSuggestions(query);
  const hasContent = facets.length > 0 || businesses.length > 0;

  if (query.trim().length < 2) return null;
  if (!loading && !hasContent) return null;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Suggestions</Text>
      </View>

      {/* Facet suggestions — category / location (Algolia only) */}
      {facets.length > 0 ? (
        <View>
          {facets.map((f) => (
            <Pressable
              key={`${f.type}-${f.query}`}
              style={({ pressed }) => [styles.facetRow, pressed && styles.rowPressed]}
              onPress={() => onSelectQuery?.(f.query)}
            >
              <Ionicons name="search-outline" size={14} color="rgba(45,45,45,0.40)" />
              <Text style={styles.facetText} numberOfLines={1}>{f.query}</Text>
              <Text style={styles.facetTypeLabel}>
                {f.type === 'location' ? 'area' : 'category'}
              </Text>
            </Pressable>
          ))}
          {businesses.length > 0 ? <View style={styles.divider} /> : null}
        </View>
      ) : null}

      {/* Business hits */}
      {loading && businesses.length === 0 ? (
        <View style={styles.loadingRow}>
          <Text style={styles.loadingText}>Searching…</Text>
        </View>
      ) : (
        businesses.map((item) => {
          const categoryPart = item.category_label ?? item.category;
          const meta = [categoryPart, item.location].filter(Boolean).join(' · ');
          return (
            <Pressable
              key={item.id}
              style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}
              onPress={() => onSelect(item.id)}
              accessibilityLabel={`Go to ${item.name}`}
            >
              <View style={styles.rowIcon}>
                <Ionicons name="storefront-outline" size={15} color="rgba(45,45,45,0.40)" />
              </View>
              <View style={styles.rowContent}>
                <Text style={styles.rowName} numberOfLines={1}>{item.name}</Text>
                {meta ? (
                  <Text style={styles.rowMeta} numberOfLines={1}>{meta}</Text>
                ) : null}
              </View>
              <Ionicons name="arrow-forward" size={14} color="rgba(45,45,45,0.25)" />
            </Pressable>
          );
        })
      )}

      {/* View all — closes the dropdown and shows full search results */}
      <Pressable
        style={({ pressed }) => [styles.viewAllRow, pressed && styles.viewAllRowPressed]}
        onPress={() => onSelectQuery?.(query)}
        accessibilityLabel="View all search results"
      >
        <Text style={styles.viewAllText}>View all results</Text>
        <Ionicons name="arrow-forward" size={14} color={homeTokens.sage} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(229,224,229,0.97)',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(45,45,45,0.06)',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45,45,45,0.08)',
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(45,45,45,0.55)',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  facetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45,45,45,0.04)',
  },
  facetText: {
    flex: 1,
    fontSize: 13,
    color: homeTokens.charcoal,
  },
  facetTypeLabel: {
    fontSize: 11,
    color: 'rgba(45,45,45,0.40)',
    flexShrink: 0,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(45,45,45,0.08)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45,45,45,0.05)',
  },
  rowPressed: {
    backgroundColor: 'rgba(125,155,118,0.10)',
  },
  rowIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(45,45,45,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowContent: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  rowName: {
    fontSize: 14,
    fontWeight: '600',
    color: homeTokens.charcoal,
  },
  rowMeta: {
    fontSize: 12,
    color: 'rgba(45,45,45,0.55)',
  },
  loadingRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  loadingText: {
    fontSize: 14,
    color: 'rgba(45,45,45,0.50)',
  },
  viewAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(45,45,45,0.08)',
  },
  viewAllRowPressed: {
    backgroundColor: 'rgba(125,155,118,0.10)',
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: homeTokens.sage,
  },
});
