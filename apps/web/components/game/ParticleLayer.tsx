// Isolated particle system — 60fps RAF updates never cause main component to re-render
import React, { useState, useEffect, useRef, useCallback } from 'react';

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  shape: 'circle' | 'star';
}

export interface ParticleSystemHandle {
  burst: (x: number, y: number, color: string, count?: number, shape?: 'circle' | 'star') => void;
}

const ParticleLayer = React.forwardRef<ParticleSystemHandle>((_, ref) => {
  const [particles, setParticles] = useState<Particle[]>([]);
  const idRef = useRef(0);
  const frameRef = useRef<number | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const isRunningRef = useRef(false);

  useEffect(() => {
    particlesRef.current = particles;
  }, [particles]);

  const burst = useCallback(
    (x: number, y: number, color: string, count = 10, shape: 'circle' | 'star' = 'circle') => {
      const ps: Particle[] = Array.from({ length: count }, (_, i) => {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
        const speed = 2 + Math.random() * 4;
        const life = 0.7 + Math.random() * 0.5;
        return {
          id: idRef.current++,
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1,
          life,
          maxLife: life,
          color,
          size: 3 + Math.random() * 7,
          shape,
        };
      });

      particlesRef.current = [...particlesRef.current, ...ps];
      setParticles([...particlesRef.current]);

      if (!isRunningRef.current && particlesRef.current.length > 0) {
        isRunningRef.current = true;
        runAnimation();
      }
    },
    []
  );

  const runAnimation = useCallback(() => {
    if (particlesRef.current.length === 0) {
      isRunningRef.current = false;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      return;
    }

    frameRef.current = requestAnimationFrame(() => {
      particlesRef.current = particlesRef.current
        .map((p) => ({
          ...p,
          x: p.x + p.vx,
          y: p.y + p.vy,
          vy: p.vy + 0.18,
          life: p.life - 0.025,
        }))
        .filter((p) => p.life > 0);

      setParticles([...particlesRef.current]);

      if (particlesRef.current.length > 0) {
        runAnimation();
      } else {
        isRunningRef.current = false;
      }
    });
  }, []);

  React.useImperativeHandle(ref, () => ({ burst }), [burst]);

  useEffect(() => {
    return () => {
      isRunningRef.current = false;
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, []);

  if (particles.length === 0) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999 }}>
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: p.x - p.size / 2,
            top: p.y - p.size / 2,
            width: p.size,
            height: p.size,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            background: p.color,
            opacity: p.life / p.maxLife,
            transform: p.shape === 'star' ? `rotate(${p.life * 200}deg)` : undefined,
            boxShadow: `0 0 ${p.size * 1.5}px ${p.color}`,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
});

ParticleLayer.displayName = 'ParticleLayer';
export default ParticleLayer;
