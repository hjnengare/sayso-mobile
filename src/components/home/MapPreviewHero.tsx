import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import MapLibreGL from '@maplibre/maplibre-react-native';
import { routes } from '../../navigation/routes';
import { homeTokens } from '../../screens/tabs/home/HomeTokens';
import { Text } from '../Typography';
import {
  CAPE_TOWN_CENTER,
  fetchTrendingNearbyPins,
  MAPBOX_ACCESS_TOKEN,
  MAP_QUERY_STALE_TIME_MS,
  type MapCenter,
} from './mapPreviewShared';

MapLibreGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

const MAP_STYLE = `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${MAPBOX_ACCESS_TOKEN}`;

type Props = {
  style?: StyleProp<ViewStyle>;
};

export function MapPreviewHero({ style }: Props) {
  const router = useRouter();
  const cameraRef = useRef<MapLibreGL.Camera>(null);
  const lastMarkerPressAt = useRef(0);
  const [center, setCenter] = useState<MapCenter>(CAPE_TOWN_CENTER);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const permission = await Location.requestForegroundPermissionsAsync();
        if (!mounted || !permission.granted) return;

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (!mounted) return;

        setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
      } catch {
        // Keep Cape Town fallback.
      }
    })();
    return () => { mounted = false; };
  }, []);

  const nearbyQuery = useQuery({
    queryKey: ['home-map-preview-nearby', center.lat, center.lng],
    queryFn: () => fetchTrendingNearbyPins(center),
    staleTime: MAP_QUERY_STALE_TIME_MS,
    placeholderData: (prev) => prev,
  });

  const pins = useMemo(() => nearbyQuery.data ?? [], [nearbyQuery.data]);
  const mapPins = useMemo(
    () => (pins.length > 0 ? pins : [{ id: 'fallback-center', lat: center.lat, lng: center.lng }]),
    [pins, center]
  );

  useEffect(() => {
    if (!mapReady || mapPins.length === 0) return;

    if (mapPins.length === 1) {
      cameraRef.current?.setCamera({
        centerCoordinate: [mapPins[0].lng, mapPins[0].lat],
        zoomLevel: 12,
        animationDuration: 350,
      });
      return;
    }

    const lngs = mapPins.map((p) => p.lng);
    const lats = mapPins.map((p) => p.lat);
    cameraRef.current?.fitBounds(
      [Math.max(...lngs), Math.max(...lats)],
      [Math.min(...lngs), Math.min(...lats)],
      [24, 24, 24, 24],
      350
    );
  }, [mapPins, mapReady]);

  const handleOpenMap = useCallback(() => {
    if (Date.now() - lastMarkerPressAt.current < 300) return;
    router.push('/explore/map');
  }, [router]);

  const handleMarkerPress = useCallback(
    (businessId?: string) => {
      if (!businessId) return;
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

        <MapLibreGL.MapView
          style={styles.nativeMap}
          styleURL={MAP_STYLE}
          scrollEnabled={false}
          zoomEnabled={false}
          rotateEnabled={false}
          pitchEnabled={false}
          onDidFinishLoadingMap={() => setMapReady(true)}
          onPress={handleOpenMap}
          attributionEnabled={false}
          logoEnabled={false}
          compassEnabled={false}
          scaleBarEnabled={false}
        >
          <MapLibreGL.Camera
            ref={cameraRef}
            centerCoordinate={[center.lng, center.lat]}
            zoomLevel={12}
            animationDuration={0}
          />

          {mapPins.map((pin) => (
            <MapLibreGL.MarkerView
              key={pin.id}
              id={pin.id}
              coordinate={[pin.lng, pin.lat]}
            >
              <Pressable onPress={() => handleMarkerPress(pin.businessId)} hitSlop={8}>
                <View style={styles.pinMarkerWrap}>
                  <View style={styles.pinAura} />
                  <View style={styles.pin}>
                    <View style={styles.pinCore} />
                  </View>
                </View>
              </Pressable>
            </MapLibreGL.MarkerView>
          ))}
        </MapLibreGL.MapView>

        <View pointerEvents="none" style={styles.colorWash} />
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
  nativeMap: {
    ...StyleSheet.absoluteFillObject,
  },
  colorWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(114,47,55,0.08)',
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
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinAura: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(114,47,55,0.24)',
  },
  pin: {
    width: 20,
    height: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 2,
    backgroundColor: '#722F37',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-45deg' }],
    shadowColor: '#722F37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
    elevation: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinCore: {
    width: 6,
    height: 6,
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
