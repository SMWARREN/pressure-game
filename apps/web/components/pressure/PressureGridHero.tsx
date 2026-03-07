// Pressure game grid hero - shows actual grid with tiles and advancing walls
import { useEffect, useRef, useState } from 'react';
import { Tile } from '../../game/types';

function createDemoGrid(): Tile[] {
  const tiles: Tile[] = [];
  const size = 5;

  // Create a 5x5 grid of random tiles
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const connectionOptions: Array<Array<'up' | 'down' | 'left' | 'right'>> = [
        ['up', 'down'],
        ['left', 'right'],
        ['up', 'right'],
        ['down', 'right'],
        ['up', 'left'],
      ];
      tiles.push({
        id: `${x}-${y}`,
        x,
        y,
        type: 'path',
        connections: connectionOptions[Math.floor(Math.random() * connectionOptions.length)],
        canRotate: true,
        isGoalNode: false,
      });
    }
  }

  // Add 4 goal nodes in cardinal directions
  tiles[6] = { ...tiles[6], type: 'node', isGoalNode: true };
  tiles[8] = { ...tiles[8], type: 'node', isGoalNode: true };
  tiles[16] = { ...tiles[16], type: 'node', isGoalNode: true };
  tiles[18] = { ...tiles[18], type: 'node', isGoalNode: true };

  return tiles;
}

interface WallState {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export function PressureGridHero() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tileSize, setTileSize] = useState(32);
  const [walls, setWalls] = useState<WallState>({ top: 0, bottom: 0, left: 0, right: 0 });
  const [tiles] = useState(() => createDemoGrid());
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;

    const updateSize = () => {
      const width = Math.min(container.clientWidth - 24, 320);
      const newTileSize = Math.floor(width / 5);
      setTileSize(newTileSize);
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    return () => window.removeEventListener('resize', updateSize);
  }, []);

  useEffect(() => {
    const animate = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const cycle = (elapsed % 3) / 3; // 3 second loop

      const gridSize = tileSize * 5;
      const maxAdvance = gridSize * 0.35;

      setWalls({
        top: cycle * maxAdvance,
        bottom: gridSize - cycle * maxAdvance,
        left: cycle * maxAdvance,
        right: gridSize - cycle * maxAdvance,
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    const frameId = requestAnimationFrame(animate);
    animationRef.current = frameId;
    return () => cancelAnimationFrame(frameId);
  }, [tileSize]);

  const gridWidth = tileSize * 5;
  const gridHeight = tileSize * 5;

  return (
    <div
      ref={containerRef}
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
          width: gridWidth + 12,
          height: gridHeight + 12,
        }}
      >
        {/* Grid container */}
        <div
          style={{
            position: 'relative',
            width: gridWidth,
            height: gridHeight,
            margin: 6,
          }}
        >
          {/* Grid tiles */}
          {tiles.map((tile) => (
            <div
              key={tile.id}
              style={{
                position: 'absolute',
                left: tile.x * tileSize,
                top: tile.y * tileSize,
                width: tileSize,
                height: tileSize,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background:
                  tile.type === 'node'
                    ? 'linear-gradient(135deg, #14532d, #0f3d21)'
                    : 'linear-gradient(135deg, #1e1e35, #0f0f1f)',
                border: tile.type === 'node' ? '1px solid #22c55e' : '1px solid #12122a',
                boxShadow:
                  tile.type === 'node'
                    ? 'inset 0 1px 0 rgba(34,197,94,0.3)'
                    : 'inset 0 1px 0 rgba(255,255,255,0.05)',
              }}
            >
              {/* Simple pipe visualization */}
              {tile.type === 'node' ? (
                <div
                  style={{
                    width: Math.max(2, tileSize * 0.3),
                    height: Math.max(2, tileSize * 0.3),
                    borderRadius: '50%',
                    background: '#22c55e',
                    boxShadow: '0 0 6px rgba(34,197,94,0.6)',
                  }}
                />
              ) : (
                <div
                  style={{
                    width: Math.max(1, tileSize * 0.15),
                    height: Math.max(1, tileSize * 0.6),
                    background: '#6366f1',
                    borderRadius: 1,
                    opacity: 0.4,
                  }}
                />
              )}
            </div>
          ))}

          {/* Top wall */}
          <div
            style={{
              position: 'absolute',
              top: walls.top - 3,
              left: 0,
              width: gridWidth,
              height: 3,
              background: 'linear-gradient(180deg, #ef4444, #dc2626)',
              boxShadow: '0 0 8px rgba(239, 68, 68, 0.8)',
              zIndex: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                fontSize: '10px',
              }}
            >
              🔥
            </div>
          </div>

          {/* Bottom wall */}
          <div
            style={{
              position: 'absolute',
              top: walls.bottom,
              left: 0,
              width: gridWidth,
              height: 3,
              background: 'linear-gradient(180deg, #f97316, #ea580c)',
              boxShadow: '0 0 8px rgba(249, 115, 22, 0.8)',
              zIndex: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                fontSize: '10px',
              }}
            >
              🔥
            </div>
          </div>

          {/* Left wall */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: walls.left - 3,
              width: 3,
              height: gridHeight,
              background: 'linear-gradient(90deg, #ec4899, #db2777)',
              boxShadow: '0 0 8px rgba(236, 72, 153, 0.8)',
              zIndex: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                fontSize: '10px',
              }}
            >
              🔥
            </div>
          </div>

          {/* Right wall */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: walls.right,
              width: 3,
              height: gridHeight,
              background: 'linear-gradient(90deg, #6366f1, #4f46e5)',
              boxShadow: '0 0 8px rgba(99, 102, 241, 0.8)',
              zIndex: 10,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                fontSize: '10px',
              }}
            >
              🔥
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
