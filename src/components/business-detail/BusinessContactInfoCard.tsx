import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Typography';
import { businessDetailColors, businessDetailSpacing } from './styles';
import { normalizeWebsite } from './utils';

type Props = {
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  location?: string | null;
};

export function BusinessContactInfoCard({ phone, email, website, address, location }: Props) {
  const [isPhoneVisible, setIsPhoneVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const displayPhone = phone?.trim() || null;
  const websiteHref = normalizeWebsite(website);
  const addressText = address || location || null;

  const handleCopyPhone = async () => {
    if (!displayPhone) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(displayPhone);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      }
      Alert.alert('Copy unavailable', 'Clipboard support is not available on this device.');
    } catch {
      Alert.alert('Copy failed', 'Could not copy the contact number.');
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Contact Information</Text>

      <View style={styles.row}>
        <View style={styles.iconPill}>
          <Ionicons name="call-outline" size={14} color={businessDetailColors.charcoal} />
        </View>
        {displayPhone ? (
          isPhoneVisible ? (
            <View style={styles.phoneWrap}>
              <Pressable onPress={() => Linking.openURL(`tel:${displayPhone}`)}>
                <Text style={styles.linkText}>{displayPhone}</Text>
              </Pressable>
              <Pressable style={styles.copyButton} onPress={handleCopyPhone}>
                <Ionicons name={copied ? 'checkmark' : 'copy-outline'} size={13} color={businessDetailColors.charcoal} />
              </Pressable>
            </View>
          ) : (
            <Pressable style={styles.showButton} onPress={() => setIsPhoneVisible(true)}>
              <Text style={styles.showButtonText}>Show Contact Number</Text>
            </Pressable>
          )
        ) : (
          <Text style={styles.valueFallback}>Phone number coming soon</Text>
        )}
      </View>

      <View style={styles.row}>
        <View style={styles.iconPill}>
          <Ionicons name="mail-outline" size={14} color={businessDetailColors.charcoal} />
        </View>
        {email ? (
          <Pressable onPress={() => Linking.openURL(`mailto:${email}`)}>
            <Text style={styles.linkText}>{email}</Text>
          </Pressable>
        ) : (
          <Text style={styles.valueFallback}>Email coming soon</Text>
        )}
      </View>

      <View style={styles.row}>
        <View style={styles.iconPill}>
          <Ionicons name="globe-outline" size={14} color={businessDetailColors.charcoal} />
        </View>
        {websiteHref ? (
          <Pressable style={styles.showButton} onPress={() => Linking.openURL(websiteHref)}>
            <Text style={styles.showButtonText}>View Website</Text>
          </Pressable>
        ) : (
          <Text style={styles.valueFallback}>Website coming soon</Text>
        )}
      </View>

      <View style={styles.row}>
        <View style={styles.iconPill}>
          <Ionicons name="location-outline" size={14} color={businessDetailColors.charcoal} />
        </View>
        {addressText ? <Text style={styles.valueText}>{addressText}</Text> : <Text style={styles.valueFallback}>Address coming soon</Text>}
      </View>
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconPill: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,224,229,0.75)',
  },
  phoneWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    flex: 1,
  },
  showButton: {
    borderRadius: 999,
    backgroundColor: businessDetailColors.coral,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  showButtonText: {
    color: businessDetailColors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  copyButton: {
    width: 28,
    height: 28,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,224,229,0.72)',
  },
  linkText: {
    color: businessDetailColors.charcoal,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  valueText: {
    color: businessDetailColors.textMuted,
    fontSize: 13,
    flex: 1,
  },
  valueFallback: {
    color: businessDetailColors.textMuted,
    fontSize: 13,
    fontStyle: 'italic',
  },
});
