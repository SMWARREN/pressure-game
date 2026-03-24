import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const STAR_COUNT = 120;

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  speed: number; // twinkle speed multiplier
}

const stars: Star[] = Array.from({ length: STAR_COUNT }, (_, i) => ({
  id: i,
  x: Math.random() * 100,
  y: Math.random() * 100,
  size: 1 + Math.random() * 2.5,
  baseOpacity: 0.35 + Math.random() * 0.45,
  speed: 1500 + Math.random() * 3000,
}));

function AnimatedStar({ star }: { star: Star }) {
  const opacity = useRef(new Animated.Value(star.baseOpacity)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: star.baseOpacity * 0.2,
          duration: star.speed,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: star.baseOpacity,
          duration: star.speed,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={{
        position: 'absolute',
        left: `${star.x}%`,
        top: `${star.y}%`,
        width: star.size,
        height: star.size,
        borderRadius: star.size / 2,
        backgroundColor: '#a5b4fc',
        opacity,
      }}
    />
  );
}

export default function StarField() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {stars.map((s) => (
        <AnimatedStar key={s.id} star={s} />
      ))}
    </View>
  );
}
