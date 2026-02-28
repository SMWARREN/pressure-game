import { useGameStore } from '@/game/store';
import { Tile, Direction, EditorState } from '@/game/types';

export interface EditorToolbarProps {
  readonly editor: EditorState;
  readonly tiles: Tile[];
  readonly setEditorTool: (tool: EditorState['tool']) => void;
  readonly showNotification: (text: string, isScore: boolean) => void;
}

export function EditorToolbar({
  editor,
  tiles,
  setEditorTool,
  showNotification,
}: EditorToolbarProps) {
  const TOOL_ICONS: Record<string, string> = {
    select: '👆',
    move: '✥',
    rotate: '↻',
    node: '⬡',
    path: '┼',
    wall: '🧱',
    decoy: '🎭',
    eraser: '🗑️',
  };

  const TOOL_LABELS: Record<string, string> = {
    select: 'Select',
    move: 'Move',
    rotate: 'Rotate',
    node: 'Node',
    path: 'Path',
    wall: 'Wall',
    decoy: 'Decoy',
    eraser: 'Erase',
  };

  const WALL_DIRECTIONS: Array<{
    dir: EditorState['compressionDirection'];
    label: string;
    title: string;
  }> = [
    { dir: 'all', label: '⬛', title: 'All sides' },
    { dir: 'top', label: '⬇', title: 'From top' },
    { dir: 'bottom', label: '⬆', title: 'From bottom' },
    { dir: 'left', label: '➡', title: 'From left' },
    { dir: 'right', label: '⬅', title: 'From right' },
    { dir: 'top-bottom', label: '↕', title: 'Top & bottom' },
    { dir: 'left-right', label: '↔', title: 'Left & right' },
    { dir: 'none', label: '○', title: 'No walls' },
  ];

  const CONNECTION_PRESETS: Array<{ name: string; connections: Direction[] }> = [
    { name: '─', connections: ['left', 'right'] },
    { name: '│', connections: ['up', 'down'] },
    { name: '┌', connections: ['down', 'right'] },
    { name: '┐', connections: ['down', 'left'] },
    { name: '└', connections: ['up', 'right'] },
    { name: '┘', connections: ['up', 'left'] },
    { name: '├', connections: ['up', 'down', 'right'] },
    { name: '┤', connections: ['up', 'down', 'left'] },
    { name: '┬', connections: ['down', 'left', 'right'] },
    { name: '┴', connections: ['up', 'left', 'right'] },
    { name: '┼', connections: ['up', 'down', 'left', 'right'] },
  ];

  const handleExport = () => {
    const { exportLevel } = useGameStore.getState();
    const levelJson = exportLevel();
    if (levelJson) {
      navigator.clipboard
        .writeText(levelJson)
        .then(() => {
          showNotification('Level copied to clipboard!', false);
        })
        .catch(() => {
          showNotification('Failed to copy', false);
        });
    }
  };

  const handleWallDirection = (dir: EditorState['compressionDirection']) => {
    const newEditor = {
      ...useGameStore.getState().editor,
      compressionDirection: dir,
    };
    useGameStore.setState({ editor: newEditor });
  };

  const handleConnectionPreset = (preset: { connections: Direction[] }) => {
    if (!editor.selectedTile) return;
    const idx = tiles.findIndex(
      (t) => t.x === editor.selectedTile?.x && t.y === editor.selectedTile?.y
    );
    if (idx >= 0) {
      const newTiles = [...tiles];
      newTiles[idx] = {
        ...newTiles[idx],
        connections: preset.connections,
      };
      useGameStore.setState({ tiles: newTiles });
    }
  };

  const selectedTile = editor.selectedTile
    ? tiles.find((t) => t.x === editor.selectedTile?.x && t.y === editor.selectedTile?.y)
    : null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        padding: '12px 16px',
        background: 'rgba(6,6,15,0.95)',
        backdropFilter: 'blur(8px)',
        borderTop: '1px solid #12122a',
      }}
    >
      {/* Tool buttons row */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          alignItems: 'center',
          overflowX: 'auto' as const,
          WebkitOverflowScrolling: 'touch' as const,
          paddingBottom: 4,
          marginBottom: 4,
        }}
      >
        {/* Editor mode indicator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '0 8px',
            borderRight: '1px solid #a855f740',
            marginRight: 4,
          }}
        >
          <span style={{ fontSize: 14, color: '#a855f7' }}>🛠️</span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#a855f7',
              letterSpacing: '0.1em',
            }}
          >
            EDITOR
          </span>
        </div>

        {/* Tool buttons */}
        {(Object.keys(TOOL_ICONS) as unknown[]).map((toolKey) => {
          const tool = toolKey as EditorState['tool'];
          const isActive = editor.tool === tool;
          return (
            <button
              key={tool}
              onClick={() => setEditorTool(tool)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 2,
                padding: '6px 10px',
                borderRadius: 10,
                border: isActive ? '1px solid #a855f7' : '1px solid transparent',
                background: isActive ? 'rgba(168,85,247,0.2)' : 'transparent',
                cursor: 'pointer',
                transition: 'all 0.15s',
                minWidth: 44,
              }}
              title={TOOL_LABELS[tool as string] ?? ''}
            >
              <span style={{ fontSize: 16 }}>{TOOL_ICONS[tool as string]}</span>
              <span
                style={{
                  fontSize: 8,
                  color: isActive ? '#a855f7' : '#3a3a55',
                  fontWeight: 600,
                }}
              >
                {(TOOL_LABELS[tool as string] ?? '').toUpperCase()}
              </span>
            </button>
          );
        })}

        {/* Export button */}
        <div style={{ borderLeft: '1px solid #a855f740', marginLeft: 4, paddingLeft: 8 }}>
          <button
            onClick={handleExport}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              padding: '6px 10px',
              borderRadius: 10,
              border: '1px solid #22c55e40',
              background: 'rgba(34,197,94,0.1)',
              cursor: 'pointer',
              transition: 'all 0.15s',
              minWidth: 44,
            }}
            title="Export Level"
          >
            <span style={{ fontSize: 16 }}>📋</span>
            <span style={{ fontSize: 8, color: '#22c55e', fontWeight: 600 }}>EXPORT</span>
          </button>
        </div>
      </div>

      {/* Wall direction selector */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          paddingTop: 8,
          borderTop: '1px solid #a855f740',
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        <span
          style={{
            fontSize: 9,
            color: '#3a3a55',
            width: '100%',
            textAlign: 'center',
            marginBottom: 4,
          }}
        >
          WALL DIRECTION
        </span>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
          {WALL_DIRECTIONS.map(({ dir, label, title }) => {
            const isActive = editor.compressionDirection === dir;
            return (
              <button
                key={dir}
                onClick={() => handleWallDirection(dir)}
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  border: isActive ? '1px solid #ef4444' : '1px solid #12122a',
                  background: isActive ? 'rgba(239,68,68,0.2)' : '#07070e',
                  color: isActive ? '#ef4444' : '#a5b4fc',
                  fontSize: 12,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                title={title}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Connection presets row */}
      {selectedTile &&
        selectedTile.type === 'path' &&
        (() => {
          const tile = selectedTile as Tile & { type: 'path' };
          return (
            <div
              style={{
                display: 'flex',
                gap: 4,
                paddingTop: 8,
                borderTop: '1px solid #a855f740',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontSize: 9,
                  color: '#3a3a55',
                  width: '100%',
                  textAlign: 'center',
                  marginBottom: 4,
                }}
              >
                CONNECTIONS
              </span>
              {CONNECTION_PRESETS.map((preset) => {
                const isActive =
                  JSON.stringify([...tile.connections].sort((a, b) => a.localeCompare(b))) ===
                  JSON.stringify([...preset.connections].sort((a, b) => a.localeCompare(b)));
                return (
                  <button
                    key={preset.name}
                    onClick={() => handleConnectionPreset(preset)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      border: isActive ? '1px solid #22c55e' : '1px solid #12122a',
                      background: isActive ? 'rgba(34,197,94,0.2)' : '#07070e',
                      color: isActive ? '#22c55e' : '#a5b4fc',
                      fontSize: 14,
                      fontFamily: 'monospace',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                    title={preset.connections.join(' + ')}
                  >
                    {preset.name}
                  </button>
                );
              })}
            </div>
          );
        })()}
    </div>
  );
}
