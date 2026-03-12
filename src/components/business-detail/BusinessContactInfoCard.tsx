import { Linking, Pressable, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Typography';
import { businessDetailColors, businessDetailSpacing, CARD_GRADIENT, cardShadowStyle } from './styles';
import { normalizeWebsite } from './utils';

type Props = {
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  location?: string | null;
};

export function BusinessContactInfoCard({ phone, email, website, address, location }: Props) {
  const displayPhone = phone?.trim() || null;
  const websiteHref = normalizeWebsite(website);
  const addressText = address || location || null;

  return (
    <LinearGradient colors={CARD_GRADIENT} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconPill}>
          <Ionicons name="call" size={15} color={businessDetailColors.charcoal} />
        </View>
        {displayPhone ? <Text style={styles.valueText}>{displayPhone}</Text> : <Text style={styles.valueFallback}>Phone number coming soon</Text>}
      </View>

      <View style={styles.row}>
        <View style={styles.iconPill}>
          <Ionicons name="mail" size={15} color={businessDetailColors.charcoal} />
        </View>
        {email ? (
          <Pressable onPress={() => Linking.openURL(`mailto:${email}`)}>
            <Text style={styles.valueText}>{email}</Text>
          </Pressable>
        ) : (
          <Text style={styles.valueFallback}>Email coming soon</Text>
        )}
      </View>

      <View style={styles.row}>
        <View style={styles.iconPill}>
          <Ionicons name="globe" size={15} color={businessDetailColors.charcoal} />
        </View>
        {websiteHref ? (
          <Pressable onPress={() => Linking.openURL(websiteHref)}>
            <Text style={styles.valueText}>Visit website</Text>
          </Pressable>
        ) : (
          <Text style={styles.valueFallback}>Website coming soon</Text>
        )}
      </View>

      <View style={styles.row}>
        <View style={styles.iconPill}>
          <Ionicons name="location" size={15} color={businessDetailColors.charcoal} />
        </View>
        {addressText ? <Text style={styles.valueText}>{addressText}</Text> : <Text style={styles.valueFallback}>Address coming soon</Text>}
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: businessDetailSpacing.cardRadius,
    padding: businessDetailSpacing.cardPadding,
    gap: 12,
    ...cardShadowStyle,
  } as object,
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconPill: {
    width: 32,
    height: 32,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,224,229,0.75)',
  },
  valueText: {
    color: businessDetailColors.charcoal,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  valueFallback: {
    color: businessDetailColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    flex: 1,
  },
});
