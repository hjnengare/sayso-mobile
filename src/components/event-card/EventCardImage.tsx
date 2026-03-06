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
          style={styles.image}
          contentFit={isFallbackArtwork ? 'contain' : 'cover'}
          contentPosition="center"
          cachePolicy="memory-disk"
          recyclingKey={imageUri ?? 'event-fallback'}
          transition={150}
          onError={() => setFailed(true)}
        />
      ) : (
        <View style={styles.fallbackState}>
          <Ionicons name="calendar" size={36} color="rgba(45, 55, 72, 0.45)" />
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
    backgroundColor: '#F7FAFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#F7FAFC',
  },
  fallbackState: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FAFC',
  },
});
