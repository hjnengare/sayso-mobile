import { useEffect, useMemo, useState } from 'react';
import { Clipboard, Linking, Modal, Pressable, Share, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { SkeletonBlock } from '../SkeletonBlock';
import { Text } from '../Typography';
import { businessDetailColors, businessDetailSpacing } from './styles';
import {
  buildBusinessMapPreviewUrl,
  buildGoogleDirectionsUrl,
  buildGoogleWalkingUrl,
  buildUberUrl,
} from './utils';

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateTravelTime(distanceKm: number, mode: 'drive' | 'walk'): string {
  const speed = mode === 'walk' ? 5 : 40;
  const minutes = Math.round((distanceKm / speed) * 60);
  if (minutes < 60) return `${minutes} min ${mode}`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m ${mode}` : `${h}h ${mode}`;
}

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)}m` : `${km.toFixed(1)}km`;
}

type Props = {
  name: string;
  address?: string | null;
  location?: string | null;
  latitude?: number | null;
  longitude?: number | null;
};

export function BusinessLocationCard({ name, address, location, latitude, longitude }: Props) {
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [copied, setCopied] = useState(false);
  const displayLocation = address || location || '';
  const hasCoordinates = typeof latitude === 'number' && typeof longitude === 'number';

  useEffect(() => {
    if (!hasCoordinates) return;
    let cancelled = false;
    setLoadingLocation(true);
    void (async () => {
      try {
        const perm = await Location.requestForegroundPermissionsAsync();
        if (!perm.granted || cancelled) return;
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (cancelled) return;
        setDistance(haversineKm(pos.coords.latitude, pos.coords.longitude, latitude!, longitude!));
      } catch {
        // No-op — distance stays null.
      } finally {
        if (!cancelled) setLoadingLocation(false);
      }
    })();
    return () => { cancelled = true; };
  }, [hasCoordinates, latitude, longitude]);

  const handleCopyAddress = () => {
    const text = displayLocation;
    if (!text) return;
    Clipboard.setString(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  const mapPreviewUrl = useMemo(
    () =>
      buildBusinessMapPreviewUrl({
        lat: latitude,
        lng: longitude,
      }),
    [latitude, longitude]
  );

  const directionsUrl = useMemo(
    () => buildGoogleDirectionsUrl(name, latitude, longitude, displayLocation),
    [name, latitude, longitude, displayLocation]
  );
  const walkingUrl = useMemo(
    () => buildGoogleWalkingUrl(name, latitude, longitude, displayLocation),
    [name, latitude, longitude, displayLocation]
  );
  const uberUrl = useMemo(() => buildUberUrl(name, latitude, longitude), [name, latitude, longitude]);

  if (!hasCoordinates && !displayLocation) {
    return null;
  }

  const handleShare = async () => {
    try {
      await Share.share({
        title: name,
        message: `${name} - ${displayLocation || 'Cape Town'}\n${directionsUrl}`,
      });
    } catch {
      // No-op to avoid blocking navigation.
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.iconPill}>
            <Ionicons name="location" size={16} color={businessDetailColors.charcoal} />
          </View>
          <Text style={styles.heading}>Location</Text>
        </View>
        <View style={styles.headerActions}>
          {displayLocation ? (
            <Pressable
              onPress={handleCopyAddress}
              style={styles.headerAction}
              accessibilityLabel="Copy address"
            >
              <Ionicons
                name={copied ? 'checkmark' : 'copy'}
                size={15}
                color={businessDetailColors.charcoal}
              />
            </Pressable>
          ) : null}
          <Pressable onPress={handleShare} style={styles.headerAction} accessibilityLabel="Share business location">
            <Ionicons name="share-social" size={15} color={businessDetailColors.charcoal} />
          </Pressable>
        </View>
      </View>

      {displayLocation ? <Text style={styles.locationLabel}>{displayLocation}</Text> : null}

      {loadingLocation ? (
        <View style={styles.distanceLoading}>
          <SkeletonBlock style={styles.distancePillSkeletonShort} />
          <SkeletonBlock style={styles.distancePillSkeletonMedium} />
          <SkeletonBlock style={styles.distancePillSkeletonShort} />
        </View>
      ) : distance !== null ? (
        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Ionicons name="navigate" size={12} color={businessDetailColors.sage} />
            <Text style={styles.pillText}>{formatDistance(distance)} away</Text>
          </View>
          <View style={styles.pill}>
            <Ionicons name="car" size={12} color={businessDetailColors.coral} />
            <Text style={styles.pillText}>{estimateTravelTime(distance, 'drive')}</Text>
          </View>
          {distance < 3 ? (
            <View style={styles.pill}>
              <Ionicons name="walk" size={12} color={businessDetailColors.textMuted} />
              <Text style={styles.pillText}>{estimateTravelTime(distance, 'walk')}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {mapPreviewUrl ? (
        <Pressable style={styles.mapPreviewWrap} onPress={() => setMapModalOpen(true)}>
          <Image source={{ uri: mapPreviewUrl }} style={styles.mapPreview} contentFit="cover" />
          <View style={styles.mapOverlay}>
            <View style={styles.mapOverlayPill}>
              <Ionicons name="expand" size={14} color={businessDetailColors.charcoal} />
              <Text style={styles.mapOverlayText}>View larger</Text>
            </View>
          </View>
        </Pressable>
      ) : (
        <View style={styles.mapFallback}>
          <Ionicons name="map" size={28} color={businessDetailColors.textMuted} />
          <Text style={styles.mapFallbackText}>Map coordinates are not available yet.</Text>
        </View>
      )}

      <View style={styles.actionRow}>
        <Pressable style={styles.actionPrimary} onPress={() => Linking.openURL(directionsUrl)}>
          <Ionicons name="navigate" size={15} color={businessDetailColors.white} />
          <Text style={styles.actionPrimaryText}>Get directions</Text>
        </Pressable>

        <Pressable style={styles.actionCircle} onPress={() => Linking.openURL(walkingUrl)}>
          <Ionicons name="walk" size={15} color={businessDetailColors.charcoal} />
        </Pressable>
      </View>

      {uberUrl ? (
        <Pressable style={styles.uberButton} onPress={() => Linking.openURL(uberUrl)}>
          <Text style={styles.uberButtonText}>Get an Uber</Text>
        </Pressable>
      ) : null}

      <Modal visible={mapModalOpen} animationType="slide" transparent onRequestClose={() => setMapModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalShell}>
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle} numberOfLines={1}>
                  {name}
                </Text>
                {displayLocation ? (
                  <Text style={styles.modalSubtitle} numberOfLines={2}>
                    {displayLocation}
                  </Text>
                ) : null}
              </View>
              <Pressable style={styles.modalClose} onPress={() => setMapModalOpen(false)}>
                <Ionicons name="close" size={20} color={businessDetailColors.white} />
              </Pressable>
            </View>

            {mapPreviewUrl ? (
              <Image source={{ uri: mapPreviewUrl }} style={styles.modalMap} contentFit="cover" />
            ) : (
              <View style={styles.modalMapFallback}>
                <Ionicons name="map" size={34} color="rgba(255,255,255,0.72)" />
              </View>
            )}

            <View style={styles.modalFooter}>
              <Pressable style={styles.modalActionPrimary} onPress={() => Linking.openURL(directionsUrl)}>
                <Ionicons name="car" size={15} color={businessDetailColors.white} />
                <Text style={styles.modalActionPrimaryText}>Drive</Text>
              </Pressable>

              <Pressable style={styles.modalActionSecondary} onPress={() => Linking.openURL(walkingUrl)}>
                <Ionicons name="walk" size={15} color={businessDetailColors.white} />
                <Text style={styles.modalActionSecondaryText}>Walk</Text>
              </Pressable>

              <Pressable style={styles.modalShare} onPress={handleShare}>
                <Ionicons name="share-social" size={17} color={businessDetailColors.white} />
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: businessDetailSpacing.cardRadius,
    borderWidth: 1,
    borderColor: businessDetailColors.borderSoft,
    backgroundColor: businessDetailColors.cardTint,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconPill: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,224,229,0.75)',
  },
  heading: {
    color: businessDetailColors.charcoal,
    fontSize: 19,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 6,
  },
  headerAction: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,224,229,0.75)',
  },
  distanceLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  distancePillSkeletonShort: {
    width: 76,
    height: 26,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  distancePillSkeletonMedium: {
    width: 98,
    height: 26,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(45,45,45,0.08)',
  },
  pillText: {
    color: businessDetailColors.charcoal,
    fontSize: 12,
    fontWeight: '600',
  },
  locationLabel: {
    color: businessDetailColors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
  mapPreviewWrap: {
    width: '100%',
    height: 220,
    borderRadius: 10,
    overflow: 'hidden',
  },
  mapPreview: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(17,24,39,0.16)',
  },
  mapOverlayPill: {
    borderRadius: 999,
    backgroundColor: 'rgba(229,224,229,0.92)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mapOverlayText: {
    color: businessDetailColors.charcoal,
    fontSize: 12,
    fontWeight: '700',
  },
  mapFallback: {
    width: '100%',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 160,
    paddingHorizontal: 16,
  },
  mapFallbackText: {
    color: businessDetailColors.textMuted,
    fontSize: 13,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionPrimary: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: businessDetailColors.coral,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  actionPrimaryText: {
    color: businessDetailColors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  actionCircle: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,224,229,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.36)',
  },
  uberButton: {
    borderRadius: 999,
    backgroundColor: 'rgba(229,224,229,0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.36)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
  },
  uberButtonText: {
    color: businessDetailColors.charcoal,
    fontSize: 13,
    fontWeight: '700',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.92)',
    justifyContent: 'flex-end',
  },
  modalShell: {
    width: '100%',
    height: '94%',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#121826',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  modalTitle: {
    color: businessDetailColors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  modalMap: {
    flex: 1,
  },
  modalMapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(9,12,19,0.95)',
  },
  modalActionPrimary: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: businessDetailColors.coral,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  modalActionPrimaryText: {
    color: businessDetailColors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  modalActionSecondary: {
    flex: 1,
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.18)',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  modalActionSecondaryText: {
    color: businessDetailColors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  modalShare: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
});
