import { Platform } from 'react-native';

const APP_BACKGROUND_COLOR = '#E5E0E5';

const sharedHeaderStyles = {
  headerTitleStyle: { fontFamily: 'Urbanist_700Bold' },
  headerBackTitleStyle: { fontFamily: 'Urbanist_500Medium' },
};

export const rootStackScreenOptions = {
  ...sharedHeaderStyles,
  contentStyle: { backgroundColor: APP_BACKGROUND_COLOR },
} as const;

export const sharedStackScreenOptions = {
  ...sharedHeaderStyles,
  headerShadowVisible: false,
  contentStyle: { backgroundColor: APP_BACKGROUND_COLOR },
} as const;

export const fullScreenModalScreenOptions = {
  ...sharedHeaderStyles,
  presentation: Platform.OS === 'web' ? 'card' : 'fullScreenModal',
  headerShadowVisible: false,
  contentStyle: { backgroundColor: APP_BACKGROUND_COLOR },
} as const;

export const sheetModalScreenOptions = {
  ...sharedHeaderStyles,
  presentation: Platform.OS === 'web' ? 'card' : 'modal',
  headerShadowVisible: false,
  contentStyle: { backgroundColor: APP_BACKGROUND_COLOR },
} as const;
