import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Image,
  Modal,
  TouchableOpacity,
  ImageSourcePropType,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useShallow } from 'zustand/react/shallow';
import { GAME_MODES } from '@/game/modes';
import { useGameStore } from '@/game/store';

const MODE_ICONS: Record<string, ImageSourcePropType> = {
  classic: require('../assets/emoji-lightning.png'),
  blitz: require('../assets/emoji-fire.png'),
  zen: require('../assets/emoji-zen.png'),
  candy: require('../assets/emoji-candy.png'),
  shoppingSpree: require('../assets/emoji-shopping.png'),
  laserRelay: require('../assets/emoji-laser.png'),
  quantumChain: require('../assets/emoji-quantum.png'),
  outbreak: require('../assets/emoji-outbreak.png'),
  memoryMatch: require('../assets/emoji-memory.png'),
  gravityDrop: require('../assets/emoji-gravity.png'),
  mirrorForge: require('../assets/emoji-mirror.png'),
  fuse: require('../assets/emoji-fuse.png'),
  gemBlast: require('../assets/emoji-gem.png'),
  voltage: require('../assets/emoji-lightning.png'),
};

interface AppFooterProps {
  onSettingsPress?: () => void;
  onThemePress?: () => void;
}

export default function AppFooter({ onSettingsPress, onThemePress }: AppFooterProps) {
  const insets = useSafeAreaInsets();
  const [showGameDropdown, setShowGameDropdown] = useState(false);

  const { currentModeId, setGameMode, theme, toggleTheme } = useGameStore(
    useShallow((state) => ({
      currentModeId: state.currentModeId,
      setGameMode: state.setGameMode,
      theme: state.theme,
      toggleTheme: state.toggleTheme,
    }))
  );

  const currentMode = GAME_MODES.find((m) => m.id === currentModeId) ?? GAME_MODES[0];
  const hasMultipleModes = GAME_MODES.length > 1;

  return (
    <>
      {/* Game mode dropdown */}
      {showGameDropdown && (
        <Modal transparent animationType="fade" onRequestClose={() => setShowGameDropdown(false)}>
          <TouchableOpacity
            style={styles.dropdownOverlay}
            activeOpacity={1}
            onPress={() => setShowGameDropdown(false)}
          >
            <View style={[styles.dropdown, { bottom: 64 + insets.bottom }]}>
              {GAME_MODES.map((mode) => {
                const isActive = mode.id === currentModeId;
                return (
                  <Pressable
                    key={mode.id}
                    style={[
                      styles.dropdownItem,
                      isActive && { backgroundColor: `${mode.color}18` },
                    ]}
                    onPress={() => {
                      setGameMode(mode.id);
                      setShowGameDropdown(false);
                    }}
                  >
                    {MODE_ICONS[mode.id] ? (
                      <Image source={MODE_ICONS[mode.id]} style={styles.dropdownIcon} />
                    ) : (
                      <View style={[styles.modeDot, { backgroundColor: mode.color }]} />
                    )}
                    <Text style={[styles.dropdownLabel, isActive && { color: mode.color }]}>
                      {mode.name}
                    </Text>
                    {isActive && <Text style={[styles.checkmark, { color: mode.color }]}>✓</Text>}
                  </Pressable>
                );
              })}
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      <View style={[styles.footer, { paddingBottom: insets.bottom }]}>
        {/* Settings */}
        <Pressable
          onPress={onSettingsPress}
          style={styles.footerButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Image source={require('../assets/emoji-settings.png')} style={styles.btnIcon} />
          <Text style={styles.buttonLabel}>Settings</Text>
        </Pressable>

        <View style={{ flex: 1 }} />

        {/* Theme */}
        <Pressable
          onPress={toggleTheme}
          style={styles.footerButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Image
            source={
              theme === 'dark'
                ? require('../assets/emoji-sun.png')
                : require('../assets/emoji-moon.png')
            }
            style={styles.btnIcon}
          />
          <Text style={styles.buttonLabel}>Theme</Text>
        </Pressable>

        {hasMultipleModes && (
          <>
            <View style={{ flex: 1 }} />

            {/* Game Selector */}
            <Pressable
              onPress={() => setShowGameDropdown((v) => !v)}
              style={[styles.footerButton, { borderColor: `${currentMode.color}55` }]}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {MODE_ICONS[currentMode.id] ? (
                <Image source={MODE_ICONS[currentMode.id]} style={styles.btnIcon} />
              ) : (
                <View style={[styles.modeDot, { backgroundColor: currentMode.color }]} />
              )}
              <Text style={[styles.buttonLabel, { color: currentMode.color }]}>
                {currentMode.name}
              </Text>
              <Text style={[styles.chevron, { color: currentMode.color }]}>
                {showGameDropdown ? '▲' : '▼'}
              </Text>
            </Pressable>
          </>
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  footer: {
    width: '100%',
    flexShrink: 0,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#12122a',
    backgroundColor: 'rgba(6, 6, 15, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#12122a',
  },
  btnIcon: {
    width: 18,
    height: 18,
  },
  buttonLabel: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  chevron: {
    fontSize: 8,
    marginLeft: 2,
  },
  modeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dropdownIcon: {
    width: 22,
    height: 22,
  },
  dropdownOverlay: {
    flex: 1,
  },
  dropdown: {
    position: 'absolute',
    right: 16,
    backgroundColor: '#0f0f1e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1a1a35',
    overflow: 'hidden',
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 20,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#12122a',
  },
  dropdownLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a0aec0',
    flex: 1,
  },
  checkmark: {
    fontSize: 14,
    fontWeight: '700',
  },
});
