import { useCallback, useMemo, useRef, useState } from 'react';
import { Dimensions, Modal, Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '../Typography';
import { businessDetailColors } from './styles';

export type BusinessHeaderMenuItem = {
  key: string;
  label: string;
  onPress: () => void;
};

type Props = {
  onPressBack: () => void;
  onPressNotifications: () => void;
  onPressMessages: () => void;
  menuItems: BusinessHeaderMenuItem[];
  collapsed?: boolean;
  showBackButton?: boolean;
};

type MenuAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const MENU_WIDTH = 222;
const MENU_EDGE_PADDING = 12;

export function BusinessPageHeader({
  onPressBack,
  onPressNotifications,
  onPressMessages,
  menuItems,
  collapsed = false,
  showBackButton = true,
}: Props) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<MenuAnchor | null>(null);
  const logoTriggerRef = useRef<View | null>(null);
  const foregroundColor = collapsed ? businessDetailColors.white : 'rgba(45,45,45,0.88)';
  const backButtonBg = collapsed ? 'rgba(255,255,255,0.14)' : '#FFFFFF';
  const backButtonBorder = collapsed ? 'rgba(255,255,255,0.24)' : '#E5E7EB';
  const actionButtonBg = collapsed ? 'rgba(255,255,255,0.14)' : '#FFFFFF';
  const actionButtonBorder = collapsed ? 'rgba(255,255,255,0.24)' : '#E5E7EB';

  const handleSelectMenuItem = (item: BusinessHeaderMenuItem) => {
    setMenuVisible(false);
    item.onPress();
  };

  const toggleMenu = useCallback(() => {
    if (menuVisible) {
      setMenuVisible(false);
      return;
    }

    const node = logoTriggerRef.current;
    if (!node || typeof node.measureInWindow !== 'function') {
      setMenuVisible(true);
      return;
    }

    node.measureInWindow((x, y, width, height) => {
      setMenuAnchor({ x, y, width, height });
      setMenuVisible(true);
    });
  }, [menuVisible]);

  const menuPositionStyle = useMemo(() => {
    if (!menuAnchor) {
      return styles.menuCardFallback;
    }

    const windowWidth = Dimensions.get('window').width;
    const centeredLeft = menuAnchor.x + menuAnchor.width / 2 - MENU_WIDTH / 2;
    const left = Math.min(
      Math.max(MENU_EDGE_PADDING, centeredLeft),
      windowWidth - MENU_WIDTH - MENU_EDGE_PADDING
    );

    return {
      left,
      top: menuAnchor.y + menuAnchor.height + 6,
    };
  }, [menuAnchor]);

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <View style={styles.leftSlot}>
          {showBackButton ? (
            <Pressable
              style={[styles.backButton, { backgroundColor: backButtonBg, borderColor: backButtonBorder }]}
              onPress={onPressBack}
              accessibilityLabel="Go back"
            >
              <Ionicons name="chevron-back" size={22} color={foregroundColor} />
            </Pressable>
          ) : (
            <View style={styles.backButtonSpacer} />
          )}
        </View>

        <View style={styles.centerSlot}>
          {menuItems.length > 0 ? (
            <Pressable
              ref={logoTriggerRef}
              style={styles.logoTrigger}
              onPress={toggleMenu}
              accessibilityLabel="Open business navigation menu"
            >
              <Text style={[styles.logoText, { color: foregroundColor }]}>Sayso</Text>
              <Ionicons
                name={menuVisible ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={foregroundColor}
              />
            </Pressable>
          ) : (
            <Text style={[styles.logoText, { color: foregroundColor }]}>Sayso</Text>
          )}
        </View>

        <View style={styles.rightSlot}>
          <Pressable
            style={[styles.iconButton, { backgroundColor: actionButtonBg, borderColor: actionButtonBorder }]}
            onPress={onPressMessages}
            accessibilityLabel="Messages"
          >
            <Ionicons name="chatbubble" size={22} color={foregroundColor} />
          </Pressable>
          <Pressable
            style={[styles.iconButton, { backgroundColor: actionButtonBg, borderColor: actionButtonBorder }]}
            onPress={onPressNotifications}
            accessibilityLabel="Notifications"
          >
            <Ionicons name="notifications" size={22} color={foregroundColor} />
          </Pressable>
        </View>
      </View>

      <Modal
        transparent
        animationType="fade"
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
      >
        <View style={styles.menuBackdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setMenuVisible(false)} />
          <View style={[styles.menuCard, menuPositionStyle]}>
            {menuItems.map((item, index) => (
              <Pressable
                key={item.key}
                style={[styles.menuItem, index !== menuItems.length - 1 ? styles.menuItemBorder : null]}
                onPress={() => handleSelectMenuItem(item)}
              >
                <Text style={styles.menuItemText}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {},
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  leftSlot: {
    width: 92,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightSlot: {
    width: 92,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
  },
  logoTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoText: {
    fontSize: 28,
    lineHeight: 32,
    fontFamily: 'MonarchParadox',
    letterSpacing: 0.2,
    textTransform: 'none',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  backButtonSpacer: {
    width: 40,
    height: 40,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(17,24,39,0.22)',
    zIndex: 9999,
  },
  menuCard: {
    position: 'absolute',
    width: 222,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.36)',
    backgroundColor: 'rgba(229,224,229,0.98)',
    zIndex: 9999,
    elevation: 20,
  },
  menuCardFallback: {
    top: 92,
    left: '50%',
    marginLeft: -(MENU_WIDTH / 2),
  },
  menuItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  menuItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(45,45,45,0.1)',
  },
  menuItemText: {
    color: businessDetailColors.charcoal,
    fontSize: 14,
    fontWeight: '700',
  },
});
