type Params = {
  visible: boolean;
  enabled?: boolean;
  onScrollToTop: () => void;
};

// useIsFocused → useNavigation throws on web before NavigationContainer is ready.
// Scroll-to-top via tab press is a native-only interaction, so this is a safe no-op.
export function useGlobalScrollToTop(_params: Params) {}
