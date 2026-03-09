import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { SavedBusinessDto, SavedBusinessesResponseDto } from '@sayso/contracts';
import { useAuthSession } from './useSession';

export function useSavedBusinesses() {
  const { user, isLoading } = useAuthSession();

  return useQuery({
    queryKey: ['saved-businesses'],
    queryFn: () => apiFetch<SavedBusinessesResponseDto>('/api/user/saved'),
    enabled: !!user && !isLoading,
    staleTime: 30_000,
  });
}

export function useUnsaveBusiness() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (businessId: string) =>
      apiFetch(`/api/user/saved?business_id=${businessId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-businesses'] }),
  });
}
