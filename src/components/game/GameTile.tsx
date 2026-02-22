import { useState, useRef, useEffect, memo } from 'react'

/**
 * Pipes - Renders the connection lines on each tile
 */
function Pipes({ connections, color, glow }: { connections: string[]; color: string; glow: string }) {
  return (
    <>
      {connections.includes('up') && (
        <div style={{ 
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', 
          width: 5, height: '53%', background: color, borderRadius: '3px 3px 0 0', 
          boxShadow: `0 0 6px ${glow}` 
        }} />
      )}
      {connections.includes('down') && (
        <div style={{ 
          position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', 
          width: 5, height: '53%', background: color, borderRadius: '0 0 3px 3px', 
          boxShadow: `0 0 6px ${glow}` 
        }} />
      )}
      {connections.includes('left') && (
        <div style={{ 
          position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', 
          height: 5, width: '53%', background: color, borderRadius: '3px 0 0 3px', 
          boxShadow: `0 0 6px ${glow}` 
        }} />
      )}
      {connections.includes('right') && (
        <div style={{ 
          position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', 
          height: 5, width: '53%', background: color, borderRadius: '0 3px 3px 0', 
          boxShadow: `0 0 6px ${glow}` 
        }} />
      )}
      <div style={{ 
        position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', 
        width: 8, height: 8, background: color, borderRadius: '50%', 
        boxShadow: `0 0 8px ${glow}` 
      }} />
    </>
  )
}

import type { TileRenderer } from '@/game/types'

export interface GameTileProps {
  type: string
  connections: string[]
  canRotate: boolean
  isGoalNode: boolean
  isHint: boolean
  inDanger: boolean
  justRotated?: boolean
  onClick: () => void
  tileSize: number
  /** Optional mode-specific renderer — enables slots, candy crush, match-3, etc. */
  tileRenderer?: TileRenderer
  displayData?: Record<string, unknown>
}

/**
 * GameTile - Individual tile component with visual states and click handling
 * Memoized to prevent unnecessary re-renders
 */
function GameTileComponent({
  type, connections, canRotate, isGoalNode, isHint, inDanger, justRotated, onClick, tileSize,
  tileRenderer, displayData
}: GameTileProps) {
  const [pressed, setPressed] = useState(false)
  const [ripple, setRipple] = useState(false)
  const pressedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rippleTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (pressedTimeoutRef.current) clearTimeout(pressedTimeoutRef.current)
      if (rippleTimeoutRef.current) clearTimeout(rippleTimeoutRef.current)
    }
  }, [])

  const handleClick = () => {
    if (!canRotate) return
    
    setPressed(true)
    setRipple(true)
    
    // Clear existing timeouts
    if (pressedTimeoutRef.current) clearTimeout(pressedTimeoutRef.current)
    if (rippleTimeoutRef.current) clearTimeout(rippleTimeoutRef.current)
    
    pressedTimeoutRef.current = setTimeout(() => setPressed(false), 150)
    rippleTimeoutRef.current = setTimeout(() => setRipple(false), 400)
    
    onClick()
  }

  const r = tileSize > 50 ? 8 : 6

  const bgStyle = (() => {
    if (type === 'wall') return {
      background: 'linear-gradient(145deg, #0e0e1c 0%, #090912 100%)',
      border: '1px solid #131325',
    }
    if (type === 'crushed') return {
      background: 'linear-gradient(145deg, #1a0000 0%, #0d0000 100%)',
      border: '1px solid #2a0505',
      boxShadow: 'inset 0 0 12px rgba(239,68,68,0.15)',
    }
    if (type === 'node') return {
      background: inDanger
        ? 'linear-gradient(145deg, #3d0808 0%, #2d0606 100%)'
        : 'linear-gradient(145deg, #14532d 0%, #0f3d21 100%)',
      border: `2px solid ${inDanger ? '#ef4444' : isHint ? '#86efac' : '#22c55e'}`,
      boxShadow: inDanger
        ? '0 0 20px rgba(239,68,68,0.5), inset 0 1px 0 rgba(255,255,255,0.05)'
        : '0 0 14px rgba(34,197,94,0.25), inset 0 1px 0 rgba(255,255,255,0.06)',
    }
    if (type === 'path' && canRotate) return {
      background: isHint
        ? 'linear-gradient(145deg, #7c5c00 0%, #5c4400 100%)'
        : inDanger
          ? 'linear-gradient(145deg, #5c1a1a 0%, #3d1010 100%)'
          : 'linear-gradient(145deg, #78350f 0%, #5c2a0a 100%)',
      border: `2px solid ${isHint ? '#fde68a' : inDanger ? '#ef4444' : '#f59e0b'}`,
      boxShadow: isHint
        ? '0 0 18px rgba(253,230,138,0.6), inset 0 1px 0 rgba(255,255,255,0.08)'
        : inDanger
          ? '0 0 14px rgba(239,68,68,0.4)'
          : '0 0 8px rgba(245,158,11,0.18), inset 0 1px 0 rgba(255,255,255,0.06)',
    }
    if (type === 'path') return {
      background: 'linear-gradient(145deg, #1e3060 0%, #172349 100%)',
      border: '1.5px solid #2a4080',
      boxShadow: '0 0 6px rgba(59,130,246,0.12)',
    }
    return { background: 'rgba(10,10,20,0.3)' }
  })()

  const connColor = type === 'node'
    ? (inDanger ? 'rgba(252,165,165,0.9)' : 'rgba(134,239,172,0.95)')
    : canRotate
      ? (isHint ? 'rgba(253,230,138,0.95)' : inDanger ? 'rgba(252,165,165,0.9)' : 'rgba(252,211,77,0.92)')
      : 'rgba(147,197,253,0.85)'

  const connGlow = type === 'node'
    ? (inDanger ? 'rgba(239,68,68,0.6)' : 'rgba(34,197,94,0.5)')
    : canRotate
      ? (isHint ? 'rgba(253,230,138,0.7)' : 'rgba(245,158,11,0.5)')
      : 'rgba(59,130,246,0.4)'

  // ── Custom mode renderer (slots, candy crush, match-3, etc.) ──────────────
  if (tileRenderer && tileRenderer.type !== 'pipe') {
    const ctx = { isHint, inDanger, justRotated: !!justRotated, compressionActive: false, tileSize }
    const tile = { id: `${type}-0-0`, x: 0, y: 0, type: type as any, connections: connections as any, canRotate, isGoalNode, justRotated, displayData }
    const customColors = tileRenderer.getColors?.(tile, ctx)
    const symbol = tileRenderer.getSymbol?.(tile, ctx)
    const appliedBg = customColors ?? bgStyle
    return (
      <div
        onClick={handleClick}
        style={{
          borderRadius: r, position: 'relative',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: canRotate ? 'pointer' : 'default',
          transform: pressed ? 'scale(0.84)' : justRotated ? 'scale(1.08)' : 'scale(1)',
          transition: pressed ? 'transform 0.08s ease' : 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
          fontSize: tileRenderer.symbolSize ?? '1.2rem',
          ...appliedBg, overflow: 'hidden',
        }}
      >
        {symbol && <span style={{ zIndex: 1, userSelect: 'none' }}>{symbol}</span>}
        {!tileRenderer.hidePipes && connections.length > 0 && type !== 'wall' && type !== 'crushed' && (
          <Pipes connections={connections} color={connColor} glow={connGlow} />
        )}
      </div>
    )
  }

  // ── Default pipe renderer ─────────────────────────────────────────────────
  return (
    <div
      onClick={handleClick}
      style={{
        borderRadius: r,
        position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: canRotate ? 'pointer' : 'default',
        transform: pressed ? 'scale(0.84)' : justRotated ? 'scale(1.08)' : 'scale(1)',
        transition: pressed ? 'transform 0.08s ease' : 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        ...bgStyle,
        overflow: 'hidden',
      }}
    >
      {/* Ripple effect */}
      {ripple && canRotate && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: r,
          background: 'rgba(255,255,255,0.12)',
          opacity: 0,
          transition: 'opacity 0.4s ease',
        }} />
      )}

      {/* Pipe connections */}
      {connections.length > 0 && type !== 'wall' && type !== 'crushed' && type !== 'empty' && (
        <Pipes connections={connections} color={connColor} glow={connGlow} />
      )}

      {/* Goal node indicator ring */}
      {isGoalNode && type === 'node' && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%',
          transform: 'translate(-50%,-50%)',
          width: '40%', height: '40%',
          border: `2px solid ${inDanger ? 'rgba(252,165,165,0.5)' : 'rgba(134,239,172,0.5)'}`,
          borderRadius: '50%', zIndex: 1,
        }} />
      )}

      {/* Rotatable indicator dot */}
      {canRotate && (
        <div style={{
          position: 'absolute', top: 3, right: 3,
          width: 4, height: 4, borderRadius: '50%',
          background: isHint ? '#fde68a' : inDanger ? '#fca5a5' : '#fcd34d',
          boxShadow: `0 0 4px ${isHint ? 'rgba(253,230,138,0.8)' : 'rgba(252,211,77,0.6)'}`,
        }} />
      )}

      {/* Crushed tile X marker */}
      {type === 'crushed' && (
        <div style={{ fontSize: tileSize > 40 ? 14 : 10, color: 'rgba(239,68,68,0.4)', fontWeight: 900, zIndex: 1 }}>✕</div>
      )}
    </div>
  )
}

// Memoize to prevent unnecessary re-renders
export const GameTile = memo(GameTileComponent)
export default GameTile
