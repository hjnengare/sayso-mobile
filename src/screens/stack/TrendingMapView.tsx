import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
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

type MappedBusiness = BusinessListItemDto & { lat: number; lng: number };

type Cluster = {
  id: string;
  key: string;
  centerLat: number;
  centerLng: number;
  members: MappedBusiness[];
};

function toClusterKey(lat: number, lng: number) {
  // ~100-120m buckets for a lightweight, deterministic cluster.
  return `${lat.toFixed(3)}:${lng.toFixed(3)}`;
}

function getOffsetCoordinate(baseLat: number, baseLng: number, index: number, total: number) {
  if (total <= 1) return { latitude: baseLat, longitude: baseLng };
  const angle = (2 * Math.PI * index) / total;
  const radiusMeters = 24 + Math.floor(index / 8) * 10;
  const dLat = radiusMeters / 111_320;
  const dLng = radiusMeters / (111_320 * Math.cos((baseLat * Math.PI) / 180));
  return {
    latitude: baseLat + dLat * Math.sin(angle),
    longitude: baseLng + dLng * Math.cos(angle),
  };
}

export function TrendingMapView({ businesses, userLocation }: Props) {
  const router = useRouter();
  const tileUrl = buildNativeMapboxTileUrl();
  const mapBusinesses = businesses.filter(
    (b): b is BusinessListItemDto & { lat: number; lng: number } => b.lat != null && b.lng != null
  );
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);

  const clusters = useMemo<Cluster[]>(() => {
    const grouped = new Map<string, MappedBusiness[]>();
    mapBusinesses.forEach((business) => {
      const key = toClusterKey(business.lat, business.lng);
      const existing = grouped.get(key);
      if (existing) existing.push(business);
      else grouped.set(key, [business]);
    });

    return Array.from(grouped.entries()).map(([key, members], index) => {
      const centerLat = members.reduce((sum, member) => sum + member.lat, 0) / members.length;
      const centerLng = members.reduce((sum, member) => sum + member.lng, 0) / members.length;
      return {
        id: `cluster-${index}-${key}`,
        key,
        centerLat,
        centerLng,
        members,
      };
    });
  }, [mapBusinesses]);

  useEffect(() => {
    if (!expandedClusterId) return;
    if (!clusters.some((cluster) => cluster.id === expandedClusterId)) {
      setExpandedClusterId(null);
    }
  }, [clusters, expandedClusterId]);

  const mapRegion = getMapRegion(
    userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : CAPE_TOWN_CENTER
  );

  return (
    <MapView
      style={styles.map}
      initialRegion={mapRegion}
      mapType="none"
      showsUserLocation
      showsCompass={false}
      moveOnMarkerPress={false}
      onPress={() => setExpandedClusterId(null)}
    >
      {tileUrl ? <UrlTile urlTemplate={tileUrl} maximumZ={19} flipY={false} /> : null}
      {clusters.map((cluster) => {
        if (cluster.members.length <= 1) {
          const business = cluster.members[0];
          return (
            <Marker
              key={business.id}
              coordinate={{ latitude: business.lat, longitude: business.lng }}
              anchor={{ x: 0.5, y: 1 }}
              tracksViewChanges
              onPress={() => router.push(routes.businessDetail(business.id) as never)}
            >
              <View style={styles.pinMarkerWrap}>
                <View style={styles.pinAura} />
                <View style={styles.pin}>
                  <View style={styles.pinCore} />
                </View>
              </View>
            </Marker>
          );
        }

        const isExpanded = expandedClusterId === cluster.id;
        if (!isExpanded) {
          return (
            <Marker
              key={cluster.id}
              coordinate={{ latitude: cluster.centerLat, longitude: cluster.centerLng }}
              anchor={{ x: 0.5, y: 0.5 }}
              tracksViewChanges
              onPress={() => setExpandedClusterId(cluster.id)}
            >
              <View style={styles.clusterWrap}>
                <View style={styles.clusterOuter}>
                  <View style={styles.clusterInner}>
                    <Text style={styles.clusterText}>{cluster.members.length}</Text>
                  </View>
                </View>
              </View>
            </Marker>
          );
        }

        return cluster.members.map((business, index) => (
          <Marker
            key={`${cluster.id}-${business.id}`}
            coordinate={getOffsetCoordinate(cluster.centerLat, cluster.centerLng, index, cluster.members.length)}
            anchor={{ x: 0.5, y: 1 }}
            tracksViewChanges
            onPress={() => router.push(routes.businessDetail(business.id) as never)}
          >
            <View style={styles.pinMarkerWrap}>
              <View style={styles.pinAura} />
              <View style={styles.pin}>
                <View style={styles.pinCore} />
              </View>
            </View>
          </Marker>
        ));
      })}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1, marginBottom: 8 },
  pinMarkerWrap: {
    width: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinAura: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(114,47,55,0.24)',
  },
  pin: {
    width: 18,
    height: 18,
    borderTopLeftRadius: 9,
    borderTopRightRadius: 9,
    borderBottomLeftRadius: 9,
    borderBottomRightRadius: 2,
    backgroundColor: businessDetailColors.coral,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCore: {
    width: 5,
    height: 5,
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '45deg' }],
  },
  clusterWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterOuter: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(114,47,55,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterInner: {
    minWidth: 30,
    height: 30,
    borderRadius: 15,
    paddingHorizontal: 8,
    backgroundColor: businessDetailColors.coral,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clusterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
