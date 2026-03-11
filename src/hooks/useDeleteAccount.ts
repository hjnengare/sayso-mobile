import { useMutation } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

export function useDeleteAccount() {
  return useMutation({
    mutationFn: () =>
      apiFetch<{ success?: boolean; error?: string }>('/api/user/delete-account', {
        method: 'DELETE',
      }),
  });
}
