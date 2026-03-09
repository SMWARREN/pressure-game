import React from 'react';

interface PressureLogoProps {
  size?: number;
}

/**
 * PressureLogo component using expo-dom
 * Renders identical gradient text on both web and mobile
 * Matches exact web styling with responsive font size
 */
export default function PressureLogo({ size }: PressureLogoProps) {
  return (
    <div
      style={{
        fontSize: 'clamp(2rem, 10vw, 3.5rem)',
        fontWeight: '900',
        letterSpacing: '-0.06em',
        lineHeight: '1',
        background: 'linear-gradient(135deg, rgb(196, 181, 253) 0%, rgb(129, 140, 248) 40%, rgb(99, 102, 241) 100%)',
        backgroundClip: 'text',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
        display: 'inline-block',
        margin: 0,
        padding: 0,
      } as any}
    >
      PRESSURE
    </div>
  );
}
