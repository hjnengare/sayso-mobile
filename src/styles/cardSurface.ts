import type { ViewStyle } from 'react-native';
import { CARD_BG_COLOR } from './colors';

export const CARD_BACKGROUND_COLOR = CARD_BG_COLOR;
export const CARD_BORDER_COLOR = 'rgba(0,0,0,0.04)';
export const FROSTED_CARD_BACKGROUND_COLOR = 'rgba(157,171,155,0.78)';
export const FROSTED_CARD_BORDER_COLOR = 'rgba(255,255,255,0.32)';
export const WEB_CARD_SHADOW_REST =
  '0 2px 8px rgba(0,0,0,0.04), 0 12px 24px rgba(0,0,0,0.06)';
export const WEB_CARD_SHADOW_HOVER =
  '0 4px 12px rgba(0,0,0,0.08), 0 16px 32px rgba(0,0,0,0.10)';
export const CARD_TRANSITION = 'box-shadow 0.2s ease';

type WebViewStyle = ViewStyle & {
  boxShadow?: string;
  cursor?: string;
  transition?: string;
};

export function getCardContentStyle(radius: number, material: 'solid' | 'frosted' = 'solid'): ViewStyle {
  const isFrosted = material === 'frosted';

  return {
    borderRadius: radius,
    overflow: 'hidden',
    backgroundColor: isFrosted ? FROSTED_CARD_BACKGROUND_COLOR : CARD_BACKGROUND_COLOR,
    borderWidth: 1,
    borderColor: isFrosted ? FROSTED_CARD_BORDER_COLOR : CARD_BORDER_COLOR,
  } as ViewStyle;
}

export function getWebCardShadowStyle(radius: number, hovered: boolean): ViewStyle {
  return {
    borderRadius: radius,
    boxShadow: hovered ? WEB_CARD_SHADOW_HOVER : WEB_CARD_SHADOW_REST,
    transition: CARD_TRANSITION,
  } as WebViewStyle;
}

export function getWebInteractiveShellStyle(): ViewStyle {
  return {
    cursor: 'pointer',
  } as WebViewStyle;
}

export function getNativeOuterShadowStyle(radius: number): ViewStyle {
  return {
    borderRadius: radius,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 6,
  };
}

export function getNativeInnerShadowStyle(radius: number): ViewStyle {
  return {
    borderRadius: radius,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  };
}
