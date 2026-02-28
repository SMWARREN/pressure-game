import { Tile } from '@/game/types';
import { CandyMode } from '@/game/modes/candy/index';
import { ShoppingSpreeMode } from '@/game/modes/shoppingSpree/index';
import { GemBlastMode } from '@/game/modes/gemBlast/index';
import { ensureHubStyles } from '../hubs/HubStyles';

function makeSampleTiles(symbols: string[]): Tile[] {
  const tiles: Tile[] = [];
  for (let col = 0; col < 3; col++) {
    for (let row = 0; row < 3; row++) {
      const symbol = symbols[(col * 3 + row) % symbols.length];
      tiles.push({
        id: `sample-${col}-${row}`,
        type: 'path',
        x: col,
        y: row,
        connections: [],
        canRotate: true,
        isGoalNode: false,
        justRotated: false,
        displayData: { symbol, activeSymbols: symbols, isNew: false },
      });
    }
  }
  return tiles;
}

export interface SampleGridProps {
  readonly symbols: string[];
  readonly mode: typeof CandyMode | typeof ShoppingSpreeMode | typeof GemBlastMode;
  readonly tileSize: number;
}

export function SampleGrid({ symbols, mode, tileSize }: SampleGridProps) {
  ensureHubStyles();
  const tiles = makeSampleTiles(symbols);
  const ctx = {
    isHint: false,
    inDanger: false,
    justRotated: false,
    compressionActive: false,
    tileSize,
  };

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(3, ${tileSize}px)`,
        gridTemplateRows: `repeat(3, ${tileSize}px)`,
        gap: 3,
        justifyContent: 'center',
      }}
    >
      {tiles.map((tile) => {
        const colors = mode.tileRenderer?.getColors?.(tile, ctx) ?? {};
        const symbol = mode.tileRenderer?.getSymbol?.(tile, ctx) ?? null;
        const delay = (tile.x + tile.y) * 0.15;
        return (
          <div
            key={tile.id}
            style={{
              width: tileSize,
              height: tileSize,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: tileSize * 0.48,
              lineHeight: 1,
              animation: `hubTileFloat ${1.8 + (tile.x + tile.y) * 0.05}s ease-in-out infinite`,
              animationDelay: `${delay}s`,
              ...colors,
            }}
          >
            {symbol}
          </div>
        );
      })}
    </div>
  );
}
