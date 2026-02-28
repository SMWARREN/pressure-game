/**
 * Game-specific style constants
 * Consolidates commonly used styles to reduce duplication
 */

export const iconBtn: React.CSSProperties = {
  width: 44,
  height: 44,
  borderRadius: 10,
  border: '1px solid #12122a',
  background: 'transparent',
  color: '#a5b4fc',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 16,
  fontFamily: 'inherit',
  transition: 'all 0.15s',
  minHeight: 40,
};

export const boardContainerStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  position: 'relative',
  zIndex: 1,
  padding: '4px 0',
};

export const headerStyle: React.CSSProperties = {
  width: '100%',
  flexShrink: 0,
  zIndex: 2,
  position: 'relative',
  borderBottom: '1px solid #12122a',
  background: 'rgba(6,6,15,0.85)',
  backdropFilter: 'blur(12px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 'max(10px, env(safe-area-inset-top)) 12px 10px',
  gap: 8,
};

export const footerStyle: React.CSSProperties = {
  width: '100%',
  flexShrink: 0,
  zIndex: 2,
  borderTop: '1px solid #12122a',
  background: 'rgba(6,6,15,0.75)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: 'clamp(10px, 1.5vh, 14px) 20px max(12px, env(safe-area-inset-bottom))',
  gap: 12,
};

export const levelNameStyle: React.CSSProperties = {
  fontSize: 'clamp(14px, 4vw, 18px)',
  fontWeight: 900,
  letterSpacing: '-0.02em',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

export const levelNumberStyle: React.CSSProperties = {
  fontSize: 'clamp(9px, 2.5vw, 10px)',
  color: '#25253a',
  letterSpacing: '0.15em',
  marginTop: 2,
};
