import { StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import type { BusinessListItemDto } from '@sayso/contracts';
import { routes } from '../../navigation/routes';
import { businessDetailColors } from '../../components/business-detail/styles';
import {
  buildNativeMapboxTileUrl,
  CAPE_TOWN_CENTER,
  getMapRegion,
} from '../../components/home/mapPreviewShared';

type Props = {
  businesses: BusinessListItemDto[];
  userLocation: { lat: number; lng: number } | null;
};

export function TrendingMapView({ businesses, userLocation }: Props) {
  const router = useRouter();
  const tileUrl = buildNativeMapboxTileUrl();
  const mapRegion = getMapRegion(
    userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : CAPE_TOWN_CENTER
  );

  return (
    <MapView
      style={styles.map}
      initialRegion={mapRegion}
      showsUserLocation
      showsCompass={false}
    >
      {tileUrl ? <UrlTile urlTemplate={tileUrl} maximumZ={19} flipY={false} /> : null}
      {businesses.map((b) => (
        <Marker
          key={b.id}
          coordinate={{ latitude: b.lat!, longitude: b.lng! }}
          pinColor={businessDetailColors.coral}
          title={b.name}
          onCalloutPress={() => router.push(routes.businessDetail(b.id) as never)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
});
