import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { useShallow } from 'zustand/react/shallow';
import GameBoard from './GameBoard.native';
import SettingsScreen from './SettingsScreen.native';
import LevelSelector from './LevelSelector.native';
import AppFooter from './AppFooter.native';
import type { Level } from '@/game/types';
import { useGameStore } from '@/game/store';
import { getModeById } from '@/game/modes';
import { PRESSURE_LOGO_LEVEL } from '@/game/modes/classic/levels';

const PRESSURE_SERIES = new Set(['classic', 'blitz', 'zen']);
function getLogoPuzzleName(modeId: string): string {
  return PRESSURE_SERIES.has(modeId) ? 'PRESSURE' : getModeById(modeId).name.toUpperCase();
}

/**
 * Main app screen with header/footer navigation
 */
export default function MainScreen() {
  const [showSettings, setShowSettings] = useState(false);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const { currentLevel, currentModeId, loadLevel } = useGameStore(
    useShallow((state) => ({
      currentLevel: state.currentLevel,
      currentModeId: state.currentModeId,
      loadLevel: state.loadLevel,
    }))
  );
  const isPlaying = !!currentLevel;

  const handleLevelSelect = (level: Level) => {
    loadLevel(level);
    setShowLevelSelector(false);
  };

  const handleLogoPuzzle = () => {
    const name = getLogoPuzzleName(currentModeId);
    loadLevel({ ...PRESSURE_LOGO_LEVEL, name });
    setShowSettings(false);
  };

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <View style={styles.content}>
        {currentLevel ? <GameBoard /> : <LevelSelector onLevelSelect={handleLevelSelect} />}
      </View>

      {/* Footer Navigation — hidden during gameplay */}
      {!isPlaying && (
        <AppFooter
          onSettingsPress={() => setShowSettings(true)}
          onThemePress={() => undefined}
        />
      )}

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowSettings(false)}
      >
        <SettingsScreen onClose={() => setShowSettings(false)} onLogoPuzzle={handleLogoPuzzle} />
      </Modal>

      {/* Level Selector Modal */}
      <Modal
        visible={showLevelSelector && !!currentLevel}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowLevelSelector(false)}
      >
        <LevelSelector
          onLevelSelect={handleLevelSelect}
          onClose={() => setShowLevelSelector(false)}
        />
      </Modal>
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
  modalCloseButton: {
    height: 20,
  },
});
