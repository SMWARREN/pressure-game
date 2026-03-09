import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import GameBoard from './GameBoard.native';
import SettingsScreen from './SettingsScreen.native';
import LevelSelector from './LevelSelector.native';
import AppFooter from './AppFooter.native';
import type { Level } from '@/game/types';
import { useGameStore } from '@/game/store';

/**
 * Main app screen with header/footer navigation
 */
export default function MainScreen() {
  const [showSettings, setShowSettings] = useState(false);
  const [showLevelSelector, setShowLevelSelector] = useState(false);
  const { currentLevel, loadLevel, goToMenu } = useGameStore((state) => ({
    currentLevel: state.currentLevel,
    loadLevel: state.loadLevel,
    goToMenu: state.goToMenu,
  }));

  const handleLevelSelect = (level: Level) => {
    loadLevel(level);
    setShowLevelSelector(false);
  };

  const handleMenuPress = () => {
    goToMenu();
    setShowLevelSelector(true);
  };

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <View style={styles.content}>
        {currentLevel ? <GameBoard /> : <LevelSelector onLevelSelect={handleLevelSelect} />}
      </View>

      {/* Footer Navigation */}
      <AppFooter
        onSettingsPress={() => setShowSettings(true)}
        onLevelSelectorPress={() => setShowLevelSelector(!showLevelSelector)}
      />

      {/* Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowSettings(false)}
      >
        <SettingsScreen />
        <View style={styles.modalCloseButton}>
          {/* Modal will have back button in header */}
        </View>
      </Modal>

      {/* Level Selector Modal */}
      <Modal
        visible={showLevelSelector && !!currentLevel}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setShowLevelSelector(false)}
      >
        <LevelSelector onLevelSelect={handleLevelSelect} />
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
