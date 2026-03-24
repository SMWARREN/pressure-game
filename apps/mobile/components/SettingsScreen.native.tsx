import React, { useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, Switch } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/game/store';
import AppHeader from './AppHeader.native';

interface SettingsScreenProps {
  onClose?: () => void;
  onLogoPuzzle?: () => void;
}

export default function SettingsScreen({ onClose, onLogoPuzzle }: SettingsScreenProps) {
  const { animationsEnabled, toggleAnimations } = useGameStore(
    useShallow((state) => ({
      animationsEnabled: state.animationsEnabled,
      toggleAnimations: state.toggleAnimations,
    }))
  );

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);

  return (
    <View style={styles.container}>
      {/* Header */}
      <AppHeader
        title="Settings"
        onLeftPress={onClose}
        leftIcon="←"
        showLeft={true}
        showRight={false}
      />

      {/* Scrollable Content */}
      <ScrollView style={styles.content}>
        {/* Game Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Game</Text>
          <SettingRow
            label="Animations"
            description="Enable tile and particle animations"
            value={animationsEnabled}
            onToggle={toggleAnimations}
          />
          <SettingRow
            label="Sound"
            description="Play audio effects"
            value={soundEnabled}
            onToggle={setSoundEnabled}
          />
          <SettingRow
            label="Haptic Feedback"
            description="Vibration on tile tap"
            value={hapticFeedback}
            onToggle={setHapticFeedback}
          />
        </View>

        {/* Data Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data</Text>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Clear Progress</Text>
              <Text style={styles.settingDesc}>Reset all game data</Text>
            </View>
            <Pressable style={styles.dangerButton}>
              <Text style={styles.dangerButtonText}>Clear</Text>
            </Pressable>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          {onLogoPuzzle && (
            <Pressable
              style={styles.settingItem}
              onPress={() => {
                onClose?.();
                onLogoPuzzle();
              }}
            >
              <View style={styles.settingLeft}>
                <Text style={styles.settingLabel}>Logo Puzzle</Text>
                <Text style={styles.settingDesc}>Play the logo puzzle</Text>
              </View>
              <Text style={{ color: '#6366f1', fontSize: 18 }}>›</Text>
            </Pressable>
          )}
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Version</Text>
              <Text style={styles.settingDesc}>1.0.0</Text>
            </View>
          </View>
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Text style={styles.settingLabel}>Credits</Text>
              <Text style={styles.settingDesc}>Made with ❤️</Text>
            </View>
          </View>
        </View>

        <View style={styles.spacer} />
      </ScrollView>
    </View>
  );
}

interface SettingRowProps {
  label: string;
  description: string;
  value: boolean;
  onToggle: (value: boolean) => void;
}

function SettingRow({ label, description, value, onToggle }: SettingRowProps) {
  return (
    <View style={styles.settingItem}>
      <View style={styles.settingLeft}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: '#333', true: '#6366f1' }}
        thumbColor={value ? '#ec4899' : '#666'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#06060f',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#888',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#12122a',
  },
  settingLeft: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  settingDesc: {
    fontSize: 12,
    color: '#888',
  },
  dangerButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
  },
  dangerButtonText: {
    color: '#ef4444',
    fontWeight: '600',
    fontSize: 12,
  },
  spacer: {
    height: 20,
  },
});
