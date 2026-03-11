import { useCallback, useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Text } from '../../components/Typography';
import { useGlobalScrollToTop } from '../../hooks/useGlobalScrollToTop';
import { CARD_RADIUS } from '../../styles/radii';
import { TransitionItem } from '../../components/motion/TransitionItem';
import { useTransitionIndex } from '../../components/motion/TransitionScope';

type Props = {
  title: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
};

export function StaticContentScreen({ title, sections }: Props) {
  const scrollRef = useRef<ScrollView | null>(null);
  const scrollTopVisibleRef = useRef(false);
  const [showScrollTopButton, setShowScrollTopButton] = useState(false);
  const transitionIndex = useTransitionIndex(0);

  const setScrollTopVisible = useCallback((visible: boolean) => {
    if (scrollTopVisibleRef.current === visible) return;
    scrollTopVisibleRef.current = visible;
    setShowScrollTopButton(visible);
  }, []);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      setScrollTopVisible(event.nativeEvent.contentOffset.y > 220);
    },
    [setScrollTopVisible]
  );

  const handleScrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, []);

  useGlobalScrollToTop({
    visible: showScrollTopButton,
    enabled: true,
    onScrollToTop: handleScrollToTop,
  });

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title }} />
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.content}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {sections.map((section, index) => (
          <TransitionItem key={`${title}-${section.heading}`} variant="card" index={transitionIndex(index)}>
            <View style={styles.card}>
              <Text style={styles.heading}>{section.heading}</Text>
              <Text style={styles.body}>{section.body}</Text>
            </View>
          </TransitionItem>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E0E5',
  },
  content: {
    padding: 20,
    gap: 12,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: CARD_RADIUS,
    padding: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  body: {
    fontSize: 14,
    lineHeight: 22,
    color: '#4B5563',
  },
});
