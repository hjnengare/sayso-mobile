import { useEffect, useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Typography';

type Props = {
  isOpen: boolean;
  title: string;
  message: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
  error?: string | null;
  requireConfirmText?: string;
  variant?: 'danger' | 'default';
};

export function ConfirmationDialog({
  isOpen,
  title,
  message,
  onClose,
  onConfirm,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isLoading = false,
  error = null,
  requireConfirmText,
  variant = 'default',
}: Props) {
  const [confirmValue, setConfirmValue] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setConfirmValue('');
    }
  }, [isOpen]);

  const confirmEnabled = useMemo(() => {
    if (isLoading) return false;
    if (!requireConfirmText) return true;
    return confirmValue.trim() === requireConfirmText;
  }, [confirmValue, isLoading, requireConfirmText]);

  const accent = variant === 'danger' ? '#722F37' : '#2563EB';

  return (
    <Modal transparent animationType="fade" visible={isOpen} onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />
        <View style={styles.card}>
          <View style={styles.titleRow}>
            <Ionicons
              name={variant === 'danger' ? 'warning-outline' : 'help-circle-outline'}
              size={20}
              color={accent}
            />
            <Text style={styles.title}>{title}</Text>
          </View>

          <Text style={styles.message}>{message}</Text>

          {requireConfirmText ? (
            <View style={styles.confirmFieldWrap}>
              <Text style={styles.confirmHint}>Type {requireConfirmText} to continue</Text>
              <TextInput
                value={confirmValue}
                onChangeText={setConfirmValue}
                autoCapitalize="characters"
                style={styles.confirmInput}
                placeholder={requireConfirmText}
                placeholderTextColor="rgba(45,45,45,0.45)"
              />
            </View>
          ) : null}

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <View style={styles.actions}>
            <Pressable style={styles.cancelButton} onPress={onClose} disabled={isLoading}>
              <Text style={styles.cancelText}>{cancelText}</Text>
            </Pressable>
            <Pressable
              style={[
                styles.confirmButton,
                { backgroundColor: accent },
                !confirmEnabled && styles.confirmButtonDisabled,
              ]}
              onPress={onConfirm}
              disabled={!confirmEnabled}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.4)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(45,45,45,0.08)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2D2D2D',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(45,45,45,0.78)',
  },
  confirmFieldWrap: {
    marginTop: 14,
    gap: 6,
  },
  confirmHint: {
    fontSize: 12,
    color: 'rgba(45,45,45,0.7)',
  },
  confirmInput: {
    borderWidth: 1,
    borderColor: 'rgba(45,45,45,0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#2D2D2D',
    fontSize: 14,
    fontFamily: 'Urbanist_500Medium',
  },
  error: {
    marginTop: 10,
    fontSize: 12,
    color: '#B91C1C',
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(45,45,45,0.18)',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelText: {
    color: '#2D2D2D',
    fontSize: 14,
    fontWeight: '600',
  },
  confirmButton: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonDisabled: {
    opacity: 0.45,
  },
  confirmText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
