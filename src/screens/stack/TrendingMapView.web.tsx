import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { BusinessListItemDto } from '@sayso/contracts';
import { Text } from '../../components/Typography';
import { businessDetailColors } from '../../components/business-detail/styles';

type Props = {
  businesses: BusinessListItemDto[];
  userLocation: { lat: number; lng: number } | null;
};

export function TrendingMapView({ businesses }: Props) {
  return (
    <View style={styles.container}>
      <Ionicons name="map-outline" size={40} color={businessDetailColors.textSubtle} />
      <Text style={styles.text}>Map view is available on the mobile app</Text>
      <Text style={styles.sub}>{businesses.length} businesses loaded</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: businessDetailColors.page,
  },
  text: {
    fontSize: 15,
    fontWeight: '600',
    color: businessDetailColors.textMuted,
    textAlign: 'center',
  },
  sub: {
    fontSize: 13,
    color: businessDetailColors.textSubtle,
  },
});
