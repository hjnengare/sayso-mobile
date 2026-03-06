import { Alert, Linking, Pressable, Share, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { EventSpecialDetail } from '../../hooks/useEventSpecialDetail';
import type { EventReminderOption } from '../../hooks/useEventReminder';
import { apiFetch } from '../../lib/api';
import { ENV } from '../../lib/env';
import { buildGoogleCalendarUrl } from '../../lib/events/calendar';
import { resolveCtaTarget } from '../../lib/events/cta';
import { routes } from '../../navigation/routes';
import { Text } from '../Typography';
import { businessDetailColors, businessDetailSpacing } from '../business-detail/styles';

type Props = {
  item: EventSpecialDetail;
  routeType: 'event' | 'special';
  isGoing: boolean;
  rsvpCount: number;
  rsvpBusy?: boolean;
  reminderBusy?: boolean;
  hasReminder1Day: boolean;
  hasReminder2Hours: boolean;
  onPressGoing: () => void;
  onPressReminder: (option: EventReminderOption) => void;
  onPressWriteReview: () => void;
};

function getRoutePath(type: 'event' | 'special', id: string) {
  return type === 'special' ? routes.specialDetail(id) : routes.eventDetail(id);
}

export function EventSpecialActionCard({
  item,
  routeType,
  isGoing,
  rsvpCount,
  rsvpBusy = false,
  reminderBusy = false,
  hasReminder1Day,
  hasReminder2Hours,
  onPressGoing,
  onPressReminder,
  onPressWriteReview,
}: Props) {
  const hasAnyReminder = hasReminder1Day || hasReminder2Hours;

  const handlePrimaryCta = async () => {
    const origin = ENV.apiBaseUrl || 'https://www.sayso.co.za';
    const publicUrl = `${origin}${getRoutePath(routeType, item.id)}`;

    const resolved = resolveCtaTarget({
      item,
      currentUrl: publicUrl,
      ctaSource: item.ctaSource ?? null,
      bookingUrl: item.bookingUrl ?? null,
      whatsappNumber: item.whatsappNumber ?? null,
      whatsappPrefillTemplate: item.whatsappPrefillTemplate ?? null,
    });

    const targetUrl = resolved.url ?? item.bookingUrl ?? null;
    if (!targetUrl) {
      Alert.alert('Link unavailable', 'Booking or claim link is not available yet.');
      return;
    }

    try {
      await Linking.openURL(targetUrl);
      void apiFetch(`/api/events-and-specials/${item.id}/cta-click`, {
        method: 'POST',
        body: JSON.stringify({
          ctaKind: resolved.ctaKind,
          ctaSource: resolved.ctaSource,
          targetUrl,
        }),
      }).catch(() => undefined);
    } catch {
      Alert.alert('Unable to open link', 'Please try again.');
    }
  };

  const handleShare = async () => {
    const origin = ENV.apiBaseUrl || 'https://www.sayso.co.za';
    const targetPath = getRoutePath(routeType, item.id);

    try {
      await Share.share({
        title: item.title,
        message: `Check out ${item.title} on Sayso\n${origin}${targetPath}`,
      });
    } catch {
      // Non-blocking.
    }
  };

  const handleCalendar = async () => {
    const calendarUrl = buildGoogleCalendarUrl(item);
    try {
      await Linking.openURL(calendarUrl);
    } catch {
      Alert.alert('Unable to open calendar', 'Please try again.');
    }
  };

  const handleReminderChoice = () => {
    Alert.alert('Set reminder', 'When should we remind you?', [
      {
        text: '1 day before',
        onPress: () => onPressReminder('1_day'),
      },
      {
        text: '2 hours before',
        onPress: () => onPressReminder('2_hours'),
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  const ctaLabel = item.type === 'special' ? 'Claim This Special' : 'Reserve Your Spot';

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>{item.type === 'special' ? 'Claim This Special' : 'Join This Event'}</Text>

      <Pressable style={styles.primaryButton} onPress={handlePrimaryCta}>
        <Text style={styles.primaryButtonText}>{ctaLabel}</Text>
      </Pressable>

      <View style={styles.actionsGrid}>
        <Pressable style={[styles.quickAction, isGoing ? styles.quickActionActive : null]} onPress={onPressGoing}>
          <Ionicons name="people" size={17} color={businessDetailColors.charcoal} />
          <Text style={styles.quickActionText}>Going</Text>
          {rsvpBusy ? <Text style={styles.busyLabel}>...</Text> : null}
        </Pressable>

        <Pressable style={[styles.quickAction, hasAnyReminder ? styles.quickActionReminder : null]} onPress={handleReminderChoice}>
          <Ionicons name="notifications" size={17} color={businessDetailColors.charcoal} />
          <Text style={styles.quickActionText}>Remind</Text>
          {reminderBusy ? <Text style={styles.busyLabel}>...</Text> : null}
        </Pressable>

        <Pressable style={styles.quickAction} onPress={handleCalendar}>
          <Ionicons name="calendar" size={17} color={businessDetailColors.charcoal} />
          <Text style={styles.quickActionText}>Calendar</Text>
        </Pressable>

        <Pressable style={styles.quickAction} onPress={handleShare}>
          <Ionicons name="share-social" size={17} color={businessDetailColors.charcoal} />
          <Text style={styles.quickActionText}>Share</Text>
        </Pressable>
      </View>

      <Pressable style={styles.reviewButton} onPress={onPressWriteReview}>
        <Text style={styles.reviewButtonText}>Write Review</Text>
      </Pressable>
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
  primaryButton: {
    borderRadius: 999,
    backgroundColor: businessDetailColors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: businessDetailColors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAction: {
    width: '48%',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    backgroundColor: 'rgba(229,224,229,0.8)',
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  quickActionActive: {
    borderColor: 'rgba(114,47,55,0.4)',
    backgroundColor: 'rgba(114,47,55,0.12)',
  },
  quickActionReminder: {
    borderColor: 'rgba(217,119,6,0.45)',
    backgroundColor: 'rgba(217,119,6,0.13)',
  },
  quickActionText: {
    color: businessDetailColors.charcoal,
    fontSize: 12,
    fontWeight: '700',
  },
  busyLabel: {
    position: 'absolute',
    right: 9,
    top: 8,
    color: businessDetailColors.textSubtle,
    fontSize: 11,
    fontWeight: '700',
  },
  reviewButton: {
    borderRadius: 999,
    backgroundColor: businessDetailColors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  reviewButtonText: {
    color: businessDetailColors.white,
    fontSize: 14,
    fontWeight: '700',
  },
});
