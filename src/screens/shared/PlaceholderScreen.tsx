import { SafeAreaView, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Text } from '../../components/Typography';
import { CARD_CTA_RADIUS, CARD_RADIUS } from '../../styles/radii';
import { TransitionItem } from '../../components/motion/TransitionItem';

type Action = {
  label: string;
  href: string;
};

type Props = {
  title: string;
  description: string;
  actions?: Action[];
};

export function PlaceholderScreen({ title, description, actions = [] }: Props) {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title }} />
      <ScrollView contentContainerStyle={styles.content}>
        <TransitionItem variant="card" index={0}>
          <View style={styles.card}>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
        </TransitionItem>
        {actions.map((action, index) => (
          <TransitionItem key={`${title}-${action.label}`} variant="listItem" index={index + 1}>
            <TouchableOpacity
              style={styles.action}
              onPress={() => router.push(action.href as never)}
              activeOpacity={0.8}
            >
              <Text style={styles.actionLabel}>{action.label}</Text>
            </TouchableOpacity>
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
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#4B5563',
  },
  action: {
    backgroundColor: '#111827',
    borderRadius: CARD_CTA_RADIUS,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
