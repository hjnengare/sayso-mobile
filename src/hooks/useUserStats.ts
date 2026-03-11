import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import { useAuthSession } from './useSession';

export interface UserStatsDto {
  totalReviewsWritten: number;
  totalHelpfulVotesGiven: number;
  totalBusinessesSaved: number;
  accountCreationDate: string;
  lastActiveDate: string;
  helpfulVotesReceived: number;
}

interface UserStatsResponse {
  data: UserStatsDto | null;
  error: null | { message: string };
}

export function useUserStats() {
  const { user, isLoading } = useAuthSession();

  return useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: () => apiFetch<UserStatsResponse>('/api/user/stats'),
    enabled: Boolean(user) && !isLoading,
    staleTime: 60_000,
  });
}
