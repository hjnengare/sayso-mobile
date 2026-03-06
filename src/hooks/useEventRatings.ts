import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

type RatingsResponse = {
  rating?: number | null;
  total_reviews?: number | null;
};

export function useEventRatings(
  id: string | null | undefined,
  fallbackRating = 0,
  fallbackTotalReviews = 0
) {
  const query = useQuery({
    queryKey: ['event-ratings', id],
    enabled: Boolean(id),
    queryFn: () => apiFetch<RatingsResponse>(`/api/events/${id}/ratings`),
    staleTime: 30_000,
  });

  return {
    rating:
      typeof query.data?.rating === 'number' && Number.isFinite(query.data.rating)
        ? query.data.rating
        : fallbackRating,
    totalReviews:
      typeof query.data?.total_reviews === 'number' && Number.isFinite(query.data.total_reviews)
        ? query.data.total_reviews
        : fallbackTotalReviews,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
