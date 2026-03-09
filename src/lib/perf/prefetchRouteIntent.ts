import type { QueryKey } from '@tanstack/react-query';
import { queryClient } from '../queryClient';

type RouterLike = {
  prefetch?: (href: string) => Promise<void> | void;
};

type PrefetchQuery = {
  queryKey: QueryKey;
  queryFn: () => Promise<unknown>;
  staleTime?: number;
};

type PrefetchParams = {
  href?: string;
  router?: RouterLike | null;
  queryKeys?: PrefetchQuery[];
};

const PREFETCH_TTL_MS = 45_000;
const MIN_SPACING_MS = 120;
const MAX_IN_FLIGHT = 2;
const MAX_BACKGROUND_FETCHES = 2;

const lastPrefetchByKey = new Map<string, number>();
const inFlightKeys = new Set<string>();
let inFlightCount = 0;
let lastPrefetchStartedAt = 0;

function canStartPrefetch(key: string, now: number) {
  const last = lastPrefetchByKey.get(key) ?? 0;
  if (inFlightKeys.has(key)) return false;
  if (now - last < PREFETCH_TTL_MS) return false;
  if (inFlightCount >= MAX_IN_FLIGHT) return false;
  if (queryClient.isFetching() > MAX_BACKGROUND_FETCHES) return false;
  if (now - lastPrefetchStartedAt < MIN_SPACING_MS) return false;
  return true;
}

export function prefetchRouteIntent(routeKey: string, params: PrefetchParams) {
  const now = Date.now();
  if (!canStartPrefetch(routeKey, now)) return;

  inFlightKeys.add(routeKey);
  inFlightCount += 1;
  lastPrefetchStartedAt = now;
  lastPrefetchByKey.set(routeKey, now);

  const work = async () => {
    const tasks: Array<Promise<unknown>> = [];

    if (params.href && params.router?.prefetch) {
      tasks.push(Promise.resolve(params.router.prefetch(params.href)));
    }

    for (const prefetch of params.queryKeys ?? []) {
      tasks.push(
        queryClient.prefetchQuery({
          queryKey: prefetch.queryKey,
          queryFn: prefetch.queryFn,
          staleTime: prefetch.staleTime ?? 60_000,
        })
      );
    }

    await Promise.allSettled(tasks);
  };

  void work().finally(() => {
    inFlightKeys.delete(routeKey);
    inFlightCount = Math.max(0, inFlightCount - 1);
  });
}
