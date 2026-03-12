import { Platform } from 'react-native';
import { APP_PAGE_GUTTER } from '../../styles/layout';

// Colors aligned exactly with sayso_web tailwind.config.js
export const businessDetailColors = {
  page: '#E5E0E5',                       // page-bg / off-white
  cardBg: '#9DAB9B',                     // card-bg
  cardTint: 'rgba(157,171,155,0.92)',
  charcoal: '#2D2D2D',                   // web: charcoal
  coral: '#722F37',                      // navbar-bg / coral / burgundy
  sage: '#7D9B76',                       // sage
  white: '#FFFFFF',
  borderSoft: 'rgba(255,255,255,0.28)',
  textMuted: 'rgba(45,45,45,0.70)',      // web: text-charcoal/70
  textSubtle: 'rgba(45,45,45,0.50)',     // web: text-charcoal/50
  shadow: 'rgba(0,0,0,0.12)',
};

// Matches web's LinearGradient from-card-bg via-card-bg to-card-bg/95
export const CARD_GRADIENT = ['#9DAB9B', '#9DAB9B', 'rgba(157,171,155,0.95)'] as const;

// Matches web's shadow-md
export const cardShadowStyle = Platform.select({
  web: { boxShadow: '0 4px 10px rgba(0,0,0,0.07)' } as object,
  default: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 10,
    elevation: 3,
  },
});

export const businessDetailSpacing = {
  pageGutter: APP_PAGE_GUTTER,
  sectionGap: 14,
  cardRadius: 12,
  cardPadding: 16,         // web: p-4 = 16px equal on all sides
  headingFontSize: 22,     // web: text-h3 = 24px, adapted for mobile
  headingFontWeight: '600' as const,   // web: font-semibold
  bodyFontSize: 16,        // web: text-body-sm = 16px
  bodyLineHeight: 24,      // 16 * 1.5 = 24
};
