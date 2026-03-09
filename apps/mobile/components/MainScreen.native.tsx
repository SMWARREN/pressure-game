import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import GameBoard from './GameBoard.native';
import SettingsScreen from './SettingsScreen.native';
import StatsScreen from './StatsScreen.native';
import TabNavigator, { TabName } from './TabNavigator.native';

/**
 * Main screen with tab navigation
 * Switches between Game, Settings, and Stats
 */
export default function MainScreen() {
  const [activeTab, setActiveTab] = useState<TabName>('game');

  return (
    <View style={styles.container}>
      {/* Tab Content */}
      <View style={styles.content}>
        {activeTab === 'game' && <GameBoard />}
        {activeTab === 'settings' && <SettingsScreen />}
        {activeTab === 'stats' && <StatsScreen />}
      </View>

      {/* Tab Navigation Footer */}
      <TabNavigator activeTab={activeTab} onTabChange={setActiveTab} />
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
});
