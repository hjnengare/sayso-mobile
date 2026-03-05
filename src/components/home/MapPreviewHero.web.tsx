import { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import * as Location from 'expo-location';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useQuery } from '@tanstack/react-query';
import { homeTokens } from '../../screens/tabs/home/HomeTokens';
import { Text } from '../Typography';
import {
  buildMapboxStaticUrl,
  CAPE_TOWN_CENTER,
  fetchTrendingNearbyPins,
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
  });

  const pins = useMemo(() => nearbyQuery.data ?? [], [nearbyQuery.data]);
  const mapPins = useMemo(
    () => (pins.length > 0 ? pins : [{ id: 'fallback-center', lat: center.lat, lng: center.lng }]),
    [pins, center]
  );

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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Explore places near you on the map"
      onPress={handleOpenMap}
      style={({ pressed }) => [styles.container, style, pressed ? styles.containerPressed : null]}
    >
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

        <View pointerEvents="none" style={styles.colorWash} />
        <View pointerEvents="none" style={styles.orbNorth} />
        <View pointerEvents="none" style={styles.orbSouth} />

        <View pointerEvents="none" style={styles.liveBadge}>
          <Text style={styles.liveBadgeText}>Live Nearby</Text>
        </View>

        <LinearGradient colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.55)']} style={styles.bottomGradient} />

        <View style={styles.copyWrap}>
          <Text style={styles.title}>Explore places near you</Text>
        </View>
      </View>
    </Pressable>
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
  containerPressed: {
    opacity: 0.96,
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
