import { AccessibilityInfo } from 'react-native';
import { useEffect, useState } from 'react';

export function useReducedMotion() {
  const [reducedMotionEnabled, setReducedMotionEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;

    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (mounted) {
          setReducedMotionEnabled(enabled);
        }
      })
      .catch(() => {
        if (mounted) {
          setReducedMotionEnabled(false);
        }
      });

    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReducedMotionEnabled);

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reducedMotionEnabled;
}
