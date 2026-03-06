import { useIsFocused } from '@react-navigation/native';
import { useCallback, useEffect, useRef } from 'react';
import { useScrollToTopController } from '../providers/ScrollToTopProvider';

type Params = {
  visible: boolean;
  enabled?: boolean;
  onScrollToTop: () => void;
};

let scrollControllerId = 0;

function nextControllerId() {
  scrollControllerId += 1;
  return `global-scroll-top-${scrollControllerId}`;
}

export function useGlobalScrollToTop({ visible, enabled = true, onScrollToTop }: Params) {
  const controller = useScrollToTopController();
  const isFocused = useIsFocused();
  const idRef = useRef<string>('');

  if (!idRef.current) {
    idRef.current = nextControllerId();
  }

  const handleScrollToTop = useCallback(() => {
    onScrollToTop();
  }, [onScrollToTop]);

  useEffect(() => {
    if (!controller) return;
    const id = idRef.current;

    if (!enabled || !isFocused) {
      controller.clearController(id);
      return;
    }

    controller.setController({
      id,
      visible,
      scrollToTop: handleScrollToTop,
    });
  }, [controller, enabled, handleScrollToTop, isFocused, visible]);

  useEffect(() => {
    if (!controller) return;
    const id = idRef.current;
    return () => {
      controller.clearController(id);
    };
  }, [controller]);
}
