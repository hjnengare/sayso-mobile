import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { EventSpecialDetail } from '../../hooks/useEventSpecialDetail';
import { Text } from '../Typography';
import { businessDetailColors, businessDetailSpacing } from '../business-detail/styles';

type Props = {
  item: EventSpecialDetail;
};

function normalizeWebsite(url?: string | null) {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

export function EventSpecialContactInfoCard({ item }: Props) {
  const website = normalizeWebsite(item.bookingUrl ?? undefined);
  const phone = item.bookingContact?.trim() || undefined;

  const rows = [
    phone
      ? {
          key: 'phone',
          label: phone,
          icon: 'call',
          onPress: () => Linking.openURL(`tel:${phone}`),
        }
      : null,
    website
      ? {
          key: 'website',
          label: 'Visit booking page',
          icon: 'globe',
          onPress: () => Linking.openURL(website),
        }
      : null,
    item.location
      ? {
          key: 'location',
          label: item.location,
          icon: 'location',
        }
      : null,
  ].filter(Boolean) as Array<{ key: string; label: string; icon: keyof typeof Ionicons.glyphMap; onPress?: () => void }>;

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Contact Information</Text>

      {rows.length === 0 ? (
        <Text style={styles.fallback}>Contact details are not available for this listing yet.</Text>
      ) : (
        rows.map((row) => {
          const Container = row.onPress ? Pressable : View;
          return (
            <Container key={row.key} style={styles.row} onPress={row.onPress}>
              <View style={styles.iconWrap}>
                <Ionicons name={row.icon} size={15} color={businessDetailColors.charcoal} />
              </View>
              <Text style={styles.rowText}>{row.label}</Text>
            </Container>
          );
        })
      )}
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
    minHeight: 36,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,224,229,0.74)',
  },
  rowText: {
    flex: 1,
    color: businessDetailColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
  fallback: {
    color: businessDetailColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
  },
});
