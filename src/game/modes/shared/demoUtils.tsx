// Shared demo utilities for pressure mode tutorials
// Eliminates duplication across classic, zen, blitz, and other pressure mode demos

import React from 'react';

export const tileBase: React.CSSProperties = {
  width: 52,
  height: 52,
  borderRadius: 10,
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

export const pipe = (dir: 'up' | 'down' | 'left' | 'right', color: string) => {
  const styles: Record<string, React.CSSProperties> = {
    up: {
      position: 'absolute',
      top: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 5,
      height: '53%',
      background: color,
      borderRadius: '3px 3px 0 0',
    },
    down: {
      position: 'absolute',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 5,
      height: '53%',
      background: color,
      borderRadius: '0 0 3px 3px',
    },
    left: {
      position: 'absolute',
      left: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      height: 5,
      width: '53%',
      background: color,
      borderRadius: '3px 0 0 3px',
    },
    right: {
      position: 'absolute',
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      height: 5,
      width: '53%',
      background: color,
      borderRadius: '0 3px 3px 0',
    },
  };
  return <div key={dir} style={styles[dir]} />;
};

export const dot = (color: string) => (
  <div
    style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%,-50%)',
      width: 8,
      height: 8,
      background: color,
      borderRadius: '50%',
      zIndex: 1,
    }}
  />
);

export const rotateDot = (
  <div
    style={{
      position: 'absolute',
      top: 3,
      right: 3,
      width: 5,
      height: 5,
      borderRadius: '50%',
      background: '#fcd34d',
      zIndex: 2,
    }}
  />
);
