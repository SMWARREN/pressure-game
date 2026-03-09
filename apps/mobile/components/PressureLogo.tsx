import React from 'react';

interface PressureLogoProps {
  size?: number;
}

/**
 * PressureLogo component using expo-dom
 * Renders identical gradient text on both web and mobile
 * Uses native HTML/CSS for perfect consistency
 */
export default function PressureLogo({ size = 22 }: PressureLogoProps) {
  return (
    <div
      style={{
        fontSize: `${size}px`,
        fontWeight: '900',
        letterSpacing: '-0.8px',
        background: 'linear-gradient(135deg, rgb(196, 181, 253) 0%, rgb(129, 140, 248) 40%, rgb(99, 102, 241) 100%)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        backgroundClip: 'text',
        display: 'inline-block',
        margin: 0,
        padding: 0,
        lineHeight: 1,
      } as any}
    >
      PRESSURE
    </div>
  );
}
