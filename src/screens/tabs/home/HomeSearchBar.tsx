import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SkeletonBlock } from '../../../components/SkeletonBlock';
import { Text, TextInput } from '../../../components/Typography';
import { homeTokens } from './HomeTokens';

type Props = {
  value: string;
  onChangeText: (value: string) => void;
  onClear: () => void;
  isFetching?: boolean;
  onFocus?: () => void;
  onBlur?: () => void;
  activeFilterCount?: number;
  onFilterPress?: () => void;
};

const placeholderPhrases = [
  'Search Cape Town businesses',
  'Find events worth showing up for',
  'Discover specials near you',
] as const;

const AnimatedText = Animated.createAnimatedComponent(Text);

export function HomeSearchBar({
  value,
  onChangeText,
  onClear,
  isFetching = false,
  onFocus,
  onBlur,
  activeFilterCount = 0,
  onFilterPress,
}: Props) {
  const [focused, setFocused] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const placeholderProgress = useRef(new Animated.Value(0)).current;
  const placeholderTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPlaceholderVisible = value.length === 0;

  const placeholderTranslateY = useMemo(
    () =>
      placeholderProgress.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [12, 0, -12],
      }),
    [placeholderProgress]
  );

  const placeholderOpacity = useMemo(
    () =>
      placeholderProgress.interpolate({
        inputRange: [0, 0.18, 0.82, 1],
        outputRange: [0, 1, 1, 0],
      }),
    [placeholderProgress]
  );

  useEffect(() => {
    if (placeholderTimeoutRef.current) {
      clearTimeout(placeholderTimeoutRef.current);
      placeholderTimeoutRef.current = null;
    }

    if (!isPlaceholderVisible) {
      placeholderProgress.stopAnimation();
      placeholderProgress.setValue(0);
      return;
    }

    let cancelled = false;

    const runCycle = () => {
      placeholderProgress.setValue(0);

      Animated.sequence([
        Animated.timing(placeholderProgress, {
          toValue: 0.5,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.delay(1800),
        Animated.timing(placeholderProgress, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished || cancelled) {
          return;
        }

        setPlaceholderIndex((current) => (current + 1) % placeholderPhrases.length);
        placeholderTimeoutRef.current = setTimeout(runCycle, 80);
      });
    };

    runCycle();

    return () => {
      cancelled = true;
      placeholderProgress.stopAnimation();
      if (placeholderTimeoutRef.current) {
        clearTimeout(placeholderTimeoutRef.current);
        placeholderTimeoutRef.current = null;
      }
    };
  }, [isPlaceholderVisible, placeholderProgress]);

  return (
    <View style={[styles.wrap, focused ? styles.wrapFocused : null]}>
      <Ionicons name="search" size={18} color={homeTokens.textTertiary} style={styles.icon} />
      <View style={styles.inputWrap}>
        {isPlaceholderVisible ? (
          <View pointerEvents="none" style={styles.placeholderWrap}>
            <AnimatedText
              numberOfLines={1}
              style={[
                styles.placeholderText,
                {
                  opacity: placeholderOpacity,
                  transform: [{ translateY: placeholderTranslateY }],
                },
              ]}
            >
              {placeholderPhrases[placeholderIndex]}
            </AnimatedText>
          </View>
        ) : null}
        <TextInput
          style={styles.input}
          placeholder=""
          value={value}
          onChangeText={onChangeText}
          autoCorrect={false}
          returnKeyType="search"
          clearButtonMode="never"
          onFocus={() => { setFocused(true); onFocus?.(); }}
          onBlur={() => { setFocused(false); onBlur?.(); }}
        />
      </View>
      {isFetching ? <SkeletonBlock style={styles.fetchingIndicator} /> : null}

      {/* Filter button — visible when search is active */}
      {value.length > 0 ? (
        <TouchableOpacity
          style={styles.filterButton}
          onPress={onFilterPress}
          activeOpacity={0.8}
          accessibilityLabel="Search filters"
        >
          <Ionicons name="options-outline" size={17} color={activeFilterCount > 0 ? homeTokens.coral : homeTokens.charcoal} />
          {activeFilterCount > 0 ? (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          ) : null}
        </TouchableOpacity>
      ) : null}

      {value.length > 0 ? (
        <TouchableOpacity style={styles.clearButton} onPress={onClear} activeOpacity={0.8}>
          <Ionicons name="close" size={16} color={homeTokens.charcoal} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 52,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: homeTokens.borderSoft,
    backgroundColor: homeTokens.white,
  },
  wrapFocused: {
    borderColor: homeTokens.sage,
    ...(Platform.OS === 'web'
      ? ({
          boxShadow: '0 0 0 4px rgba(125, 155, 118, 0.18)',
          outlineStyle: 'none',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
      : null),
  },
  icon: {
    marginRight: 10,
  },
  inputWrap: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 24,
    fontSize: 15,
    color: homeTokens.charcoal,
    ...(Platform.OS === 'web'
      ? ({
          outlineStyle: 'none',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any)
      : null),
  },
  placeholderWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    overflow: 'hidden',
  },
  placeholderText: {
    fontSize: 15,
    color: homeTokens.textTertiary,
    width: '100%',
  },
  filterButton: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  filterBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: homeTokens.coral,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  clearButton: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: homeTokens.offWhite,
    marginLeft: 4,
  },
  fetchingIndicator: {
    width: 16,
    height: 16,
    borderRadius: 999,
    marginLeft: 6,
    backgroundColor: 'rgba(125,155,118,0.42)',
  },
});
