import { SafeAreaView, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { routes } from '../../navigation/routes';
import { AppHeader } from '../../components/AppHeader';
import { CardSurface } from '../../components/CardSurface';
import { Text } from '../../components/Typography';
import { CARD_RADIUS } from '../../styles/radii';

const groups = [
  {
    title: 'Browse by category',
    items: [
      { label: 'Restaurants', href: routes.category('restaurants') },
      { label: 'Wellness', href: routes.category('wellness') },
      { label: 'Food & Drink', href: routes.categorySlug('food-drink') },
      { label: 'All subcategories', href: routes.subcategories() },
    ],
  },
  {
    title: 'Collections',
    items: [
      { label: 'Date night', href: routes.exploreIntent('date-night') },
      { label: 'Weekend picks', href: routes.exploreCollection('weekend-picks') },
      { label: 'Cape Town', href: routes.exploreArea('cape-town') },
      { label: 'Food & Drink', href: routes.exploreCategory('food-drink') },
    ],
  },
];

export default function ExploreHubScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader title="Explore" subtitle="Browse categories, areas, collections, and intents" />
        {groups.map((group) => (
          <View key={group.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{group.title}</Text>
            <View style={styles.cardGrid}>
              {group.items.map((item) => (
                <CardSurface
                  key={item.href}
                  radius={CARD_RADIUS}
                  style={styles.card}
                  contentStyle={styles.cardContent}
                  interactive
                  onPress={() => router.push(item.href as never)}
                >
                  <Text style={styles.cardTitle}>{item.label}</Text>
                  <Text style={styles.cardBody}>Open this branch of discovery on mobile.</Text>
                </CardSurface>
              ))}
            </View>
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
    paddingBottom: 24,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 10,
    paddingHorizontal: 4,
  },
  cardGrid: {
    gap: 12,
  },
  card: {
  },
  cardContent: {
    padding: 16,
    gap: 6,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  cardBody: {
    fontSize: 13,
    lineHeight: 20,
    color: '#6B7280',
  },
});
