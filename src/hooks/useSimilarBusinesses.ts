import { useQuery } from '@tanstack/react-query';
import type { BusinessListItemDto } from '@sayso/contracts';
import { apiFetch } from '../lib/api';

type SimilarBusinessesResponse =
  | BusinessListItemDto[]
  | {
      businesses?: BusinessListItemDto[];
      items?: BusinessListItemDto[];
      data?: BusinessListItemDto[];
    };

export function useSimilarBusinesses(
  businessId: string | null | undefined,
  {
    limit = 3,
    radiusKm = 50,
  }: {
    limit?: number;
    radiusKm?: number;
  } = {}
) {
  const query = useQuery({
    queryKey: ['similar-businesses', businessId, limit, radiusKm],
    enabled: Boolean(businessId),
    queryFn: async () => {
      const payload = await apiFetch<SimilarBusinessesResponse>(
        `/api/businesses/${businessId}/similar?limit=${limit}&radius_km=${radiusKm}`
      );

      if (Array.isArray(payload)) {
        return payload;
      }

      return payload.businesses ?? payload.items ?? payload.data ?? [];
    },
    staleTime: 30_000,
  });

  return {
    businesses: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
