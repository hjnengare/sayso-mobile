const transitionStartMarks = new Map<string, number>();
const firstContentfulMarks = new Set<string>();

function now() {
  if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
    return performance.now();
  }
  return Date.now();
}

function debugLog(message: string) {
  if (!__DEV__) return;
  // eslint-disable-next-line no-console
  console.debug(message);
}

export function markRouteTransitionStart(key: string) {
  transitionStartMarks.set(key, now());
}

export function markFirstContentful(key: string) {
  if (firstContentfulMarks.has(key)) return;
  const start = transitionStartMarks.get(key);
  if (typeof start !== 'number') return;
  const elapsed = now() - start;
  debugLog(`[perf] ${key} first-contentful: ${elapsed.toFixed(1)}ms`);
  firstContentfulMarks.add(key);
}

export function markInteractive(key: string) {
  const start = transitionStartMarks.get(key);
  if (typeof start !== 'number') return;
  const elapsed = now() - start;
  debugLog(`[perf] ${key} interactive: ${elapsed.toFixed(1)}ms`);
}

