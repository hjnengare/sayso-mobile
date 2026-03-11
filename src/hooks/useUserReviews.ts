import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { useAuthSession } from './useSession';

export interface UserReviewDto {
  id: string;
  business_id: string;
  rating: number;
  title?: string | null;
  body?: string | null;
  content?: string | null;
  tags?: string[] | null;
  created_at: string;
  updated_at?: string;
  helpful_count?: number;
  business?: {
    id: string;
    name: string;
    slug?: string | null;
    image_url?: string | null;
    category?: string | null;
    primary_subcategory_slug?: string | null;
  };
}

interface UserReviewsPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

interface UserReviewsPage {
  data: UserReviewDto[];
  pagination: UserReviewsPagination;
}

interface UserReviewsResponse {
  data: UserReviewsPage | null;
  error: null | { message: string };
}

export function useUserReviews() {
  const { user, isLoading } = useAuthSession();

  return useQuery({
    queryKey: ['user-reviews', user?.id],
    queryFn: () => apiFetch<UserReviewsResponse>('/api/user/reviews?page=1&pageSize=20'),
    enabled: Boolean(user) && !isLoading,
    staleTime: 30_000,
  });
}

export function useDeleteUserReview() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) =>
      apiFetch<{ success?: boolean; error?: string }>(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['user-reviews'] });
      qc.invalidateQueries({ queryKey: ['user-stats'] });
      qc.invalidateQueries({ queryKey: ['user-badges'] });
      qc.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}
