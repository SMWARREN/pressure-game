import React from 'react';
import { Platform, Text, StyleSheet } from 'react-native';

interface PressureLogoProps {
  size?: number;
}

/**
 * Shared PressureLogo component for web and mobile
 * Uses CSS gradient on web, fallback color on mobile
 */
export default function PressureLogo({ size = 22 }: PressureLogoProps) {
  if (Platform.OS === 'web') {
    return (
      <Text
        style={[
          styles.web,
          {
            fontSize: size,
            background: 'linear-gradient(135deg, rgb(196, 181, 253) 0%, rgb(129, 140, 248) 40%, rgb(99, 102, 241) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          } as any,
        ]}
      >
        PRESSURE
      </Text>
    );
  }

  // Mobile fallback: use gradient-inspired indigo color
  return (
    <Text style={[styles.mobile, { fontSize: size }]}>
      PRESSURE
    </Text>
  );
}

const styles = StyleSheet.create({
  web: {
    fontWeight: '900',
    letterSpacing: -0.8,
  } as any,
  mobile: {
    fontWeight: '900',
    letterSpacing: -0.8,
    color: '#6366f1',
  },
});
