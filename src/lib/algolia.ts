import { algoliasearch } from 'algoliasearch';

const APP_ID = (process.env.EXPO_PUBLIC_ALGOLIA_APP_ID ?? '').trim();
const SEARCH_KEY = (process.env.EXPO_PUBLIC_ALGOLIA_SEARCH_KEY ?? '').trim();

export const ALGOLIA_CONFIGURED = !!(APP_ID && SEARCH_KEY);
export const BUSINESSES_INDEX = 'sayso_businesses';
export const REVIEWERS_INDEX = 'sayso_reviewers';

let _client: ReturnType<typeof algoliasearch> | null = null;

export function getAlgoliaClient() {
  if (!ALGOLIA_CONFIGURED) return null;
  if (!_client) {
    _client = algoliasearch(APP_ID, SEARCH_KEY);
  }
  return _client;
}

export type BusinessHit = {
  objectID: string;
  name: string;
  category: string;
  category_label?: string;
  location?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  image_url?: string;
  price_range?: string;
  verified?: boolean;
  badge?: string;
  average_rating?: number;
  total_reviews?: number;
  _geoloc?: { lat: number; lng: number };
};

export type FacetSuggestion = {
  query: string;
  type: 'category' | 'location';
  count: number;
};

/** Convert an Algolia BusinessHit to a shape compatible with BusinessListItemDto */
export function businessHitToDto(hit: BusinessHit) {
  return {
    id: hit.objectID,
    name: hit.name,
    category: hit.category,
    category_label: hit.category_label,
    location: hit.location,
    address: hit.address,
    phone: hit.phone,
    email: hit.email,
    website: hit.website,
    image_url: hit.image_url,
    priceRange: hit.price_range,
    verified: hit.verified ?? false,
    badge: hit.badge,
    rating: hit.average_rating,
    reviews: hit.total_reviews,
    lat: hit._geoloc?.lat ?? null,
    lng: hit._geoloc?.lng ?? null,
  };
}

/** Search businesses directly via Algolia */
export async function searchBusinesses(opts: {
  query: string;
  minRating?: number | null;
  distanceKm?: number | null;
  lat?: number | null;
  lng?: number | null;
  limit?: number;
}) {
  const client = getAlgoliaClient();
  if (!client) return null;

  const { query, minRating, distanceKm, lat, lng, limit = 20 } = opts;

  const filters = minRating ? `average_rating >= ${minRating}` : '';

  const searchParams: Parameters<typeof client.searchSingleIndex>[0]['searchParams'] = {
    query,
    hitsPerPage: limit,
    filters: filters || undefined,
  };

  if (distanceKm && lat != null && lng != null) {
    searchParams.aroundLatLng = `${lat},${lng}`;
    searchParams.aroundRadius = distanceKm * 1000;
  }

  const result = await client.searchSingleIndex<BusinessHit>({
    indexName: BUSINESSES_INDEX,
    searchParams,
  });

  return result.hits.map(businessHitToDto);
}

/** Fetch facet suggestions for category_label and location */
export async function fetchAlgoliaSuggestions(query: string): Promise<FacetSuggestion[]> {
  const client = getAlgoliaClient();
  if (!client || query.trim().length < 2) return [];

  const [categoryResult, locationResult] = await Promise.all([
    client.searchForFacetValues({
      indexName: BUSINESSES_INDEX,
      facetName: 'category_label',
      searchForFacetValuesParams: { facetQuery: query, maxFacetHits: 5 },
    }),
    client.searchForFacetValues({
      indexName: BUSINESSES_INDEX,
      facetName: 'location',
      searchForFacetValuesParams: { facetQuery: query, maxFacetHits: 3 },
    }),
  ]);

  const suggestions: FacetSuggestion[] = [
    ...(categoryResult.facetHits ?? []).map((h) => ({
      query: h.value,
      type: 'category' as const,
      count: h.count,
    })),
    ...(locationResult.facetHits ?? []).map((h) => ({
      query: h.value,
      type: 'location' as const,
      count: h.count,
    })),
  ];

  return suggestions;
}
