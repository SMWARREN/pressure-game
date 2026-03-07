// Pressure game board demo showing walls advancing from directions
// Shows what pressure mechanics look like with advancing walls

import { useEffect, useRef } from 'react';

export function PressureGameboardDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let timeElapsed = 0;

    const animate = () => {
      timeElapsed += 1 / 60; // ~60fps
      const time = (timeElapsed % 3) / 3; // Loop every 3 seconds

      // Clear canvas
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const w = canvas.width;
      const h = canvas.height;
      const tileSize = Math.min(w, h) / 5;

      // Draw grid
      ctx.strokeStyle = '#12122a';
      ctx.lineWidth = 1;
      for (let i = 0; i <= 5; i++) {
        ctx.beginPath();
        ctx.moveTo(i * tileSize, 0);
        ctx.lineTo(i * tileSize, h);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, i * tileSize);
        ctx.lineTo(w, i * tileSize);
        ctx.stroke();
      }

      // Draw center goal nodes
      const centerX = w / 2;
      const centerY = h / 2;
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(centerX, centerY - tileSize, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX, centerY + tileSize, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX - tileSize, centerY, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(centerX + tileSize, centerY, 6, 0, Math.PI * 2);
      ctx.fill();

      // Draw advancing walls from all directions
      const wallColor = (direction: string) => {
        const colors: Record<string, string> = {
          top: '#ef4444',
          bottom: '#f97316',
          left: '#ec4899',
          right: '#6366f1',
        };
        return colors[direction] || '#ffffff';
      };

      // Top wall
      const topAdvance = time * h * 0.4;
      ctx.fillStyle = wallColor('top') + '40';
      ctx.fillRect(0, topAdvance - 20, w, 20);
      ctx.fillStyle = wallColor('top');
      ctx.fillRect(0, topAdvance - 4, w, 4);

      // Bottom wall
      const bottomAdvance = h - time * h * 0.4;
      ctx.fillStyle = wallColor('bottom') + '40';
      ctx.fillRect(0, bottomAdvance, w, 20);
      ctx.fillStyle = wallColor('bottom');
      ctx.fillRect(0, bottomAdvance, w, 4);

      // Left wall
      const leftAdvance = time * w * 0.4;
      ctx.fillStyle = wallColor('left') + '40';
      ctx.fillRect(leftAdvance - 20, 0, 20, h);
      ctx.fillStyle = wallColor('left');
      ctx.fillRect(leftAdvance - 4, 0, 4, h);

      // Right wall
      const rightAdvance = w - time * w * 0.4;
      ctx.fillStyle = wallColor('right') + '40';
      ctx.fillRect(rightAdvance, 0, 20, h);
      ctx.fillStyle = wallColor('right');
      ctx.fillRect(rightAdvance, 0, 4, h);

      // Draw direction labels
      ctx.fillStyle = '#4a4a6a';
      ctx.font = '10px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🔥', w / 2, topAdvance - 30);
      ctx.fillText('🔥', w / 2, bottomAdvance + 30);
      ctx.fillText('🔥', leftAdvance - 30, h / 2);
      ctx.fillText('🔥', rightAdvance + 30, h / 2);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '16px 12px 12px',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: 'relative',
          borderRadius: 12,
          border: '1.5px solid #1e1e35',
          overflow: 'hidden',
          background: '#06060f',
          boxShadow: '0 0 12px rgba(99, 102, 241, 0.2)',
        }}
      >
        <canvas
          ref={canvasRef}
          width={280}
          height={160}
          style={{
            display: 'block',
            maxWidth: '100%',
            height: 'auto',
          }}
        />
      </div>
    </div>
  );
}
