import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Text, TextInput } from '../Typography';

export type EditProfileSavePayload = {
  username: string;
  displayName: string;
  avatarAsset: ImagePicker.ImagePickerAsset | null;
  removeAvatar: boolean;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: EditProfileSavePayload) => Promise<void>;
  currentUsername?: string | null;
  currentDisplayName?: string | null;
  currentAvatarUrl?: string | null;
  saving?: boolean;
  error?: string | null;
};

export function EditProfileModal({
  isOpen,
  onClose,
  onSave,
  currentUsername,
  currentDisplayName,
  currentAvatarUrl,
  saving = false,
  error,
}: Props) {
  const [username, setUsername] = useState(currentUsername ?? '');
  const [displayName, setDisplayName] = useState(currentDisplayName ?? '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(currentAvatarUrl ?? null);
  const [avatarAsset, setAvatarAsset] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setUsername(currentUsername ?? '');
    setDisplayName(currentDisplayName ?? '');
    setAvatarPreview(currentAvatarUrl ?? null);
    setAvatarAsset(null);
    setRemoveAvatar(false);
    setLocalError(null);
  }, [currentAvatarUrl, currentDisplayName, currentUsername, isOpen]);

  const mergedError = useMemo(() => error ?? localError, [error, localError]);

  const handlePickImage = async () => {
    setLocalError(null);
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setLocalError('Photo access permission is required to upload an avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });

    if (result.canceled || !result.assets?.[0]) return;

    const picked = result.assets[0];
    if (picked.mimeType && !picked.mimeType.startsWith('image/')) {
      setLocalError('Please choose a valid image file.');
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if ((picked.fileSize ?? 0) > maxSize) {
      setLocalError('Image file is too large. Maximum size is 5MB.');
      return;
    }

    setAvatarAsset(picked);
    setAvatarPreview(picked.uri);
    setRemoveAvatar(false);
  };

  const handleRemoveAvatar = () => {
    setAvatarAsset(null);
    setAvatarPreview(null);
    setRemoveAvatar(true);
  };

  const handleSave = async () => {
    const normalizedUsername = username.trim();
    if (!normalizedUsername) {
      setLocalError('Username is required.');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_-]{3,20}$/;
    if (!usernameRegex.test(normalizedUsername)) {
      setLocalError('Username must be 3-20 characters and only letters, numbers, underscores, or hyphens.');
      return;
    }

    setLocalError(null);
    await onSave({
      username: normalizedUsername,
      displayName: displayName.trim(),
      avatarAsset,
      removeAvatar,
    });
  };

  return (
    <Modal transparent visible={isOpen} animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={() => !saving && onClose()} />

        <LinearGradient
          colors={['#9DAB9B', '#9DAB9B', 'rgba(157,171,155,0.95)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.headerRow}>
            <Text style={styles.title}>Edit Profile</Text>
            <Pressable onPress={() => !saving && onClose()} style={styles.closeButton} disabled={saving}>
              <Ionicons name="close" size={18} color="rgba(45,45,45,0.75)" />
            </Pressable>
          </View>

          {mergedError ? <Text style={styles.error}>{mergedError}</Text> : null}

          <View style={styles.avatarRow}>
            {avatarPreview ? (
              <Image source={{ uri: avatarPreview }} style={styles.avatar} contentFit="cover" />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Ionicons name="person" size={28} color="rgba(45,45,45,0.55)" />
              </View>
            )}

            <View style={styles.avatarActions}>
              <Pressable onPress={handlePickImage} style={styles.avatarActionButton} disabled={saving}>
                <Ionicons name="cloud-upload-outline" size={14} color="#2D2D2D" />
                <Text style={styles.avatarActionText}>Upload</Text>
              </Pressable>
              {avatarPreview ? (
                <Pressable onPress={handleRemoveAvatar} style={styles.avatarActionButton} disabled={saving}>
                  <Ionicons name="trash-outline" size={14} color="#7F1D1D" />
                  <Text style={[styles.avatarActionText, { color: '#7F1D1D' }]}>Remove</Text>
                </Pressable>
              ) : null}
            </View>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Username</Text>
            <TextInput
              value={username}
              onChangeText={(value) => {
                setUsername(value);
                setLocalError(null);
              }}
              autoCapitalize="none"
              autoCorrect={false}
              style={styles.input}
              placeholder="Choose a username"
              placeholderTextColor="rgba(45,45,45,0.45)"
            />
            <Text style={styles.helper}>3-20 characters, letters/numbers/underscore/hyphen.</Text>
          </View>

          <View style={styles.fieldWrap}>
            <Text style={styles.fieldLabel}>Display Name</Text>
            <TextInput
              value={displayName}
              onChangeText={setDisplayName}
              style={styles.input}
              placeholder="How your name appears"
              placeholderTextColor="rgba(45,45,45,0.45)"
            />
          </View>

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={styles.secondaryButton} disabled={saving}>
              <Text style={styles.secondaryButtonText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={handleSave} style={styles.primaryButton} disabled={saving}>
              <Text style={styles.primaryButtonText}>{saving ? 'Saving...' : 'Save Changes'}</Text>
            </Pressable>
          </View>
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(17,24,39,0.35)',
  },
  card: {
    borderRadius: 16,
    padding: 18,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.65)',
  },
  error: {
    fontSize: 12,
    color: '#7F1D1D',
    marginBottom: 8,
  },
  avatarRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 14,
  },
  avatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,224,229,0.7)',
  },
  avatarActions: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
    flex: 1,
  },
  avatarActionButton: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(45,45,45,0.18)',
    backgroundColor: 'rgba(255,255,255,0.72)',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  avatarActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  fieldWrap: {
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(45,45,45,0.9)',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(45,45,45,0.22)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#2D2D2D',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  helper: {
    marginTop: 4,
    fontSize: 11,
    color: 'rgba(45,45,45,0.65)',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  secondaryButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(45,45,45,0.2)',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.72)',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  primaryButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#722F37',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
