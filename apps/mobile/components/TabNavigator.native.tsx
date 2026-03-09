import React from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type TabName = 'game' | 'settings' | 'stats';

interface TabNavigatorProps {
  activeTab: TabName;
  onTabChange: (tab: TabName) => void;
}

export default function TabNavigator({ activeTab, onTabChange }: TabNavigatorProps) {
  const insets = useSafeAreaInsets();

  const tabs: Array<{ name: TabName; label: string; icon: string }> = [
    { name: 'game', label: 'Play', icon: '🎮' },
    { name: 'settings', label: 'Settings', icon: '⚙️' },
    { name: 'stats', label: 'Stats', icon: '📊' },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(10, insets.bottom),
        },
      ]}
    >
      {tabs.map((tab) => (
        <Pressable
          key={tab.name}
          onPress={() => onTabChange(tab.name)}
          style={[
            styles.tab,
            activeTab === tab.name && styles.tabActive,
          ]}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.icon}>{tab.icon}</Text>
          <Text style={[styles.label, activeTab === tab.name && styles.labelActive]}>
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#12122a',
    backgroundColor: 'rgba(6, 6, 15, 0.85)',
    paddingTop: 8,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
  },
  tabActive: {
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    borderBottomWidth: 2,
    borderBottomColor: '#6366f1',
  },
  icon: {
    fontSize: 24,
  },
  label: {
    fontSize: 11,
    color: '#888',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  labelActive: {
    color: '#6366f1',
    fontWeight: '600',
  },
});
