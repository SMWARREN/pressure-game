import React from 'react';
import { Text, StyleSheet, Platform } from 'react-native';

interface PressureLogoProps {
  size?: number;
}

/**
 * PressureLogo component with gradient styling
 * Web: CSS gradient text
 * Mobile: Indigo color matching the gradient
 */
export default function PressureLogo({ size = 22 }: PressureLogoProps) {
  if (Platform.OS === 'web') {
    return (
      <Text
        style={[
          styles.base,
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

  // Mobile: use indigo color from gradient
  return (
    <Text style={[styles.base, styles.mobile, { fontSize: size }]}>
      PRESSURE
    </Text>
  );
}

const styles = StyleSheet.create({
  base: {
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  mobile: {
    color: '#6366f1',
  },
});
