import type { ReactNode } from 'react';
import { Platform, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import {
  getCardContentStyle,
  getNativeInnerShadowStyle,
  getNativeOuterShadowStyle,
  getWebCardShadowStyle,
  getWebInteractiveShellStyle,
} from '../styles/cardSurface';

type CardSurfaceProps = {
  radius: number;
  material?: 'solid' | 'frosted';
  interactive?: boolean;
  onPress?: () => void;
  onPressIn?: () => void;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
  testID?: string;
};

function renderCardLayers(
  radius: number,
  material: 'solid' | 'frosted',
  hovered: boolean,
  contentStyle: StyleProp<ViewStyle>,
  children: ReactNode
) {
  if (Platform.OS === 'web') {
    return (
      <View style={getWebCardShadowStyle(radius, hovered)}>
        <View style={[getCardContentStyle(radius, material), contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <View style={getNativeOuterShadowStyle(radius)}>
      <View style={getNativeInnerShadowStyle(radius)}>
        <View style={[getCardContentStyle(radius, material), contentStyle]}>{children}</View>
      </View>
    </View>
  );
}

export function CardSurface({
  radius,
  material = 'solid',
  interactive = false,
  onPress,
  onPressIn,
  style,
  contentStyle,
  children,
  testID,
}: CardSurfaceProps) {
  const isInteractive = interactive || typeof onPress === 'function';
  const effectiveMaterial = Platform.OS === 'web' ? 'solid' : material;

  if (!isInteractive) {
    return (
      <View testID={testID} style={[styles.shell, style]}>
        {renderCardLayers(radius, effectiveMaterial, false, contentStyle, children)}
      </View>
    );
  }

  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      onPressIn={onPressIn}
      style={({ pressed }) => [
        styles.shell,
        style,
        Platform.OS === 'web' ? getWebInteractiveShellStyle() : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {({ hovered }) => renderCardLayers(radius, effectiveMaterial, hovered, contentStyle, children)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  shell: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.96,
  },
});
