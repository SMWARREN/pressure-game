import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PressureLogoProps {
  size?: number;
  text?: string;
  gradientColors?: [string, string, string];
}

/**
 * PressureLogo component for React Native
 * Renders gradient text matching web styling
 */
export default function PressureLogo({
  size = 48,
  text = 'PRESSURE',
  gradientColors = ['#c4b5fd', '#8184f8', '#6366f1'],
}: PressureLogoProps) {
  return (
    <SafeAreaView style={{ margin: 0, padding: 0 }}>
      <MaskedView
        maskElement={
          <View
            style={{
              backgroundColor: 'transparent',
            }}
          >
            <Text
              style={{
                fontFamily: 'System',
                fontSize: size,
                fontWeight: '900',
                letterSpacing: size === 48 ? -2.88 : size * -0.06,
                lineHeight: size,
                color: '#000000',
                textAlign: 'center',
              }}
            >
              {text}
            </Text>
          </View>
        }
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            paddingVertical: 0,
            paddingHorizontal: 16,
            minHeight: size + 22,
            width: Math.max(size * text.length * 0.62 + 16, size * 3),
            justifyContent: 'center',
            alignItems: 'center',
          }}
        />
      </MaskedView>
    </SafeAreaView>
  );
}
