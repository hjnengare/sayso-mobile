import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { BusinessFeedScreen } from './BusinessFeedScreen';

type Props = {
  title: string;
  subtitle: string;
  count?: number;
};

export function BusinessFeedStackScreen({ title, subtitle, count }: Props) {
  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ title }} />
      <BusinessFeedScreen title={title} subtitle={subtitle} count={count} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E5E0E5',
  },
});
