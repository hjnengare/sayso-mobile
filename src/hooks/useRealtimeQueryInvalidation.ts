import { useEffect } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

type RealtimeEvent = '*' | 'INSERT' | 'UPDATE' | 'DELETE';

export type RealtimeInvalidationTarget = {
  key: string;
  table: string;
  filter?: string;
  schema?: string;
  event?: RealtimeEvent;
  queryKeys: QueryKey[];
  debounceMs?: number;
  enabled?: boolean;
};

export function useRealtimeQueryInvalidation(targets: RealtimeInvalidationTarget[]) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const activeTargets = targets.filter((target) => target.enabled ?? true);
    if (activeTargets.length === 0) return;

    const cleanups: Array<() => void> = [];

    for (const target of activeTargets) {
      let timer: ReturnType<typeof setTimeout> | null = null;
      const debounceMs = target.debounceMs ?? 500;

      const channel = supabase
        .channel(`rq-invalidate-${target.key}`)
        .on(
          'postgres_changes',
          {
            event: target.event ?? '*',
            schema: target.schema ?? 'public',
            table: target.table,
            filter: target.filter,
          },
          () => {
            if (timer) clearTimeout(timer);
            timer = setTimeout(() => {
              for (const queryKey of target.queryKeys) {
                void queryClient.invalidateQueries({ queryKey });
              }
              timer = null;
            }, debounceMs);
          }
        )
        .subscribe();

      cleanups.push(() => {
        if (timer) {
          clearTimeout(timer);
          timer = null;
        }
        supabase.removeChannel(channel);
      });
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, [queryClient, targets]);
}
