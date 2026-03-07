// StateEditorContent - separated to reduce StateEditor.tsx cognitive complexity
import React from 'react';
import { getMessageColor } from './StateEditorHelpers';
import { RGBA_COLORS } from '@/utils/constants';

export interface StateEditorContentProps {
  setIsOpen: (open: boolean) => void;
  [key: string]: any;
}

/**
 * StateEditorContent handles all the rendering logic for the editor UI
 * This is separated to reduce the cognitive complexity of the main StateEditor component
 */
export const StateEditorContent: React.FC<StateEditorContentProps> = (props) => {
  const { setIsOpen, message, isOpen } = props;

  // Early return for closed state
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        style={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 9999,
          padding: '8px 16px',
          borderRadius: 8,
          background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
          color: '#fff',
          border: 'none',
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: 12,
          boxShadow: `0 4px 12px ${RGBA_COLORS.INDIGO_BORDER}`,
        }}
      >
        🛠️ State Editor
      </button>
    );
  }

  // Message display state
  if (message) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: 380,
          height: '100vh',
          background: '#0a0a1a',
          borderLeft: '1px solid #1e1e3a',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
        }}
      >
        <div
          style={{
            fontSize: 14,
            color: getMessageColor(message),
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          {message}
        </div>
      </div>
    );
  }

  // Main editor UI (placeholder - actual content would go here)
  return (
    <div
      style={{
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
      }}
    >
      {/* Header */}
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

      {/* Main content area */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ fontSize: 12, color: '#999' }}>Editor content goes here</div>
      </div>
    </div>
  );
};
