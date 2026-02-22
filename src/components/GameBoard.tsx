import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { useGameStore } from '@/game/store'
import { useShallow } from 'zustand/react/shallow'
import { LEVELS, getSolution, generateLevel, verifyLevel } from '@/game/levels'
import TutorialScreen from './TutorialScreen'
import ModeSelectorModal from './ModeSelectorModal'
import { getModeById } from '../game/modes'
import { Level } from '@/game/types'

/* ═══════════════════════════════════════════════════════════════════════════
   PARTICLE SYSTEM
   Isolated in its own component + imperative ref so 60fps RAF updates
   never cause the full GameBoard to re-render.
═══════════════════════════════════════════════════════════════════════════ */

import React from 'react'

interface Particle {
  id: number; x: number; y: number; vx: number; vy: number
  life: number; maxLife: number; color: string; size: number; shape: 'circle' | 'star'
}

interface ParticleSystemHandle {
  burst: (x: number, y: number, color: string, count?: number, shape?: 'circle' | 'star') => void
}

const ParticleLayer = React.forwardRef<ParticleSystemHandle>((_, ref) => {
  const [particles, setParticles] = useState<Particle[]>([])
  const idRef = useRef(0)
  const frameRef = useRef<number | null>(null)

  const burst = useCallback((x: number, y: number, color: string, count = 10, shape: 'circle' | 'star' = 'circle') => {
    const ps: Particle[] = Array.from({ length: count }, (_, i) => {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6
      const speed = 2 + Math.random() * 4
      const life = 0.7 + Math.random() * 0.5
      return { id: idRef.current++, x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 1, life, maxLife: life, color, size: 3 + Math.random() * 7, shape }
    })
    setParticles(p => [...p, ...ps])
  }, [])

  React.useImperativeHandle(ref, () => ({ burst }), [burst])

  useEffect(() => {
    if (particles.length === 0) {
      if (frameRef.current) { cancelAnimationFrame(frameRef.current); frameRef.current = null }
      return
    }
    frameRef.current = requestAnimationFrame(() => {
      setParticles(ps =>
        ps.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.18, life: p.life - 0.025 }))
          .filter(p => p.life > 0)
      )
    })
    return () => { if (frameRef.current) { cancelAnimationFrame(frameRef.current); frameRef.current = null } }
  }, [particles])

  if (particles.length === 0) return null
  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999 }}>
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: p.x - p.size / 2, top: p.y - p.size / 2,
          width: p.size, height: p.size, borderRadius: p.shape === 'circle' ? '50%' : '2px',
          background: p.color, opacity: p.life / p.maxLife,
          transform: p.shape === 'star' ? `rotate(${p.life * 200}deg)` : undefined,
          boxShadow: `0 0 ${p.size * 1.5}px ${p.color}`, pointerEvents: 'none',
        }} />
      ))}
    </div>
  )
})

/* ═══════════════════════════════════════════════════════════════════════════
   RESPONSIVE VIEWPORT HOOK — re-renders on resize/orientation change
═══════════════════════════════════════════════════════════════════════════ */

function useViewport() {
  const [size, setSize] = useState({ w: window.innerWidth, h: window.innerHeight })
  useEffect(() => {
    const update = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', update)
    window.addEventListener('orientationchange', update)
    return () => { window.removeEventListener('resize', update); window.removeEventListener('orientationchange', update) }
  }, [])
  return size
}

/* ═══════════════════════════════════════════════════════════════════════════
   COMPRESSION BAR
═══════════════════════════════════════════════════════════════════════════ */

function CompressionBar({ percent, active }: { percent: number; active: boolean }) {
  const color = percent > 66 ? '#ef4444' : percent > 33 ? '#f59e0b' : '#22c55e'
  const glow = percent > 66 ? 'rgba(239,68,68,0.5)' : percent > 33 ? 'rgba(245,158,11,0.5)' : 'rgba(34,197,94,0.5)'
  const label = percent > 66 ? 'CRITICAL' : percent > 33 ? 'PRESSURE' : 'STABLE'
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 9, letterSpacing: '0.15em', color: active ? color : '#3a3a55', fontWeight: 800, transition: 'color 0.3s' }}>{label}</span>
      </div>
      <div style={{ height: 8, background: '#080814', borderRadius: 4, overflow: 'hidden', border: '1px solid #131325' }}>
        <div style={{
          height: '100%', width: `${percent}%`, borderRadius: 4,
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
          transition: 'width 0.5s ease, background 0.4s',
          boxShadow: active && percent > 10 ? `0 0 12px ${glow}` : 'none',
        }} />
      </div>
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   PIPE RENDERER
═══════════════════════════════════════════════════════════════════════════ */

function Pipes({ connections, color, glow }: { connections: string[]; color: string; glow: string }) {
  return (
    <>
      {connections.includes('up') && (
        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 5, height: '53%', background: color, borderRadius: '3px 3px 0 0', boxShadow: `0 0 6px ${glow}` }} />
      )}
      {connections.includes('down') && (
        <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 5, height: '53%', background: color, borderRadius: '0 0 3px 3px', boxShadow: `0 0 6px ${glow}` }} />
      )}
      {connections.includes('left') && (
        <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', height: 5, width: '53%', background: color, borderRadius: '3px 0 0 3px', boxShadow: `0 0 6px ${glow}` }} />
      )}
      {connections.includes('right') && (
        <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', height: 5, width: '53%', background: color, borderRadius: '0 3px 3px 0', boxShadow: `0 0 6px ${glow}` }} />
      )}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 8, height: 8, background: color, borderRadius: '50%', boxShadow: `0 0 8px ${glow}` }} />
    </>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   GAME TILE
═══════════════════════════════════════════════════════════════════════════ */

interface GameTileProps {
  type: string; connections: string[]; canRotate: boolean; isGoalNode: boolean
  isHint: boolean; inDanger: boolean; justRotated?: boolean; onClick: () => void; tileSize: number
}

function GameTile({ type, connections, canRotate, isGoalNode, isHint, inDanger, justRotated, onClick, tileSize }: GameTileProps) {
  const [pressed, setPressed] = useState(false)
  const [ripple, setRipple] = useState(false)
  const pressedRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const rippleRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (pressedRef.current) clearTimeout(pressedRef.current)
    if (rippleRef.current) clearTimeout(rippleRef.current)
  }, [])

  const handleClick = () => {
    if (!canRotate) return
    setPressed(true); setRipple(true)
    if (pressedRef.current) clearTimeout(pressedRef.current)
    if (rippleRef.current) clearTimeout(rippleRef.current)
    pressedRef.current = setTimeout(() => setPressed(false), 150)
    rippleRef.current = setTimeout(() => setRipple(false), 400)
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

  return (
    <div
      onClick={handleClick}
      style={{
        borderRadius: r, position: 'relative',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: canRotate ? 'pointer' : 'default',
        transform: pressed ? 'scale(0.84)' : justRotated ? 'scale(1.08)' : 'scale(1)',
        transition: pressed ? 'transform 0.08s ease' : 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        ...bgStyle,
        overflow: 'hidden',
      }}
    >
      {ripple && canRotate && (
        <div style={{ position: 'absolute', inset: 0, borderRadius: r, background: 'rgba(255,255,255,0.12)', opacity: 0, transition: 'opacity 0.4s ease' }} />
      )}

      {connections.length > 0 && type !== 'wall' && type !== 'crushed' && type !== 'empty' && (
        <Pipes connections={connections} color={connColor} glow={connGlow} />
      )}

      {isGoalNode && type === 'node' && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          width: '40%', height: '40%',
          border: `2px solid ${inDanger ? 'rgba(252,165,165,0.5)' : 'rgba(134,239,172,0.5)'}`,
          borderRadius: '50%', zIndex: 1,
        }} />
      )}

      {canRotate && (
        <div style={{
          position: 'absolute', top: 3, right: 3, width: 4, height: 4, borderRadius: '50%',
          background: isHint ? '#fde68a' : inDanger ? '#fca5a5' : '#fcd34d',
          boxShadow: `0 0 4px ${isHint ? 'rgba(253,230,138,0.8)' : 'rgba(252,211,77,0.6)'}`,
        }} />
      )}

      {type === 'crushed' && (
        <div style={{ fontSize: tileSize > 40 ? 14 : 10, color: 'rgba(239,68,68,0.4)', fontWeight: 900, zIndex: 1 }}>✕</div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   OVERLAY SCREENS
═══════════════════════════════════════════════════════════════════════════ */

const overlayStyle: React.CSSProperties = {
  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center',
  background: 'rgba(6,6,15,0.92)', backdropFilter: 'blur(8px)',
  borderRadius: 18, zIndex: 10, padding: 24, textAlign: 'center',
}

const btnPrimary: React.CSSProperties = {
  padding: '12px 22px', borderRadius: 12, border: 'none',
  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
  color: '#fff', fontSize: 13, fontWeight: 800, cursor: 'pointer',
  letterSpacing: '0.06em', minHeight: 44,
  boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
}
const btnSecondary: React.CSSProperties = {
  padding: '12px 18px', borderRadius: 12, border: '1.5px solid #1e1e35',
  background: 'rgba(255,255,255,0.03)', color: '#a5b4fc',
  fontSize: 13, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.04em', minHeight: 44,
}

interface OverlayProps {
  status: string; moves: number; levelName: string
  onStart: () => void; onNext: () => void; onMenu: () => void; onRetry: () => void
  solution: { x: number; y: number; rotations: number }[] | null
  hasNext: boolean; elapsedSeconds: number
}

function Overlay({ status, moves, levelName, onStart, onNext, onMenu, onRetry, solution, hasNext, elapsedSeconds }: OverlayProps) {
  const mins = Math.floor(elapsedSeconds / 60)
  const secs = elapsedSeconds % 60
  const timeStr = elapsedSeconds > 0 ? `${mins > 0 ? mins + ':' : ''}${String(secs).padStart(2, '0')}s` : ''

  if (status === 'idle') return (
    <div style={overlayStyle}>
      <div style={{ fontSize: 11, color: '#3a3a55', letterSpacing: '0.2em', marginBottom: 8 }}>READY</div>
      <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6 }}>{levelName}</div>
      <div style={{ fontSize: 10, color: '#25253a', marginBottom: 28 }}>
        {solution ? (solution.length === 0 ? 'Already solved' : `${solution.length} move${solution.length !== 1 ? 's' : ''} to solve`) : ''}
      </div>
      <button onClick={onStart} style={btnPrimary}>START</button>
    </div>
  )
  if (status === 'won') return (
    <div style={overlayStyle}>
      <div style={{ fontSize: 32, marginBottom: 4 }}>✦</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: '#22c55e', marginBottom: 4 }}>CONNECTED</div>
      <div style={{ fontSize: 10, color: '#3a3a55', marginBottom: 20 }}>{moves} move{moves !== 1 ? 's' : ''}{timeStr ? ` · ${timeStr}` : ''}</div>
      <div style={{ display: 'flex', gap: 10 }}>
        {hasNext && <button onClick={onNext} style={btnPrimary}>NEXT →</button>}
        <button onClick={onRetry} style={btnSecondary}>↺ RETRY</button>
        <button onClick={onMenu} style={btnSecondary}>MENU</button>
      </div>
    </div>
  )
  if (status === 'lost') return (
    <div style={overlayStyle}>
      <div style={{ fontSize: 32, marginBottom: 4 }}>✕</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: '#ef4444', marginBottom: 4 }}>CRUSHED</div>
      <div style={{ fontSize: 10, color: '#3a3a55', marginBottom: 20 }}>{moves} move{moves !== 1 ? 's' : ''}</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onRetry} style={btnPrimary}>↺ RETRY</button>
        <button onClick={onMenu} style={btnSecondary}>MENU</button>
      </div>
    </div>
  )
  return null
}

/* ═══════════════════════════════════════════════════════════════════════════
   ICON BUTTON STYLE
═══════════════════════════════════════════════════════════════════════════ */

const iconBtn: React.CSSProperties = {
  width: 44, height: 44, borderRadius: 12,
  border: '1px solid #12122a', background: 'rgba(255,255,255,0.02)',
  color: '#3a3a55', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  transition: 'all 0.15s', flexShrink: 0,
}

/* ═══════════════════════════════════════════════════════════════════════════
   STAR FIELD
═══════════════════════════════════════════════════════════════════════════ */

function StarField() {
  const stars = useRef(
    Array.from({ length: 60 }, (_, i) => ({
      id: i, x: Math.random() * 100, y: Math.random() * 100,
      size: 0.5 + Math.random() * 1.5, opacity: 0.1 + Math.random() * 0.4,
    }))
  )
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {stars.current.map(s => (
        <div key={s.id} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, borderRadius: '50%', background: '#a5b4fc', opacity: s.opacity }} />
      ))}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   LEVEL GENERATOR PANEL
═══════════════════════════════════════════════════════════════════════════ */

function LevelGeneratorPanel({ onLoad }: { onLoad: (level: Level) => void }) {
  const { addGeneratedLevel, generatedLevels, deleteGeneratedLevel } = useGameStore(useShallow(s => ({
    addGeneratedLevel: s.addGeneratedLevel,
    generatedLevels: s.generatedLevels,
    deleteGeneratedLevel: s.deleteGeneratedLevel,
  })))
  const [tab, setTab] = useState<'gen' | 'saved'>('gen')
  const [gridSize, setGridSize] = useState(5)
  const [nodeCount, setNodeCount] = useState(2)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [decoysOverride, setDecoysOverride] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<{ success: boolean; moves?: number; message: string } | null>(null)

  const maxNodes = Math.floor((gridSize - 2) * (gridSize - 2) / 2)
  const diff = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' }

  const handleGenerate = async () => {
    setGenerating(true); setResult(null)
    await new Promise(r => setTimeout(r, 50))
    try {
      const decoys = decoysOverride ?? (difficulty === 'easy' ? 2 : difficulty === 'medium' ? 4 : 6)
      const level = generateLevel({ gridSize, nodeCount: Math.min(nodeCount, maxNodes), difficulty, decoys })
      if (!level) { setResult({ success: false, message: 'Generation failed — try different settings' }); setGenerating(false); return }
      const verification = verifyLevel(level)
      if (!verification.solvable) { setResult({ success: false, message: 'Generated level is not solvable' }); setGenerating(false); return }
      addGeneratedLevel(level)
      setResult({ success: true, moves: verification.minMoves ?? undefined, message: `Level created! ${verification.minMoves ? `Solvable in ${verification.minMoves} move${verification.minMoves !== 1 ? 's' : ''}` : 'Solvable!'}` })
      onLoad(level)
    } catch (e) {
      setResult({ success: false, message: `Error: ${e instanceof Error ? e.message : 'Unknown error'}` })
    }
    setGenerating(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, width: '100%' }}>
      <div style={{ display: 'flex', gap: 6, background: '#07070e', borderRadius: 12, padding: 4, border: '1px solid #12122a' }}>
        {([['gen', 'Generate'], ['saved', `Saved (${generatedLevels.length})`]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '10px 8px', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: tab === t ? '#14142a' : 'transparent',
            color: tab === t ? '#a5b4fc' : '#3a3a55',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.04em', minHeight: 44,
          }}>{label}</button>
        ))}
      </div>

      {tab === 'gen' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Grid Size */}
          <div>
            <div style={{ fontSize: 10, color: '#25253a', letterSpacing: '0.2em', marginBottom: 8 }}>GRID SIZE: {gridSize}×{gridSize}</div>
            <input type="range" min={4} max={8} value={gridSize} onChange={e => setGridSize(+e.target.value)}
              style={{ width: '100%', accentColor: '#6366f1' }} />
          </div>
          {/* Node Count */}
          <div>
            <div style={{ fontSize: 10, color: '#25253a', letterSpacing: '0.2em', marginBottom: 8 }}>NODES: {Math.min(nodeCount, maxNodes)}</div>
            <input type="range" min={2} max={Math.max(2, maxNodes)} value={Math.min(nodeCount, maxNodes)}
              onChange={e => setNodeCount(+e.target.value)} style={{ width: '100%', accentColor: '#6366f1' }} />
          </div>
          {/* Difficulty */}
          <div>
            <div style={{ fontSize: 10, color: '#25253a', letterSpacing: '0.2em', marginBottom: 8 }}>DIFFICULTY</div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['easy', 'medium', 'hard'] as const).map(d => (
                <button key={d} onClick={() => setDifficulty(d)} style={{
                  flex: 1, padding: '10px 4px', borderRadius: 10, border: `1.5px solid ${difficulty === d ? diff[d] + '60' : '#12122a'}`,
                  background: difficulty === d ? diff[d] + '12' : '#07070e', cursor: 'pointer',
                  color: difficulty === d ? diff[d] : '#3a3a55',
                  fontSize: 'clamp(10px, 2.8vw, 11px)', fontWeight: 700, letterSpacing: '0.06em',
                  transition: 'all 0.15s', textTransform: 'uppercase', minHeight: 44,
                }}>{d}</button>
              ))}
            </div>
          </div>
          {result && (
            <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600, textAlign: 'center', background: result.success ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${result.success ? '#22c55e40' : '#ef444440'}`, color: result.success ? '#22c55e' : '#ef4444' }}>
              {result.message}
            </div>
          )}
          <button onClick={handleGenerate} disabled={generating} style={{ ...btnPrimary, width: '100%', opacity: generating ? 0.7 : 1 }}>
            {generating ? 'GENERATING...' : '⚡ GENERATE LEVEL'}
          </button>
        </div>
      )}

      {tab === 'saved' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {generatedLevels.length === 0
            ? <div style={{ textAlign: 'center', padding: 32, color: '#25253a', fontSize: 13 }}>No saved levels yet</div>
            : generatedLevels.map(lvl => (
              <div key={lvl.id} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#07070e', borderRadius: 12, padding: '12px 14px', border: '1px solid #12122a' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 2 }}>{lvl.name}</div>
                  <div style={{ fontSize: 10, color: '#3a3a55' }}>{lvl.gridSize}×{lvl.gridSize} · {lvl.goalNodes.length} goals</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => onLoad(lvl)} style={{ ...btnPrimary, padding: '8px 14px', fontSize: 12 }}>Play</button>
                  <button onClick={() => deleteGeneratedLevel(lvl.id)} style={{ padding: '8px 12px', borderRadius: 10, border: '1.5px solid #ef444440', background: 'rgba(239,68,68,0.06)', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer', minHeight: 44 }}>✕</button>
                </div>
              </div>
            ))
          }
        </div>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MENU SCREEN
═══════════════════════════════════════════════════════════════════════════ */

function MenuScreen() {
  const { completedLevels, bestMoves, loadLevel, currentModeId } = useGameStore(useShallow(s => ({
    completedLevels: s.completedLevels,
    bestMoves: s.bestMoves,
    loadLevel: s.loadLevel,
    currentModeId: s.currentModeId,
  })))
  const [view, setView] = useState<'levels' | 'workshop'>('levels')
  const [world, setWorld] = useState(1)
  const [showModeModal, setShowModeModal] = useState(false)

  // Get active mode for the badge in the footer
  const activeMode = getModeById(currentModeId)

  const worldMeta: Record<number, { name: string; tagline: string; color: string; icon: string }> = {
    1: { name: 'Breathe', tagline: 'Learn the basics', color: '#22c55e', icon: '◈' },
    2: { name: 'Squeeze', tagline: 'Feel the walls', color: '#f59e0b', icon: '◆' },
    3: { name: 'Crush', tagline: 'Survive or die', color: '#ef4444', icon: '⬟' },
  }

  const totalDone = completedLevels.length
  const pct = Math.round((totalDone / LEVELS.length) * 100)

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'radial-gradient(ellipse 80% 60% at 50% -10%, #0f0f28 0%, #06060f 70%)',
      color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif',
      overflow: 'hidden',
    }}>
      <StarField />

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header style={{
        width: '100%', flexShrink: 0, zIndex: 2, position: 'relative',
        borderBottom: '1px solid #12122a',
        background: 'rgba(6,6,15,0.75)', backdropFilter: 'blur(12px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        padding: 'max(16px, env(safe-area-inset-top)) 20px 14px',
      }}>
        <div style={{
          fontSize: 'clamp(2rem, 10vw, 3.5rem)', fontWeight: 900,
          letterSpacing: '-0.06em', lineHeight: 1,
          background: 'linear-gradient(135deg, #c4b5fd 0%, #818cf8 40%, #6366f1 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
        }}>PRESSURE</div>
        <div style={{ fontSize: 10, color: '#3a3a55', letterSpacing: '0.25em', marginTop: 4 }}>PIPE PUZZLE</div>
        <div style={{ marginTop: 10, width: '100%', maxWidth: 260 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#25253a', marginBottom: 4 }}>
            <span>{totalDone}/{LEVELS.length} COMPLETE</span><span>{pct}%</span>
          </div>
          <div style={{ height: 4, background: '#0d0d1f', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #6366f1, #a5b4fc)', borderRadius: 2, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      </header>

      {/* ── NAV TABS ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', width: '100%', maxWidth: 420, flexShrink: 0, borderBottom: '1px solid #12122a', zIndex: 2, position: 'relative' }}>
        {([['levels', 'Levels'], ['workshop', 'Workshop']] as const).map(([v, label]) => (
          <button key={v} onClick={() => setView(v)} style={{
            flex: 1, padding: '13px 8px', border: 'none', cursor: 'pointer',
            background: 'transparent', color: view === v ? '#a5b4fc' : '#3a3a55',
            fontSize: 13, fontWeight: 700, letterSpacing: '0.04em',
            borderBottom: view === v ? '2px solid #6366f1' : '2px solid transparent',
            transition: 'all 0.15s', minHeight: 48,
          }}>{label}</button>
        ))}
      </div>

      {/* ── SCROLLABLE CONTENT ─────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', width: '100%', maxWidth: 420, WebkitOverflowScrolling: 'touch' as React.CSSProperties['WebkitOverflowScrolling'], position: 'relative', zIndex: 1 }}>
        <div style={{ padding: '20px 16px max(24px, env(safe-area-inset-bottom))', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {view === 'levels' && (
            <>
              {/* ── World tagline / flavour text ── */}
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <div style={{ fontSize: 'clamp(22px, 7vw, 30px)', fontWeight: 900, color: worldMeta[world].color, letterSpacing: '-0.03em', filter: `drop-shadow(0 0 16px ${worldMeta[world].color}60)` }}>
                  {worldMeta[world].icon} {worldMeta[world].name}
                </div>
                <div style={{ fontSize: 12, color: '#3a3a55', marginTop: 4, letterSpacing: '0.1em' }}>{worldMeta[world].tagline.toUpperCase()}</div>
              </div>

              {/* ── World selector ── */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[1, 2, 3].map(w => {
                  const meta = worldMeta[w]
                  const lvls = LEVELS.filter(l => l.world === w)
                  const done = lvls.filter(l => completedLevels.includes(l.id)).length
                  const active = world === w
                  return (
                    <button key={w} onClick={() => setWorld(w)} style={{
                      padding: '14px 8px', borderRadius: 14, cursor: 'pointer',
                      border: `1.5px solid ${active ? meta.color + '60' : '#12122a'}`,
                      background: active ? `${meta.color}12` : '#07070e',
                      transition: 'all 0.2s', minHeight: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                    }}>
                      <div style={{ fontSize: 20, filter: active ? `drop-shadow(0 0 8px ${meta.color}80)` : 'none' }}>{meta.icon}</div>
                      <div style={{ fontSize: 12, fontWeight: 800, color: active ? meta.color : '#3a3a55' }}>{meta.name}</div>
                      <div style={{ fontSize: 10, color: '#25253a' }}>{done}/{lvls.length}</div>
                    </button>
                  )
                })}
              </div>

              {/* ── Level grid ── */}
              <div>
                <div style={{ fontSize: 10, color: '#25253a', letterSpacing: '0.2em', marginBottom: 10, paddingLeft: 2 }}>SELECT LEVEL</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(56px, 1fr))', gap: 'clamp(8px, 2vw, 12px)' }}>
                  {LEVELS.filter(l => l.world === world).map(level => {
                    const done = completedLevels.includes(level.id)
                    const best = bestMoves[level.id]
                    const w = worldMeta[world]
                    return (
                      <button key={level.id} onClick={() => loadLevel(level)} style={{
                        aspectRatio: '1', borderRadius: 14, cursor: 'pointer',
                        border: `1.5px solid ${done ? w.color + '50' : '#12122a'}`,
                        background: done
                          ? `linear-gradient(145deg, ${w.color}18 0%, ${w.color}0a 100%)`
                          : 'linear-gradient(145deg, #0a0a16 0%, #07070e 100%)',
                        color: done ? w.color : '#2a2a3e',
                        fontSize: 'clamp(15px, 4vw, 18px)', fontWeight: 900, position: 'relative',
                        boxShadow: done ? `0 0 16px ${w.color}15` : 'none',
                        transition: 'all 0.15s', minWidth: 48, minHeight: 48,
                      }}>
                        {level.id}
                        {best !== undefined && (
                          <div style={{ position: 'absolute', top: -4, right: -4, width: 18, height: 18, borderRadius: '50%', background: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#000', fontWeight: 900, boxShadow: '0 0 8px rgba(251,191,36,0.6)' }}>★</div>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}
          {view === 'workshop' && <LevelGeneratorPanel onLoad={loadLevel} />}
        </div>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────── */}
      <footer style={{
        width: '100%', flexShrink: 0, zIndex: 2,
        borderTop: '1px solid #12122a', background: 'rgba(6,6,15,0.75)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'clamp(10px, 1.5vh, 14px) 20px max(12px, env(safe-area-inset-bottom))',
        gap: 12,
      }}>
        <div style={{ fontSize: 10, color: '#1e1e35', letterSpacing: '0.2em' }}>PRESSURE © 2025</div>

        {/* ── CHANGE MODE BUTTON ─────────────────── */}
        <button
          onClick={() => setShowModeModal(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '8px 12px', borderRadius: 10,
            border: `1px solid ${activeMode.color}40`,
            background: `${activeMode.color}10`,
            cursor: 'pointer', transition: 'all 0.2s',
          }}
        >
          <span style={{ fontSize: 14 }}>{activeMode.icon}</span>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: activeMode.color }}>
            {activeMode.name.toUpperCase()}
          </span>
          <span style={{ fontSize: 9, color: activeMode.color + '80' }}>▼</span>
        </button>
      </footer>

      {/* ── MODE SELECTOR MODAL ─────────────────────────────────── */}
      <ModeSelectorModal
        visible={showModeModal}
        onClose={() => setShowModeModal(false)}
      />
    </div>
  )
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN GAME BOARD COMPONENT
═══════════════════════════════════════════════════════════════════════════ */

export default function GameBoard() {
  const {
    currentLevel, tiles, wallOffset, compressionActive,
    moves, status, elapsedSeconds, screenShake,
    timeUntilCompression, wallsJustAdvanced,
    loadLevel, startGame, tapTile,
    restartLevel, goToMenu, undoMove,
    completeTutorial, showTutorial,
    generatedLevels, history,
  } = useGameStore(useShallow(s => ({
    currentLevel: s.currentLevel,
    tiles: s.tiles,
    wallOffset: s.wallOffset,
    compressionActive: s.compressionActive,
    moves: s.moves,
    status: s.status,
    elapsedSeconds: s.elapsedSeconds,
    screenShake: s.screenShake,
    timeUntilCompression: s.timeUntilCompression,
    wallsJustAdvanced: s.wallsJustAdvanced,
    loadLevel: s.loadLevel,
    startGame: s.startGame,
    tapTile: s.tapTile,
    restartLevel: s.restartLevel,
    goToMenu: s.goToMenu,
    undoMove: s.undoMove,
    completeTutorial: s.completeTutorial,
    showTutorial: s.showTutorial,
    generatedLevels: s.generatedLevels,
    history: s.history,
  })))

  const particleRef = useRef<ParticleSystemHandle>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const [showHint, setShowHint] = useState(false)
  const { w: vw, h: vh } = useViewport()

  const allLevels = [...LEVELS, ...generatedLevels]
  const solution = currentLevel ? getSolution(currentLevel) : null

  useEffect(() => {
    if (status === 'won' && boardRef.current) {
      const rect = boardRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      for (let i = 0; i < 8; i++) {
        setTimeout(() => {
          particleRef.current?.burst(
            cx + (Math.random() - .5) * 120, cy + (Math.random() - .5) * 100,
            i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#a5b4fc' : '#fbbf24', 14,
            i % 2 === 0 ? 'star' : 'circle'
          )
        }, i * 80)
      }
    }
  }, [status])

  const handleTileTap = useCallback((x: number, y: number) => {
    if (status !== 'playing') return
    const tile = tiles.find(t => t.x === x && t.y === y)
    if (!tile?.canRotate) return
    if (boardRef.current && currentLevel) {
      const rect = boardRef.current.getBoundingClientRect()
      const gs = currentLevel.gridSize
      const px = rect.left + (x + 0.5) * (rect.width / gs)
      const py = rect.top + (y + 0.5) * (rect.height / gs)
      particleRef.current?.burst(px, py, '#f59e0b', 5)
    }
    tapTile(x, y)
  }, [status, tiles, currentLevel, tapTile])

  const tileMap = useMemo(() => {
    const map = new Map<string, typeof tiles[0]>()
    for (const tile of tiles) map.set(`${tile.x},${tile.y}`, tile)
    return map
  }, [tiles])

  // CHANGE 3: Only check status for tutorial, not showTutorial
  if (status === 'tutorial') return <TutorialScreen onComplete={completeTutorial} />
  if (status === 'menu' || !currentLevel) return <MenuScreen />

  const gs = currentLevel.gridSize
  const maxOff = Math.floor(gs / 2)
  const comprPct = Math.round((wallOffset / maxOff) * 100)
  const hintPos = showHint && solution?.length ? solution[0] : null
  const nextLevel = allLevels.find(l => l.id === currentLevel.id + 1) ?? null

  // Responsive board: header ~62px + stats ~52px + footer ~62px + gaps ~24px = ~200px
  const reserved = 200
  const maxByWidth = Math.min(vw * 0.94, 440)
  const maxByHeight = Math.max(vh - reserved, 160)
  const boardPx = Math.min(maxByWidth, maxByHeight)
  const gap = gs > 5 ? 3 : 4
  const padding = gs > 5 ? 8 : 10
  const tileSize = Math.floor((boardPx - padding * 2 - gap * (gs - 1)) / gs)

  const mins = Math.floor(elapsedSeconds / 60)
  const secs = elapsedSeconds % 60
  const timeStr = status === 'playing' ? `${mins > 0 ? mins + ':' : ''}${String(secs).padStart(2, '0')}` : ''
  const countdownSecs = Math.ceil(timeUntilCompression / 1000)

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'radial-gradient(ellipse 70% 50% at 50% -5%, #0d0d22 0%, #06060f 100%)',
      color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif',
      userSelect: 'none', WebkitUserSelect: 'none',
      overflow: 'hidden',
      transform: screenShake ? 'translateX(-4px)' : 'none',
      transition: screenShake ? 'none' : 'transform 0.05s ease',
    }}>
      <StarField />

      {/* Particles — isolated component, won't re-render the rest of the board */}
      <ParticleLayer ref={particleRef} />

      {/* ── HEADER ──────────────────────────────────────────────── */}
      <header style={{
        width: '100%', flexShrink: 0, position: 'relative', zIndex: 10,
        borderBottom: '1px solid #0e0e22',
        background: 'rgba(6,6,15,0.85)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: 'max(10px, env(safe-area-inset-top)) 12px 10px',
        gap: 8,
      }}>
        <button onClick={goToMenu} style={iconBtn} title="Menu">
          <span style={{ fontSize: 16 }}>←</span>
        </button>
        <div style={{ textAlign: 'center', flex: 1, minWidth: 0, padding: '0 8px' }}>
          <div style={{ fontSize: 'clamp(14px, 4vw, 18px)', fontWeight: 900, letterSpacing: '-0.02em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {currentLevel.name}
          </div>
          <div style={{ fontSize: 'clamp(9px, 2.5vw, 10px)', color: '#25253a', letterSpacing: '0.15em', marginTop: 2 }}>
            LEVEL {currentLevel.id}{currentLevel.isGenerated ? ' · CUSTOM' : ''}
          </div>
        </div>
        <button onClick={restartLevel} style={iconBtn} title="Restart">
          <span style={{ fontSize: 16 }}>↺</span>
        </button>
      </header>

      {/* ── STATS ROW ───────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 'clamp(6px, 2vw, 12px)',
        width: '100%', maxWidth: 460, flexShrink: 0,
        padding: 'clamp(6px, 1.5vh, 10px) 12px',
        position: 'relative', zIndex: 1,
      }}>
        {/* Moves counter */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: '#07070e', border: '1px solid #12122a', borderRadius: 12,
          padding: 'clamp(6px, 1.5vw, 10px) clamp(10px, 3vw, 16px)', flexShrink: 0, minWidth: 52,
        }}>
          <div style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{moves}</div>
          <div style={{ fontSize: 'clamp(8px, 2.2vw, 9px)', color: '#3a3a55', letterSpacing: '0.1em', marginTop: 3 }}>/ {currentLevel.maxMoves}</div>
        </div>

        {/* Compression bar */}
        <CompressionBar percent={comprPct} active={compressionActive} />

        {/* Countdown timer */}
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          background: '#07070e', border: '1px solid #12122a', borderRadius: 12,
          padding: 'clamp(6px, 1.5vw, 10px) clamp(10px, 3vw, 16px)', flexShrink: 0, minWidth: 52,
        }}>
          <div style={{
            fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums',
            color: countdownSecs <= 3 && compressionActive ? '#ef4444' : '#fff', transition: 'color 0.2s',
          }}>{countdownSecs}</div>
          <div style={{ fontSize: 'clamp(8px, 2.2vw, 9px)', color: '#3a3a55', letterSpacing: '0.1em', marginTop: 3 }}>SEC</div>
        </div>
      </div>

      {/* ── GAME BOARD — centered in flex-1 container ────────────── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: '100%', position: 'relative', zIndex: 1,
        padding: '4px 0',
      }}>
        <div
          ref={boardRef}
          style={{
            position: 'relative',
            width: boardPx, height: boardPx,
            background: 'linear-gradient(145deg, #0a0a16, #07070e)',
            borderRadius: 18, padding,
            border: `2px solid ${wallsJustAdvanced ? '#ef444480' : '#12122a'}`,
            boxShadow: wallsJustAdvanced
              ? '0 0 40px rgba(239,68,68,0.3), inset 0 0 40px rgba(239,68,68,0.05)'
              : '0 0 60px rgba(0,0,0,0.8), inset 0 0 40px rgba(0,0,0,0.2)',
            transition: 'border-color 0.3s, box-shadow 0.3s',
            flexShrink: 0,
          }}
        >
          {/* Tile grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gs}, 1fr)`,
            gridTemplateRows: `repeat(${gs}, 1fr)`,
            gap, width: '100%', height: '100%',
          }}>
            {Array.from({ length: gs * gs }, (_, i) => {
              const x = i % gs
              const y = Math.floor(i / gs)
              const tile = tileMap.get(`${x},${y}`)
              const dist = Math.min(x, y, gs - 1 - x, gs - 1 - y)
              const inDanger = compressionActive && dist <= wallOffset && !!tile && tile.type !== 'wall' && tile.type !== 'crushed'
              const isHint = hintPos?.x === x && hintPos?.y === y
              return (
                <GameTile
                  key={`${x}-${y}`}
                  type={tile?.type || 'empty'}
                  connections={tile?.connections || []}
                  canRotate={tile?.canRotate || false}
                  isGoalNode={tile?.isGoalNode || false}
                  isHint={isHint}
                  inDanger={inDanger}
                  justRotated={tile?.justRotated}
                  onClick={() => handleTileTap(x, y)}
                  tileSize={tileSize}
                />
              )
            })}
          </div>

          {/* Animated Walls Overlay — The "Pressure Effect" */}
          {status === 'playing' && wallOffset > 0 && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: `${(wallOffset / gs) * 100}%`, background: 'linear-gradient(180deg, rgba(239,68,68,0.15) 0%, transparent 100%)', borderBottom: '2px solid rgba(239,68,68,0.3)', transform: wallsJustAdvanced ? 'translateY(2px)' : 'translateY(0)', transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: wallsJustAdvanced ? '0 4px 20px rgba(239,68,68,0.4)' : 'none' }} />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: `${(wallOffset / gs) * 100}%`, background: 'linear-gradient(0deg, rgba(239,68,68,0.15) 0%, transparent 100%)', borderTop: '2px solid rgba(239,68,68,0.3)', transform: wallsJustAdvanced ? 'translateY(-2px)' : 'translateY(0)', transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: wallsJustAdvanced ? '0 -4px 20px rgba(239,68,68,0.4)' : 'none' }} />
              <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${(wallOffset / gs) * 100}%`, background: 'linear-gradient(90deg, rgba(239,68,68,0.15) 0%, transparent 100%)', borderRight: '2px solid rgba(239,68,68,0.3)', transform: wallsJustAdvanced ? 'translateX(2px)' : 'translateX(0)', transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: wallsJustAdvanced ? '4px 0 20px rgba(239,68,68,0.4)' : 'none' }} />
              <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: `${(wallOffset / gs) * 100}%`, background: 'linear-gradient(270deg, rgba(239,68,68,0.15) 0%, transparent 100%)', borderLeft: '2px solid rgba(239,68,68,0.3)', transform: wallsJustAdvanced ? 'translateX(-2px)' : 'translateX(0)', transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)', boxShadow: wallsJustAdvanced ? '-4px 0 20px rgba(239,68,68,0.4)' : 'none' }} />
            </div>
          )}

          {/* Overlay screens */}
          <Overlay
            status={status} moves={moves} levelName={currentLevel.name}
            onStart={startGame} onNext={() => nextLevel && loadLevel(nextLevel)}
            onMenu={goToMenu} onRetry={restartLevel}
            solution={solution} hasNext={!!nextLevel} elapsedSeconds={elapsedSeconds}
          />
        </div>
      </div>

      {/* ── FOOTER / CONTROLS ───────────────────────────────────── */}
      <footer style={{
        width: '100%', flexShrink: 0, position: 'relative', zIndex: 10,
        borderTop: '1px solid #0e0e22',
        background: 'rgba(6,6,15,0.85)', backdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        gap: 'clamp(10px, 3vw, 20px)',
        padding: 'clamp(8px, 1.5vh, 12px) 16px max(10px, env(safe-area-inset-bottom))',
      }}>
        {/* Undo */}
        <button onClick={undoMove} disabled={history.length === 0 || status !== 'playing'}
          style={{ ...iconBtn, opacity: history.length === 0 || status !== 'playing' ? 0.25 : 1 }} title="Undo">
          <span style={{ fontSize: 18 }}>⌫</span>
        </button>

        {/* Timer display */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 48 }}>
          <div style={{ fontSize: 'clamp(14px, 4vw, 18px)', fontWeight: 900, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>
            {timeStr || '—'}
          </div>
          <div style={{ fontSize: 9, color: '#25253a', letterSpacing: '0.12em' }}>TIME</div>
        </div>

        {/* Hint */}
        <button
          onClick={() => setShowHint(h => !h)}
          disabled={!solution?.length || status !== 'playing'}
          style={{
            ...iconBtn,
            opacity: !solution?.length || status !== 'playing' ? 0.25 : 1,
            color: showHint ? '#fbbf24' : '#3a3a55',
            border: showHint ? '1px solid #fbbf2440' : '1px solid #12122a',
          }}
          title="Hint"
        >
          <span style={{ fontSize: 16 }}>💡</span>
        </button>
      </footer>
    </div>
  )
}
