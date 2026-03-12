import { memo, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';

type Props = {
  imageUri: string | null;
  placeholderUri: string;
  isPlaceholder: boolean;
};

function BusinessCardImageComponent({ imageUri, placeholderUri, isPlaceholder }: Props) {
  const initialUri = imageUri || placeholderUri;
  const [currentUri, setCurrentUri] = useState(initialUri);
  const [showFallbackIcon, setShowFallbackIcon] = useState(false);

  useEffect(() => {
    setCurrentUri(initialUri);
    setShowFallbackIcon(false);
  }, [initialUri]);

  const handleError = () => {
    if (!showFallbackIcon && currentUri !== placeholderUri && !isPlaceholder) {
      setCurrentUri(placeholderUri);
      return;
    }

    setShowFallbackIcon(true);
  };

  if (showFallbackIcon) {
    return (
      <View style={styles.fallback}>
        <Ionicons name="image-outline" size={42} color="rgba(17, 24, 39, 0.22)" />
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Image
        source={{ uri: currentUri }}
        style={styles.image}
        contentFit="cover"
        cachePolicy="memory-disk"
        recyclingKey={currentUri}
        transition={180}
        placeholder={isPlaceholder ? undefined : { blurhash: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4' }}
        onError={handleError}
      />
      <View style={styles.overlay} pointerEvents="none" />
    </View>
  );
}

export const BusinessCardImage = memo(
  BusinessCardImageComponent,
  (prev, next) =>
    prev.imageUri === next.imageUri &&
    prev.placeholderUri === next.placeholderUri &&
    prev.isPlaceholder === next.isPlaceholder
);

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    height: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E5E0E5',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  fallback: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E0E5',
  },
});
