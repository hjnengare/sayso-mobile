import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { routes } from '../../navigation/routes';
import { homeTokens } from '../../screens/tabs/home/HomeTokens';
import { Text } from '../Typography';
import {
  buildNativeMapboxTileUrl,
  CAPE_TOWN_CENTER,
  fetchTrendingNearbyPins,
  getMapRegion,
  MAP_QUERY_STALE_TIME_MS,
  type MapCenter,
} from './mapPreviewShared';

type Props = {
  style?: StyleProp<ViewStyle>;
};

export function MapPreviewHero({ style }: Props) {
  const router = useRouter();
  const mapRef = useRef<MapView | null>(null);
  const lastMarkerPressAt = useRef(0);
  const [center, setCenter] = useState<MapCenter>(CAPE_TOWN_CENTER);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!mounted || !permission.granted) {
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        if (!mounted) {
          return;
        }

        setCenter({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      } catch {
        // Keep Cape Town fallback center.
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const nearbyQuery = useQuery({
    queryKey: ['home-map-preview-nearby', center.lat, center.lng],
    queryFn: () => fetchTrendingNearbyPins(center),
    staleTime: MAP_QUERY_STALE_TIME_MS,
    placeholderData: (previousData) => previousData,
  });

  const pins = useMemo(() => nearbyQuery.data ?? [], [nearbyQuery.data]);
  const mapPins = useMemo(
    () => (pins.length > 0 ? pins : [{ id: 'fallback-center', lat: center.lat, lng: center.lng }]),
    [pins, center]
  );
  const mapRegion = useMemo(() => getMapRegion(center), [center]);
  const nativeMapboxTileUrl = useMemo(() => buildNativeMapboxTileUrl(), []);

  useEffect(() => {
    if (!mapReady || !mapRef.current || mapPins.length === 0) {
      return;
    }

    if (mapPins.length === 1) {
      mapRef.current.animateToRegion(
        {
          latitude: mapPins[0].lat,
          longitude: mapPins[0].lng,
          latitudeDelta: mapRegion.latitudeDelta,
          longitudeDelta: mapRegion.longitudeDelta,
        },
        350
      );
      return;
    }

    mapRef.current.fitToCoordinates(
      mapPins.map((pin) => ({
        latitude: pin.lat,
        longitude: pin.lng,
      })),
      {
        edgePadding: { top: 24, right: 24, bottom: 24, left: 24 },
        animated: false,
      }
    );
  }, [mapPins, mapReady, mapRegion.latitudeDelta, mapRegion.longitudeDelta]);

  const handleOpenMap = useCallback(() => {
    if (Date.now() - lastMarkerPressAt.current < 300) {
      return;
    }
    router.push('/explore/map');
  }, [router]);

  const handleMarkerPress = useCallback(
    (businessId?: string) => {
      if (!businessId) {
        return;
      }
      lastMarkerPressAt.current = Date.now();
      router.push(routes.businessDetail(businessId) as never);
    },
    [router]
  );

  return (
    <View
      accessible
      accessibilityLabel="Explore places near you on the map"
      style={[styles.container, style]}
    >
      <View style={styles.mapWrap}>
        <View style={styles.mapBase} />

        {nativeMapboxTileUrl ? (
          <View style={styles.nativeMapWrap}>
            <MapView
              ref={mapRef}
              style={styles.nativeMap}
              initialRegion={mapRegion}
              mapType="none"
              scrollEnabled={false}
              zoomEnabled={false}
              rotateEnabled={false}
              pitchEnabled={false}
              moveOnMarkerPress={false}
              toolbarEnabled={false}
              onMapReady={() => setMapReady(true)}
              onPress={handleOpenMap}
            >
              <UrlTile urlTemplate={nativeMapboxTileUrl} maximumZ={20} tileSize={512} zIndex={-1} />
              {mapPins.map((pin) => (
                <Marker
                  key={pin.id}
                  coordinate={{
                    latitude: pin.lat,
                    longitude: pin.lng,
                  }}
                  anchor={{ x: 0.5, y: 1 }}
                  tracksViewChanges
                  onPress={() => handleMarkerPress(pin.businessId)}
                >
                  <View style={styles.pinMarkerWrap}>
                    <View style={styles.pinAura} />
                    <View style={styles.pin}>
                      <View style={styles.pinCore} />
                    </View>
                  </View>
                </Marker>
              ))}
            </MapView>
          </View>
        ) : null}

        <View pointerEvents="none" style={styles.colorWash} />
        <View pointerEvents="none" style={styles.orbNorth} />
        <View pointerEvents="none" style={styles.orbSouth} />

        <View pointerEvents="none" style={styles.liveBadge}>
          <Text style={styles.liveBadgeText}>Live Nearby</Text>
        </View>

        <LinearGradient
          pointerEvents="none"
          colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']}
          style={styles.bottomGradient}
        />

        <View pointerEvents="none" style={styles.copyWrap}>
          <Text style={styles.title}>Explore places near you</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: homeTokens.pageGutter,
    marginTop: 12,
    height: 192,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(45,55,72,0.12)',
    backgroundColor: '#CED7E2',
  },
  mapWrap: {
    flex: 1,
    overflow: 'hidden',
  },
  mapBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#CED7E2',
  },
  nativeMapWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  nativeMap: {
    ...StyleSheet.absoluteFillObject,
  },
  colorWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(114,47,55,0.1)',
  },
  orbNorth: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 180,
    top: -90,
    right: -55,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  orbSouth: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 160,
    bottom: -72,
    left: -54,
    backgroundColor: 'rgba(114,47,55,0.12)',
  },
  liveBadge: {
    position: 'absolute',
    left: 12,
    top: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(17,24,39,0.3)',
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  liveBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.35,
  },
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
    backgroundColor: '#722F37',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-45deg' }],
    shadowColor: '#722F37',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
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
  bottomGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  copyWrap: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 12,
    alignItems: 'flex-start',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 22,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
