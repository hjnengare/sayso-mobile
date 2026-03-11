import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

type TransitionScopeContextValue = {
  scopeTick: number;
  registerItem: () => void;
};

const TransitionScopeContext = createContext<TransitionScopeContextValue | null>(null);
const SHOULD_WARN_MISSING_TRANSITIONS = __DEV__ && process.env.EXPO_PUBLIC_DEBUG_TRANSITIONS === '1';

export function TransitionScopeProvider({
  routeKey,
  children,
}: {
  routeKey: string;
  children: React.ReactNode;
}) {
  const [scopeTick, setScopeTick] = useState(0);
  const itemCountRef = useRef(0);

  const registerItem = useCallback(() => {
    itemCountRef.current += 1;
  }, []);

  useEffect(() => {
    setScopeTick((current) => current + 1);
  }, [routeKey]);

  useEffect(() => {
    itemCountRef.current = 0;
    if (!SHOULD_WARN_MISSING_TRANSITIONS) return;

    const timer = setTimeout(() => {
      if (itemCountRef.current === 0) {
        console.warn(`[motion] No TransitionItem nodes detected for route "${routeKey}".`);
      }
    }, 700);

    return () => clearTimeout(timer);
  }, [routeKey, scopeTick]);

  const value = useMemo(
    () => ({
      scopeTick,
      registerItem,
    }),
    [registerItem, scopeTick]
  );

  return <TransitionScopeContext.Provider value={value}>{children}</TransitionScopeContext.Provider>;
}

export function usePageTransitionScope() {
  return useContext(TransitionScopeContext);
}

export function useTransitionIndex(base = 0) {
  return useCallback((offset = 0) => base + offset, [base]);
}
