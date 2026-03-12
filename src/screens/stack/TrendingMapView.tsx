import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapLibreGL from '@maplibre/maplibre-react-native';
import type { BusinessListItemDto } from '@sayso/contracts';
import { routes } from '../../navigation/routes';
import { businessDetailColors } from '../../components/business-detail/styles';
import { Text } from '../../components/Typography';
import {
  CAPE_TOWN_CENTER,
  MAPBOX_ACCESS_TOKEN,
} from '../../components/home/mapPreviewShared';

MapLibreGL.setAccessToken(MAPBOX_ACCESS_TOKEN);

const MAP_STYLE = `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${MAPBOX_ACCESS_TOKEN}`;

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

// ─── Business Marker Callout ──────────────────────────────────────────────────
function StarRow({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <View style={calloutStyles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons
          key={i}
          name={i <= rounded ? 'star' : 'star-outline'}
          size={12}
          color={i <= rounded ? '#F5D547' : '#D1D5DB'}
        />
      ))}
    </View>
  );
}

type CalloutProps = {
  business: MappedBusiness;
  onClose: () => void;
  onView: () => void;
};

function BusinessCallout({ business, onClose, onView }: CalloutProps) {
  const slideAnim = useRef(new Animated.Value(80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 65,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const rating = business.rating ?? 0;
  const reviews = business.reviews ?? 0;

  return (
    <Animated.View
      style={[
        calloutStyles.card,
        { transform: [{ translateY: slideAnim }], opacity: opacityAnim },
      ]}
    >
      {/* Dismiss tap zone behind the card */}
      <Pressable style={calloutStyles.dismissZone} onPress={onClose} />

      <View style={calloutStyles.inner}>
        <View style={calloutStyles.handleBar} />

        <View style={calloutStyles.row}>
          <View style={calloutStyles.info}>
            <Text style={calloutStyles.name} numberOfLines={1}>
              {business.name}
            </Text>

            <View style={calloutStyles.metaRow}>
              {rating > 0 ? (
                <>
                  <StarRow rating={rating} />
                  <Text style={calloutStyles.ratingText}>{rating.toFixed(1)}</Text>
                  {reviews > 0 ? (
                    <Text style={calloutStyles.reviewsText}>({reviews})</Text>
                  ) : null}
                  <View style={calloutStyles.dot} />
                </>
              ) : null}
              {business.category_label ?? business.category ? (
                <Text style={calloutStyles.category} numberOfLines={1}>
                  {business.category_label ?? business.category}
                </Text>
              ) : null}
            </View>

            {business.location ?? business.address ? (
              <Text style={calloutStyles.address} numberOfLines={1}>
                {business.location ?? business.address}
              </Text>
            ) : null}
          </View>

          <Pressable style={calloutStyles.viewBtn} onPress={onView} accessibilityLabel="View business">
            <Text style={calloutStyles.viewBtnText}>View</Text>
            <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function TrendingMapView({ businesses, userLocation }: Props) {
  const router = useRouter();
  const cameraRef = useRef<MapLibreGL.Camera>(null);
  const mapBusinesses = businesses.filter(
    (b): b is MappedBusiness => b.lat != null && b.lng != null
  );
  const [expandedClusterId, setExpandedClusterId] = useState<string | null>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<MappedBusiness | null>(null);

  const clusters = useMemo<Cluster[]>(() => {
    const grouped = new Map<string, MappedBusiness[]>();
    mapBusinesses.forEach((business) => {
      const key = toClusterKey(business.lat, business.lng);
      const existing = grouped.get(key);
      if (existing) existing.push(business);
      else grouped.set(key, [business]);
    });

    return Array.from(grouped.entries()).map(([key, members], index) => {
      const centerLat = members.reduce((sum, m) => sum + m.lat, 0) / members.length;
      const centerLng = members.reduce((sum, m) => sum + m.lng, 0) / members.length;
      return { id: `cluster-${index}-${key}`, key, centerLat, centerLng, members };
    });
  }, [mapBusinesses]);

  useEffect(() => {
    if (!expandedClusterId) return;
    if (!clusters.some((c) => c.id === expandedClusterId)) {
      setExpandedClusterId(null);
    }
  }, [clusters, expandedClusterId]);

  const mapCenter = userLocation ?? CAPE_TOWN_CENTER;

  const handlePinPress = (business: MappedBusiness) => {
    setExpandedClusterId(null);
    setSelectedBusiness(business);
  };

  const handleViewBusiness = (businessId: string) => {
    setSelectedBusiness(null);
    router.push(routes.businessDetail(businessId) as never);
  };

  const handleMapPress = () => {
    setExpandedClusterId(null);
    setSelectedBusiness(null);
  };

  return (
    <View style={styles.container}>
      <MapLibreGL.MapView
        style={styles.map}
        styleURL={MAP_STYLE}
        onPress={handleMapPress}
        attributionEnabled={false}
        logoEnabled={false}
        compassEnabled={false}
        scaleBarEnabled={false}
      >
        <MapLibreGL.Camera
          ref={cameraRef}
          centerCoordinate={[mapCenter.lng, mapCenter.lat]}
          zoomLevel={12}
          animationDuration={0}
        />

        <MapLibreGL.UserLocation visible />

        {clusters.map((cluster) => {
          if (cluster.members.length <= 1) {
            const business = cluster.members[0];
            const isSelected = selectedBusiness?.id === business.id;
            return (
              <MapLibreGL.MarkerView
                key={business.id}
                id={business.id}
                coordinate={[business.lng, business.lat]}
              >
                <Pressable onPress={() => handlePinPress(business)} hitSlop={8}>
                  <View style={[styles.pinMarkerWrap, isSelected && styles.pinMarkerWrapSelected]}>
                    <View style={[styles.pinAura, isSelected && styles.pinAuraSelected]} />
                    <View style={[styles.pin, isSelected && styles.pinSelected]}>
                      <View style={styles.pinCore} />
                    </View>
                  </View>
                </Pressable>
              </MapLibreGL.MarkerView>
            );
          }

          const isExpanded = expandedClusterId === cluster.id;
          if (!isExpanded) {
            return (
              <MapLibreGL.MarkerView
                key={cluster.id}
                id={cluster.id}
                coordinate={[cluster.centerLng, cluster.centerLat]}
              >
                <Pressable onPress={() => setExpandedClusterId(cluster.id)}>
                  <View style={styles.clusterWrap}>
                    <View style={styles.clusterOuter}>
                      <View style={styles.clusterInner}>
                        <Text style={styles.clusterText}>{cluster.members.length}</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              </MapLibreGL.MarkerView>
            );
          }

          return cluster.members.map((business, index) => {
            const offset = getOffsetCoordinate(
              cluster.centerLat,
              cluster.centerLng,
              index,
              cluster.members.length
            );
            const isSelected = selectedBusiness?.id === business.id;
            return (
              <MapLibreGL.MarkerView
                key={`${cluster.id}-${business.id}`}
                id={`${cluster.id}-${business.id}`}
                coordinate={[offset.longitude, offset.latitude]}
              >
                <Pressable onPress={() => handlePinPress(business)} hitSlop={8}>
                  <View style={[styles.pinMarkerWrap, isSelected && styles.pinMarkerWrapSelected]}>
                    <View style={[styles.pinAura, isSelected && styles.pinAuraSelected]} />
                    <View style={[styles.pin, isSelected && styles.pinSelected]}>
                      <View style={styles.pinCore} />
                    </View>
                  </View>
                </Pressable>
              </MapLibreGL.MarkerView>
            );
          });
        })}
      </MapLibreGL.MapView>

      {/* Business Callout */}
      {selectedBusiness ? (
        <BusinessCallout
          business={selectedBusiness}
          onClose={() => setSelectedBusiness(null)}
          onView={() => handleViewBusiness(selectedBusiness.id)}
        />
      ) : null}
    </View>
  );
}

// ─── Map Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
    marginBottom: 8,
  },
  pinMarkerWrap: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinMarkerWrapSelected: {
    width: 26,
    height: 26,
  },
  pinAura: {
    position: 'absolute',
    width: 16,
    height: 16,
    borderRadius: 999,
    backgroundColor: 'rgba(114,47,55,0.22)',
  },
  pinAuraSelected: {
    width: 22,
    height: 22,
    backgroundColor: 'rgba(114,47,55,0.32)',
  },
  pin: {
    width: 20,
    height: 20,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 2,
    backgroundColor: businessDetailColors.coral,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    transform: [{ rotate: '-45deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinSelected: {
    width: 26,
    height: 26,
    borderTopLeftRadius: 13,
    borderTopRightRadius: 13,
    borderBottomLeftRadius: 13,
    borderBottomRightRadius: 2,
    borderWidth: 2,
    shadowColor: '#722F37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 4,
  },
  pinCore: {
    width: 6,
    height: 6,
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

// ─── Callout Styles ────────────────────────────────────────────────────────────
const calloutStyles = StyleSheet.create({
  dismissZone: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
  },
  card: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
    overflow: 'hidden',
  },
  inner: {
    padding: 16,
    gap: 12,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 999,
    backgroundColor: 'rgba(45,45,45,0.15)',
    alignSelf: 'center',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  stars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2D2D2D',
  },
  reviewsText: {
    fontSize: 12,
    color: 'rgba(45,45,45,0.55)',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 999,
    backgroundColor: 'rgba(45,45,45,0.30)',
  },
  category: {
    fontSize: 13,
    color: 'rgba(45,45,45,0.60)',
    flexShrink: 1,
  },
  address: {
    fontSize: 12,
    color: 'rgba(45,45,45,0.50)',
  },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#722F37',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    flexShrink: 0,
  },
  viewBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
