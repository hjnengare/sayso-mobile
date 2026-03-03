import { forwardRef } from 'react';
import {
  StyleSheet,
  Text as RNText,
  TextInput as RNTextInput,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
} from 'react-native';

const FONT_FAMILY_BY_WEIGHT = {
  regular: 'Urbanist_400Regular',
  medium: 'Urbanist_500Medium',
  semibold: 'Urbanist_600SemiBold',
  bold: 'Urbanist_700Bold',
} as const;

function resolveUrbanistFamily(fontWeight?: TextStyle['fontWeight']) {
  if (fontWeight === 'bold') return FONT_FAMILY_BY_WEIGHT.bold;
  if (fontWeight === 'normal' || fontWeight == null) return FONT_FAMILY_BY_WEIGHT.regular;

  const numericWeight = typeof fontWeight === 'number'
    ? fontWeight
    : Number.parseInt(fontWeight, 10);

  if (Number.isNaN(numericWeight)) return FONT_FAMILY_BY_WEIGHT.regular;
  if (numericWeight >= 700) return FONT_FAMILY_BY_WEIGHT.bold;
  if (numericWeight >= 600) return FONT_FAMILY_BY_WEIGHT.semibold;
  if (numericWeight >= 500) return FONT_FAMILY_BY_WEIGHT.medium;
  return FONT_FAMILY_BY_WEIGHT.regular;
}

function withUrbanist(style: StyleProp<TextStyle>) {
  const flattenedStyle = StyleSheet.flatten(style) as TextStyle | undefined;

  if (flattenedStyle?.fontFamily) {
    return flattenedStyle;
  }

  const { fontWeight, ...restStyle } = flattenedStyle ?? {};

  return {
    ...restStyle,
    fontFamily: resolveUrbanistFamily(fontWeight),
  } satisfies TextStyle;
}

export const Text = forwardRef<React.ElementRef<typeof RNText>, TextProps>(
  function Text({ style, ...props }, ref) {
    return <RNText ref={ref} {...props} style={withUrbanist(style)} />;
  },
);

export const TextInput = forwardRef<React.ElementRef<typeof RNTextInput>, TextInputProps>(
  function TextInput({ style, ...props }, ref) {
    return <RNTextInput ref={ref} {...props} style={withUrbanist(style)} />;
  },
);
