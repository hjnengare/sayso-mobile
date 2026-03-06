import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export type EventReviewItem = {
  id: string;
  eventId: string;
  userId: string | null;
  rating: number;
  title?: string;
  content: string;
  tags: string[];
  helpfulCount: number;
  createdAt: string;
  user: {
    id: string | null;
    name: string;
    username?: string | null;
    displayName?: string | null;
    avatarUrl?: string | null;
  };
  images: string[];
};

type RawReview = {
  id?: string | null;
  event_id?: string | null;
  user_id?: string | null;
  rating?: number | null;
  title?: string | null;
  content?: string | null;
  tags?: string[] | null;
  helpful_count?: number | null;
  created_at?: string | null;
  user?: {
    id?: string | null;
    name?: string | null;
    username?: string | null;
    display_name?: string | null;
    avatar_url?: string | null;
  } | null;
  images?: Array<{ image_url?: string | null; url?: string | null }> | null;
};

type RawReviewsResponse = {
  reviews?: RawReview[];
};

function normalizeReviewItem(item: RawReview): EventReviewItem | null {
  if (!item?.id || !item.event_id || typeof item.rating !== 'number') {
    return null;
  }

  const userName =
    item.user?.name ?? item.user?.display_name ?? item.user?.username ?? 'Anonymous';

  return {
    id: item.id,
    eventId: item.event_id,
    userId: item.user_id ?? null,
    rating: item.rating,
    title: item.title ?? undefined,
    content: item.content ?? '',
    tags: Array.isArray(item.tags) ? item.tags : [],
    helpfulCount:
      typeof item.helpful_count === 'number' && Number.isFinite(item.helpful_count)
        ? item.helpful_count
        : 0,
    createdAt: item.created_at ?? new Date().toISOString(),
    user: {
      id: item.user?.id ?? item.user_id ?? null,
      name: userName,
      username: item.user?.username ?? null,
      displayName: item.user?.display_name ?? null,
      avatarUrl: item.user?.avatar_url ?? null,
    },
    images: Array.isArray(item.images)
      ? item.images
          .map((image) => image.url ?? image.image_url ?? '')
          .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
      : [],
  };
}

export function useEventReviews(id: string | null | undefined) {
  const query = useQuery({
    queryKey: ['event-reviews', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const payload = await apiFetch<RawReviewsResponse>(`/api/events/${id}/reviews`);
      const rows = Array.isArray(payload.reviews) ? payload.reviews : [];
      return rows.map(normalizeReviewItem).filter((item): item is EventReviewItem => Boolean(item));
    },
    staleTime: 30_000,
  });

  return {
    reviews: query.data ?? [],
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error instanceof Error ? query.error.message : null,
    refetch: query.refetch,
  };
}
