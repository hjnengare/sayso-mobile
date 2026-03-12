import { memo, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

type Props = {
  imageUri: string | null;
  isFallbackArtwork: boolean;
};

function EventCardImageComponent({ imageUri, isFallbackArtwork }: Props) {
  const [failed, setFailed] = useState(false);
  const shouldShowImage = !!imageUri && !failed;

  useEffect(() => {
    setFailed(false);
  }, [imageUri]);

  return (
    <View style={styles.container}>
      {shouldShowImage ? (
        <Image
          source={{ uri: imageUri ?? undefined }}
          style={isFallbackArtwork ? styles.fallbackArtworkImage : styles.image}
          contentFit={isFallbackArtwork ? 'contain' : 'cover'}
          contentPosition="center"
          cachePolicy="memory-disk"
          recyclingKey={imageUri ?? 'event-fallback'}
          transition={180}
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={styles.fallbackState}>
          <Ionicons name="calendar-outline" size={42} color="rgba(45,45,45,0.2)" />
        </View>
      )}
    </View>
  );
}

export const EventCardImage = memo(
  EventCardImageComponent,
  (prev, next) => prev.imageUri === next.imageUri && prev.isFallbackArtwork === next.isFallbackArtwork
);

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E0E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E0E5',
  },
  fallbackArtworkImage: {
    width: '56%',
    height: '56%',
    backgroundColor: 'transparent',
  },
  fallbackState: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E0E5',
  },
});
