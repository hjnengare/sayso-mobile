import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { Platform, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type ScrollToTopController = {
  id: string;
  visible: boolean;
  scrollToTop: () => void;
};

type ScrollToTopContextValue = {
  setController: (controller: ScrollToTopController) => void;
  clearController: (id: string) => void;
};

const ScrollToTopContext = createContext<ScrollToTopContextValue | null>(null);

const FAB_BOTTOM_OFFSET = Platform.select({
  ios: 108,
  android: 96,
  default: 96,
}) ?? 96;

export function ScrollToTopProvider({ children }: { children: ReactNode }) {
  const [controller, setControllerState] = useState<ScrollToTopController | null>(null);

  const setController = useCallback((next: ScrollToTopController) => {
    setControllerState(next);
  }, []);

  const clearController = useCallback((id: string) => {
    setControllerState((current) => (current?.id === id ? null : current));
  }, []);

  const handlePress = useCallback(() => {
    controller?.scrollToTop();
  }, [controller]);

  const value = useMemo<ScrollToTopContextValue>(
    () => ({
      setController,
      clearController,
    }),
    [clearController, setController]
  );

  const isVisible = Platform.OS !== 'web' && Boolean(controller?.visible);

  return (
    <ScrollToTopContext.Provider value={value}>
      {children}
      {isVisible ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Scroll to top"
          onPress={handlePress}
          style={styles.fab}
        >
          <Ionicons name="chevron-up" size={20} color="#FFFFFF" />
        </Pressable>
      ) : null}
    </ScrollToTopContext.Provider>
  );
}

export function useScrollToTopController() {
  return useContext(ScrollToTopContext);
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 16,
    bottom: FAB_BOTTOM_OFFSET,
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#722F37',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 3000,
  },
});
