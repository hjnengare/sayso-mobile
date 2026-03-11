import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';
import type { MobileSessionProfileDto } from '@sayso/contracts';

export interface EnhancedProfileDto extends MobileSessionProfileDto {
  id?: string;
  username?: string | null;
  display_name?: string | null;
  avatar_url?: string | null;
  email?: string;
  review_count?: number;
  badge_count?: number;
  reviews_count?: number;
  badges_count?: number;
  interests_count?: number;
  is_top_reviewer?: boolean;
  bio?: string | null;
  location?: string | null;
  website_url?: string | null;
  social_links?: Record<string, string>;
  privacy_settings?: {
    showActivity?: boolean;
    showStats?: boolean;
    showSavedBusinesses?: boolean;
  };
  created_at?: string;
  updated_at?: string;
  last_active_at?: string;
}

interface ProfileResponse {
  data: EnhancedProfileDto | null;
  error: null | { message: string };
}

export interface UpdateProfilePayload {
  display_name?: string | null;
  username?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  location?: string | null;
  website_url?: string | null;
  social_links?: Record<string, string>;
}

export function useProfile() {
  return useQuery({
    queryKey: ['profile'],
    queryFn: () => apiFetch<ProfileResponse>('/api/user/profile'),
    staleTime: 60_000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfilePayload) =>
      apiFetch('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  });
}
