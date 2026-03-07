// StateEditor UI rendering helpers - extracted to reduce main component complexity

export function getButtonStyle(isActive: boolean, color: string = '#6366f1'): React.CSSProperties {
  return {
    padding: '8px 12px',
    background: isActive ? color + '22' : 'transparent',
    border: `1px solid ${isActive ? color : 'rgba(99,102,241,0.3)'}`,
    borderRadius: 6,
    color,
    fontWeight: 600,
    cursor: 'pointer',
    fontSize: 13,
    transition: 'all 0.2s',
  };
}

export function shouldShowPresetUI(activeTab: string): boolean {
  return activeTab === 'presets';
}

export function shouldShowDebugUI(activeTab: string): boolean {
  return activeTab === 'debug';
}

export function shouldShowTileEditorUI(activeTab: string): boolean {
  return activeTab === 'tiles';
}

export function shouldShowLevelUI(activeTab: string): boolean {
  return activeTab === 'level';
}

export function getDebugPlayButtonLabel(isDebugPlaying: boolean): string {
  return isDebugPlaying ? '⏸ Pause' : '▶ Play';
}

export function getTilePropertyButtonLabel(property: string, enabled: boolean): string {
  const labels: Record<string, [string, string]> = {
    canRotate: ['🔄', '🚫'],
    isGoalNode: ['🎯', '⭕'],
  };
  return labels[property]?.[enabled ? 0 : 1] ?? property;
}

export function getConnectionDisplayLabel(connection: string): string {
  const labels: Record<string, string> = {
    up: '⬆️',
    down: '⬇️',
    left: '⬅️',
    right: '➡️',
  };
  return labels[connection] ?? connection;
}

export function shouldShowTileInfo(selectedTile: any): boolean {
  return selectedTile != null;
}

export function shouldShowNoTileMessage(selectedTile: any): boolean {
  return selectedTile == null;
}

export function getConnectionCountLabel(count: number): string {
  return `${count} connection${count === 1 ? '' : 's'}`;
}

export function getCompressionStatusLabel(
  compressionActive: boolean,
  compressionOverride: boolean
): string {
  if (compressionOverride) return '🔓 OVERRIDE (on)';
  return compressionActive ? '🚪 CLOSING' : '🔒 Safe';
}

export function getDebugStatusLabel(debugHistory: any[], debugStep: number): string {
  return `Step ${debugStep + 1} / ${debugHistory.length}`;
}

export function shouldEnableDebugPlayButton(debugHistory: any[], debugStep: number): boolean {
  return debugHistory.length > 0 && debugStep < debugHistory.length - 1;
}

export function shouldEnableDebugStepBackButton(debugStep: number): boolean {
  return debugStep > 0;
}

export function shouldEnableDebugStepForwardButton(
  debugHistory: any[],
  debugStep: number
): boolean {
  return debugHistory.length > 0 && debugStep < debugHistory.length - 1;
}

export function getPresetCountMessage(presets: any[]): string {
  return `${presets.length} preset${presets.length === 1 ? '' : 's'}`;
}

export function shouldShowDeletePresetButton(presets: any[], selectedPresetName: string): boolean {
  return presets.length > 0 && selectedPresetName !== '';
}

export function shouldShowLoadPresetButton(presets: any[], selectedPresetName: string): boolean {
  return presets.some((p: any) => p.name === selectedPresetName);
}

export function getTileEditorTitle(selectedTile: any): string {
  if (!selectedTile) return 'No tile selected';
  return `Tile [${selectedTile.x}, ${selectedTile.y}]`;
}

export function getMessageColor(message: string): string {
  if (message.includes('Saved')) return '#10b981';
  if (message.includes('Deleted')) return '#ef4444';
  if (message.includes('Loaded')) return '#3b82f6';
  return '#fbbf24';
}

// Render helpers - extracted to reduce StateEditor component complexity
export function renderEditorHeader(props: any): React.ReactNode {
  const { setIsOpen } = props;
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        borderBottom: '1px solid #1e1e3a',
        background: '#0d0d20',
      }}
    >
      <span style={{ fontWeight: 700, color: '#6366f1' }}>🛠️ State Editor</span>
      <button
        onClick={() => setIsOpen(false)}
        style={{
          background: 'transparent',
          border: 'none',
          color: '#666',
          cursor: 'pointer',
          fontSize: 18,
        }}
      >
        ×
      </button>
    </div>
  );
}

export function getTabStyle(active: boolean): React.CSSProperties {
  return {
    padding: '8px 12px',
    background: active ? '#1e1e3a' : 'transparent',
    border: `1px solid ${active ? '#3a3a5a' : '#1e1e3a'}`,
    borderBottom: active ? `2px solid #6366f1` : '1px solid #1e1e3a',
    color: active ? '#6366f1' : '#6a6a8a',
    fontWeight: active ? 600 : 400,
    cursor: 'pointer',
    fontSize: 12,
    transition: 'all 0.2s',
  };
}
