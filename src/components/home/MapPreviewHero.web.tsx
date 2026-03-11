import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { routes } from '../../navigation/routes';
import { homeTokens } from '../../screens/tabs/home/HomeTokens';
import { Text } from '../Typography';
import {
  buildMapboxStaticUrl,
  CAPE_TOWN_CENTER,
  fetchTrendingNearbyPins,
  getStaticPreviewMarkerPositions,
  MAPBOX_ACCESS_TOKEN,
  MAPBOX_WEB_PIN_URL,
  MAP_QUERY_STALE_TIME_MS,
  type MapCenter,
} from './mapPreviewShared';

type Props = {
  style?: StyleProp<ViewStyle>;
};

export function MapPreviewHero({ style }: Props) {
  const router = useRouter();
  const [center, setCenter] = useState<MapCenter>(CAPE_TOWN_CENTER);
  const [mapSourceIndex, setMapSourceIndex] = useState(0);

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
  const projectedMarkers = useMemo(() => getStaticPreviewMarkerPositions(center, mapPins), [center, mapPins]);

  const mapSources = useMemo(() => {
    if (!MAPBOX_ACCESS_TOKEN) {
      return [] as string[];
    }

    const variants: string[] = [];
    if (MAPBOX_WEB_PIN_URL) {
      variants.push(buildMapboxStaticUrl(center, mapPins, 'web-custom-pin'));
    }
    variants.push(buildMapboxStaticUrl(center, mapPins, 'default-pin'));
    variants.push(buildMapboxStaticUrl(center, mapPins, 'none'));
    return variants;
  }, [center, mapPins]);

  useEffect(() => {
    setMapSourceIndex(0);
  }, [mapSources]);

  const activeMapSource = mapSources[mapSourceIndex] ?? null;

  const handleMapImageError = useCallback(() => {
    setMapSourceIndex((current) => (current < mapSources.length - 1 ? current + 1 : current));
  }, [mapSources.length]);

  const handleOpenMap = useCallback(() => {
    router.push('/explore/map');
  }, [router]);

  const handleMarkerPress = useCallback(
    (businessId?: string) => {
      if (!businessId) {
        router.push('/explore/map');
        return;
      }
      router.push(routes.businessDetail(businessId) as never);
    },
    [router]
  );

  return (
    <View accessible accessibilityLabel="Explore places near you on the map" style={[styles.container, style]}>
      <View style={styles.mapWrap}>
        <View style={styles.mapBase} />

        {activeMapSource ? (
          <Image
            source={{ uri: activeMapSource }}
            resizeMode="cover"
            style={styles.mapImage}
            onError={handleMapImageError}
          />
        ) : null}

        <Pressable accessibilityRole="button" onPress={handleOpenMap} style={styles.mapTapLayer} />

        <View pointerEvents="box-none" style={styles.markerLayer}>
          {projectedMarkers.map((marker) => (
            <Pressable
              key={marker.id}
              accessibilityRole="button"
              accessibilityLabel="Open business from map marker"
              onPress={() => handleMarkerPress(marker.businessId)}
              style={[
                styles.markerTapTarget,
                {
                  left: `${marker.leftPercent}%`,
                  top: `${marker.topPercent}%`,
                },
              ]}
            >
              <View style={styles.pinMarkerWrap}>
                <View style={styles.pinAura} />
                <View style={styles.pin}>
                  <View style={styles.pinCore} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>

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
  mapImage: {
    ...StyleSheet.absoluteFillObject,
  },
  mapTapLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  markerLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  markerTapTarget: {
    position: 'absolute',
    width: 28,
    height: 28,
    marginLeft: -14,
    marginTop: -28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorWash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(114,47,55,0.1)',
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
