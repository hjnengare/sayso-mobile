export type MotionVariant = 'header' | 'input' | 'card' | 'listItem' | 'cta';

export type VariantSpec = {
  translateY: number;
  duration: number;
  baseDelay: number;
};

export const MOTION_VARIANTS: Record<MotionVariant, VariantSpec> = {
  // Onboarding-inspired element motion:
  // slightly stronger lead-in for top-level sections, but shorter than onboarding itself.
  header: { translateY: 12, duration: 300, baseDelay: 0 },
  input: { translateY: 10, duration: 285, baseDelay: 36 },
  card: { translateY: 9, duration: 270, baseDelay: 60 },
  listItem: { translateY: 7, duration: 240, baseDelay: 52 },
  cta: { translateY: 11, duration: 295, baseDelay: 78 },
};

export const STAGGER_STEP = 24;
export const STAGGER_MAX_DELAY = 220;
export const REDUCED_MOTION_DURATION = 120;
