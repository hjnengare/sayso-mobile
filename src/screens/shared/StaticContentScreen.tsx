import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { Stack } from 'expo-router';
import { Text } from '../../components/Typography';
import { CARD_RADIUS } from '../../styles/radii';

type Props = {
  title: string;
  sections: Array<{
    heading: string;
    body: string;
  }>;
};

export function StaticContentScreen({ title, sections }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title }} />
      <ScrollView contentContainerStyle={styles.content}>
        {sections.map((section) => (
          <View key={`${title}-${section.heading}`} style={styles.card}>
            <Text style={styles.heading}>{section.heading}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
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
