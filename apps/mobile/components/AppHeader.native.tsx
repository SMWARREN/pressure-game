import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

interface AppHeaderProps {
  title?: string;
  subtitle?: string;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  leftIcon?: string;
  rightIcon?: string;
  showLeft?: boolean;
  showRight?: boolean;
}

export default function AppHeader({
  title = 'PRESSURE',
  subtitle,
  onLeftPress,
  onRightPress,
  leftIcon = '←',
  rightIcon = '↺',
  showLeft = true,
  showRight = false,
}: AppHeaderProps) {
  return (
    <View style={styles.header}>
      {showLeft ? (
        <Pressable
          onPress={onLeftPress}
          style={styles.iconButton}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.iconText}>{leftIcon}</Text>
        </Pressable>
      ) : (
        <View style={styles.iconPlaceholder} />
      )}

      <View style={styles.titleContainer}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.rightButtons}>
        {showRight ? (
          <Pressable
            onPress={onRightPress}
            style={styles.iconButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.iconText}>{rightIcon}</Text>
          </Pressable>
        ) : (
          <View style={styles.iconPlaceholder} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    zIndex: 2,
    position: 'relative',
    borderBottomWidth: 1,
    borderBottomColor: '#12122a',
    backgroundColor: 'rgba(6, 6, 15, 0.85)',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    gap: 8,
    marginBottom: 12,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#12122a',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconPlaceholder: {
    width: 44,
    height: 44,
    flexShrink: 0,
  },
  iconText: {
    fontSize: 16,
    color: '#3a3a55',
    fontWeight: '600',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 0,
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.5,
    color: '#fff',
  },
  subtitle: {
    fontSize: 10,
    color: '#888',
    letterSpacing: 1.5,
    marginTop: 2,
  },
  rightButtons: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
