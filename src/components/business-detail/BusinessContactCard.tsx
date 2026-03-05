import { useMemo, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text, TextInput } from '../Typography';
import { businessDetailColors, businessDetailSpacing } from './styles';
import { normalizePhoneDigits } from './utils';
import { apiFetch } from '../../lib/api';

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

type Props = {
  businessId: string;
  businessName: string;
  phone?: string | null;
};

const DEFAULT_MESSAGE = "I'm interested in this business, please contact me.";

export function BusinessContactCard({ businessId, businessName, phone }: Props) {
  const [showPhone, setShowPhone] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  const contactPhone = phone?.trim() || null;
  const whatsappNumber = useMemo(() => normalizePhoneDigits(contactPhone), [contactPhone]);
  const isFormEnabled = Boolean(contactPhone);
  const whatsappHref = whatsappNumber
    ? `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(`Hi, I'm interested in ${businessName}. Please contact me.`)}`
    : null;

  const validateName = (value: string) => value.trim().length >= 2;
  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
  const validateMobile = (value: string) => (value.replace(/[^\d]/g, '').length >= 7);
  const validateMessage = (value: string) => value.trim().length >= 10 && value.trim().length <= 500;

  const hasErrors = !validateName(name) || !validateEmail(email) || !validateMobile(mobile) || !validateMessage(message);

  const handleCopyPhone = async () => {
    if (!contactPhone) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(contactPhone);
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
        return;
      }
      Alert.alert('Copy unavailable', 'Clipboard support is not available on this device.');
    } catch {
      Alert.alert('Copy failed', 'Could not copy the contact number.');
    }
  };

  const handleSubmit = async () => {
    if (!isFormEnabled) {
      setSubmitState('error');
      setSubmitMessage('Inquiry form is unavailable for this business.');
      return;
    }

    if (hasErrors) {
      setSubmitState('error');
      setSubmitMessage('Please provide valid contact details and a short message.');
      return;
    }

    setSubmitState('loading');
    setSubmitMessage(null);

    const composedMessage = [
      'Business Inquiry',
      `Business: ${businessName}`,
      `Business ID: ${businessId}`,
      `Mobile: ${mobile.trim()}`,
      '',
      message.trim(),
    ].join('\n');

    try {
      await apiFetch('/api/contact', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          reason: 'business',
          message: composedMessage,
        }),
      });

      setSubmitState('success');
      setSubmitMessage("Inquiry sent successfully. We'll get back to you soon.");
      setName('');
      setEmail('');
      setMobile('');
      setMessage(DEFAULT_MESSAGE);
    } catch {
      setSubmitState('error');
      setSubmitMessage('Unable to submit your inquiry right now. Please try again later.');
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Contact</Text>

      <View style={styles.actionStack}>
        <Pressable
          style={[styles.contactNumberButton, !contactPhone ? styles.buttonDisabled : null]}
          disabled={!contactPhone}
          onPress={() => setShowPhone(true)}
        >
          <Text style={styles.contactNumberButtonText}>Show Contact Number</Text>
        </Pressable>

        {showPhone && contactPhone ? (
          <View style={styles.phoneRow}>
            <Pressable onPress={() => Linking.openURL(`tel:${contactPhone}`)} style={{ flex: 1 }}>
              <Text style={styles.phoneValue}>{contactPhone}</Text>
            </Pressable>
            <Pressable style={styles.copyButton} onPress={handleCopyPhone}>
              <Ionicons name={copiedPhone ? 'checkmark' : 'copy-outline'} size={14} color={businessDetailColors.charcoal} />
            </Pressable>
          </View>
        ) : null}

        {!contactPhone ? <Text style={styles.hintText}>Contact number unavailable for this business.</Text> : null}

        {whatsappHref ? (
          <Pressable style={styles.whatsappButton} onPress={() => Linking.openURL(whatsappHref)}>
            <Text style={styles.whatsappButtonText}>WhatsApp</Text>
          </Pressable>
        ) : (
          <>
            <View style={[styles.whatsappButton, styles.buttonDisabled]}>
              <Text style={styles.whatsappButtonText}>WhatsApp</Text>
            </View>
            <Text style={styles.hintText}>WhatsApp is unavailable for this business.</Text>
          </>
        )}
      </View>

      <View style={styles.form}>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Name"
          editable={isFormEnabled}
          style={styles.input}
          placeholderTextColor="rgba(45,55,72,0.45)"
        />
        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          editable={isFormEnabled}
          keyboardType="email-address"
          autoCapitalize="none"
          style={styles.input}
          placeholderTextColor="rgba(45,55,72,0.45)"
        />
        <TextInput
          value={mobile}
          onChangeText={setMobile}
          placeholder="Mobile"
          editable={isFormEnabled}
          keyboardType="phone-pad"
          style={styles.input}
          placeholderTextColor="rgba(45,55,72,0.45)"
        />
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Message"
          editable={isFormEnabled}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
          maxLength={500}
          style={styles.messageInput}
          placeholderTextColor="rgba(45,55,72,0.45)"
        />

        <Pressable
          style={[styles.submitButton, (!isFormEnabled || submitState === 'loading') ? styles.buttonDisabled : null]}
          disabled={!isFormEnabled || submitState === 'loading'}
          onPress={handleSubmit}
        >
          <Text style={styles.submitButtonText}>{submitState === 'loading' ? 'Sending...' : 'Submit'}</Text>
        </Pressable>

        {submitMessage ? (
          <Text style={[styles.submitMessage, submitState === 'success' ? styles.submitSuccess : styles.submitError]}>
            {submitMessage}
          </Text>
        ) : null}
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
  actionStack: {
    gap: 8,
  },
  contactNumberButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.36)',
    backgroundColor: 'rgba(229,224,229,0.8)',
    paddingVertical: 10,
    alignItems: 'center',
  },
  contactNumberButtonText: {
    color: businessDetailColors.charcoal,
    fontSize: 13,
    fontWeight: '700',
  },
  phoneRow: {
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.34)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  phoneValue: {
    color: businessDetailColors.charcoal,
    fontSize: 13,
    fontWeight: '600',
  },
  copyButton: {
    width: 30,
    height: 30,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(229,224,229,0.72)',
  },
  whatsappButton: {
    borderRadius: 999,
    backgroundColor: businessDetailColors.coral,
    paddingVertical: 10,
    alignItems: 'center',
  },
  whatsappButtonText: {
    color: businessDetailColors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  hintText: {
    color: businessDetailColors.textSubtle,
    fontSize: 12,
    fontStyle: 'italic',
  },
  form: {
    gap: 8,
  },
  input: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 13,
    paddingVertical: 10,
    fontSize: 13,
    color: businessDetailColors.charcoal,
  },
  messageInput: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.32)',
    backgroundColor: 'rgba(255,255,255,0.7)',
    paddingHorizontal: 13,
    paddingVertical: 10,
    minHeight: 92,
    fontSize: 13,
    color: businessDetailColors.charcoal,
  },
  submitButton: {
    borderRadius: 999,
    backgroundColor: businessDetailColors.coral,
    paddingVertical: 11,
    alignItems: 'center',
    marginTop: 2,
  },
  submitButtonText: {
    color: businessDetailColors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  submitMessage: {
    fontSize: 12,
    lineHeight: 17,
  },
  submitSuccess: {
    color: '#166534',
  },
  submitError: {
    color: '#B91C1C',
  },
});
