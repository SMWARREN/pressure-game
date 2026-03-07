// StateEditor major render sections - extracted to significantly reduce main component complexity

export function renderTabButtons(props: any): React.ReactNode {
  const { activeTab, setActiveTab, getTabStyle } = props;
  const tabs = ['stats', 'tiles', 'presets', 'debug', 'level'];

  return (
    <div
      style={{ display: 'flex', gap: 8, padding: '8px 12px', borderBottom: '1px solid #1e1e3a' }}
    >
      {tabs.map((tab) => (
        <button key={tab} onClick={() => setActiveTab(tab)} style={getTabStyle(activeTab === tab)}>
          {tab.charAt(0).toUpperCase() + tab.slice(1)}
        </button>
      ))}
    </div>
  );
}

export function getActiveTabContent(props: any): React.ReactNode {
  const { activeTab } = props;

  switch (activeTab) {
    case 'tiles':
      return <div>Tiles content</div>;
    case 'presets':
      return <div>Presets content</div>;
    case 'debug':
      return <div>Debug content</div>;
    case 'level':
      return <div>Level content</div>;
    case 'stats':
    default:
      return <div>Stats content</div>;
  }
}

export function shouldRenderContent(message: string, isOpen: boolean): boolean {
  return isOpen && !message;
}

export function getEditorContainerStyle(): React.CSSProperties {
  return {
    position: 'fixed',
    top: 0,
    right: 0,
    width: 380,
    height: '100vh',
    background: '#0a0a1a',
    borderLeft: '1px solid #1e1e3a',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };
}

export function getEditorOverlayStyle(): React.CSSProperties {
  return {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9998,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };
}

export function getMessageBoxStyle(): React.CSSProperties {
  return {
    position: 'fixed',
    top: 0,
    right: 0,
    width: 380,
    height: '100vh',
    background: '#0a0a1a',
    borderLeft: '1px solid #1e1e3a',
    zIndex: 9999,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  };
}

export function getMessageTextStyle(color: string): React.CSSProperties {
  return {
    fontSize: 14,
    color,
    fontWeight: 600,
    textAlign: 'center',
    marginBottom: 16,
  };
}

export function getScrollableContentStyle(): React.CSSProperties {
  return {
    flex: 1,
    overflowY: 'auto',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  };
}

export function shouldShowTabContent(activeTab: string, currentTab: string): boolean {
  return activeTab === currentTab;
}

export function getEmptyStateMessage(section: string): string {
  const messages: Record<string, string> = {
    presets: 'No presets saved',
    tiles: 'Select a tile to edit',
    debug: 'No debug history',
    level: 'No level loaded',
    stats: 'Game not started',
  };
  return messages[section] ?? 'No data';
}

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

export function getHeaderStyle(): React.CSSProperties {
  return {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderBottom: '1px solid #1e1e3a',
    background: '#0d0d20',
  };
}

export function getStatsGridStyle(): React.CSSProperties {
  return {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
  };
}

export function getStatBoxStyle(): React.CSSProperties {
  return {
    background: '#0a0a15',
    borderRadius: 10,
    padding: '10px 8px',
    textAlign: 'center',
    border: '1px solid #1e1e35',
  };
}

export function getHeroSectionStyle(): React.CSSProperties {
  return {
    padding: '12px 16px',
    background: 'linear-gradient(135deg, #0d0d20 0%, #12122a 100%)',
    borderBottom: '1px solid #1e1e3a',
  };
}
