import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  BackHandler,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  View,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Typography';
import { businessDetailColors } from './styles';
import { NAVBAR_BG_COLOR } from '../../styles/colors';

type Props = {
  visible: boolean;
  businessName: string;
  businessPhone?: string | null;
  businessEmail?: string | null;
  businessWebsite?: string | null;
  onClose: () => void;
  onPressReview: () => void;
};

const { height: screenHeight } = Dimensions.get('window');

export function ContactBusinessModal({
  visible,
  businessName,
  businessPhone,
  businessEmail,
  businessWebsite,
  onClose,
  onPressReview,
}: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const slideAnim = useRef(new Animated.Value(screenHeight)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (visible) {
      setModalVisible(true);
      
      // Slide up animation
      Animated.sequence([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.parallel([
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
          Animated.spring(scaleAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }),
        ]),
      ]).start();
    } else {
      // Slide down animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: screenHeight,
          duration: 250,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.9,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setModalVisible(false);
      });
    }
  }, [visible, slideAnim, backdropAnim, scaleAnim]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        onClose();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible, onClose]);

  const handleCall = () => {
    if (businessPhone) {
      Linking.openURL(`tel:${businessPhone}`);
      onClose();
    }
  };

  const handleEmail = () => {
    if (businessEmail) {
      Linking.openURL(`mailto:${businessEmail}`);
      onClose();
    }
  };

  const handleWebsite = () => {
    if (businessWebsite) {
      const url = businessWebsite.startsWith('http') ? businessWebsite : `https://${businessWebsite}`;
      Linking.openURL(url);
      onClose();
    }
  };

  const hasContactOptions = businessPhone || businessEmail || businessWebsite;

  return (
    <Modal
      transparent
      visible={modalVisible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.container}>
        <Animated.View 
          style={[
            styles.backdrop,
            {
              opacity: backdropAnim,
            },
          ]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </Animated.View>
        
        <Animated.View
          style={[
            styles.modal,
            {
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <Ionicons name="call" size={24} color={businessDetailColors.coral} />
            </View>
            <Text style={styles.title}>Get in touch</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={20} color={businessDetailColors.textMuted} />
            </Pressable>
          </View>

          <Text style={styles.subtitle}>
            Ready to connect with {businessName}?
          </Text>

          {hasContactOptions ? (
            <View style={styles.contactOptions}>
              {businessPhone && (
                <Pressable style={styles.contactOption} onPress={handleCall}>
                  <View style={styles.contactIconWrap}>
                    <Ionicons name="call" size={18} color={businessDetailColors.white} />
                  </View>
                  <View style={styles.contactContent}>
                    <Text style={styles.contactLabel}>Call now</Text>
                    <Text style={styles.contactValue}>{businessPhone}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={businessDetailColors.textMuted} />
                </Pressable>
              )}

              {businessEmail && (
                <Pressable style={styles.contactOption} onPress={handleEmail}>
                  <View style={styles.contactIconWrap}>
                    <Ionicons name="mail" size={18} color={businessDetailColors.white} />
                  </View>
                  <View style={styles.contactContent}>
                    <Text style={styles.contactLabel}>Send email</Text>
                    <Text style={styles.contactValue}>{businessEmail}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={businessDetailColors.textMuted} />
                </Pressable>
              )}

              {businessWebsite && (
                <Pressable style={styles.contactOption} onPress={handleWebsite}>
                  <View style={styles.contactIconWrap}>
                    <Ionicons name="globe" size={18} color={businessDetailColors.white} />
                  </View>
                  <View style={styles.contactContent}>
                    <Text style={styles.contactLabel}>Visit website</Text>
                    <Text style={styles.contactValue}>Open in browser</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={businessDetailColors.textMuted} />
                </Pressable>
              )}
            </View>
          ) : (
            <View style={styles.noContactInfo}>
              <Text style={styles.noContactText}>
                Contact information for {businessName} is being updated. Check back soon!
              </Text>
            </View>
          )}

          <Pressable 
            style={styles.reviewButton} 
            onPress={() => {
              onPressReview();
              onClose();
            }}
          >
            <Text style={styles.reviewButtonText}>Leave a Review</Text>
          </Pressable>

          <Pressable style={styles.dismissButton} onPress={onClose}>
            <Text style={styles.dismissText}>Not right now</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    backgroundColor: businessDetailColors.page,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: screenHeight * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(114, 47, 55, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: businessDetailColors.charcoal,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  subtitle: {
    fontSize: 15,
    color: businessDetailColors.textMuted,
    paddingHorizontal: 20,
    marginBottom: 24,
    lineHeight: 20,
  },
  contactOptions: {
    paddingHorizontal: 20,
    gap: 4,
  },
  contactOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(229, 224, 229, 0.3)',
    borderRadius: 12,
    marginBottom: 8,
  },
  contactIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: businessDetailColors.coral,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactContent: {
    flex: 1,
  },
  contactLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: businessDetailColors.charcoal,
    marginBottom: 2,
  },
  contactValue: {
    fontSize: 14,
    color: businessDetailColors.textMuted,
  },
  noContactInfo: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    alignItems: 'center',
  },
  noContactText: {
    fontSize: 15,
    color: businessDetailColors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  reviewButton: {
    marginTop: 24,
    marginHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: NAVBAR_BG_COLOR,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reviewButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: businessDetailColors.white,
  },
  dismissButton: {
    marginTop: 12,
    marginHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
  },
  dismissText: {
    fontSize: 16,
    fontWeight: '600',
    color: businessDetailColors.textMuted,
  },
});