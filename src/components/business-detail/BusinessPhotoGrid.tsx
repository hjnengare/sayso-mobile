import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Typography';
import { businessDetailColors, businessDetailSpacing } from './styles';

type Props = {
  businessName: string;
  photos: string[];
};

export function BusinessPhotoGrid({ businessName, photos }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const normalizedPhotos = useMemo(() => {
    const seen = new Set<string>();
    const list: string[] = [];
    for (const photo of photos) {
      const trimmed = photo?.trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      list.push(trimmed);
    }
    return list;
  }, [photos]);

  const gridPhotos = normalizedPhotos.slice(0, 9);
  const hasPhotos = gridPhotos.length > 0;

  const openModalAt = (index: number) => {
    setActiveIndex(index);
    setModalVisible(true);
  };

  const goPrev = () => {
    setActiveIndex((current) => (current === 0 ? normalizedPhotos.length - 1 : current - 1));
  };

  const goNext = () => {
    setActiveIndex((current) => (current === normalizedPhotos.length - 1 ? 0 : current + 1));
  };

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Photos</Text>

      {hasPhotos ? (
        <>
          <View style={styles.grid}>
            {gridPhotos.map((photo, index) => (
              <Pressable
                key={`${photo}-${index}`}
                onPress={() => openModalAt(index)}
                style={styles.gridCell}
                accessibilityRole="button"
                accessibilityLabel={`Open photo ${index + 1}`}
              >
                <Image source={{ uri: photo }} style={styles.gridImage} contentFit="cover" />
              </Pressable>
            ))}
          </View>

          <Pressable style={styles.viewMoreButton} onPress={() => openModalAt(0)}>
            <Text style={styles.viewMoreText}>View More</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No photos yet</Text>
          <Text style={styles.emptyBody}>
            Photos from this business profile will appear here when gallery images are available.
          </Text>
        </View>
      )}

      <Modal animationType="fade" transparent visible={modalVisible} onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setModalVisible(false)} />
          <View style={styles.modalContent}>
            <Pressable style={styles.modalClose} onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={22} color="#FFFFFF" />
            </Pressable>

            {normalizedPhotos.length > 1 ? (
              <Pressable style={styles.modalArrowLeft} onPress={goPrev}>
                <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
              </Pressable>
            ) : null}

            {normalizedPhotos.length > 1 ? (
              <Pressable style={styles.modalArrowRight} onPress={goNext}>
                <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
              </Pressable>
            ) : null}

            {normalizedPhotos[activeIndex] ? (
              <Image source={{ uri: normalizedPhotos[activeIndex] }} style={styles.modalImage} contentFit="contain" />
            ) : null}

            {normalizedPhotos.length > 0 ? (
              <Text style={styles.modalCounter}>
                {activeIndex + 1} / {normalizedPhotos.length}
              </Text>
            ) : null}
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
  heading: {
    color: businessDetailColors.charcoal,
    fontSize: 19,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  gridCell: {
    width: '31.8%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(229,224,229,0.5)',
  },
  gridImage: {
    width: '100%',
    height: '100%',
  },
  viewMoreButton: {
    marginTop: 4,
    borderRadius: 999,
    backgroundColor: businessDetailColors.coral,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewMoreText: {
    color: businessDetailColors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyState: {
    borderRadius: 10,
    padding: 14,
    backgroundColor: 'rgba(229,224,229,0.4)',
    gap: 6,
  },
  emptyTitle: {
    color: businessDetailColors.charcoal,
    fontSize: 14,
    fontWeight: '700',
  },
  emptyBody: {
    color: businessDetailColors.textMuted,
    fontSize: 13,
    lineHeight: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalImage: {
    width: '100%',
    height: '84%',
  },
  modalClose: {
    position: 'absolute',
    top: 32,
    right: 12,
    zIndex: 3,
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modalArrowLeft: {
    position: 'absolute',
    left: 8,
    top: '50%',
    marginTop: -22,
    zIndex: 3,
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modalArrowRight: {
    position: 'absolute',
    right: 8,
    top: '50%',
    marginTop: -22,
    zIndex: 3,
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  modalCounter: {
    position: 'absolute',
    bottom: 28,
    color: businessDetailColors.white,
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'rgba(17,24,39,0.55)',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
});
