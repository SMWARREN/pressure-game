import { useState, useEffect, useRef, useCallback } from 'react'
import { useGameStores } from '../game/store'
import { LEVELS, getSolution, generateLevel, verifyLevel } from '../game/levels'
import { Level } from '../game/types'
import TutorialScreen from './TutorialScreen'

/* ─────────────────────────────────────────
   Particle System
───────────────────────────────────────── */
interface Particle {
  id: number; x: number; y: number; vx: number; vy: number
  color: string; size: number; life: number; maxLife: number
  shape: 'circle' | 'star'
}

let pid = 0
function useParticles() {
  const [particles, setParticles] = useState<Particle[]>([])
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(now - last, 32)
      last = now
      setParticles(prev => {
        const next = prev
          .map(p => ({ ...p, x: p.x + p.vx * dt, y: p.y + p.vy * dt, vy: p.vy + 0.0004 * dt, life: p.life - dt }))
          .filter(p => p.life > 0)
        return next.length === prev.length ? prev : next
      })
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])

  const burst = useCallback((x: number, y: number, color: string, count = 8, shape: 'circle' | 'star' = 'circle') => {
    const ps: Particle[] = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2
      const speed = 0.1 + Math.random() * 0.25
      return {
        id: pid++, x, y,
        vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed - 0.15,
        color, size: 3 + Math.random() * 5,
        life: 500 + Math.random() * 400, maxLife: 900, shape,
      }
    })
    setParticles(prev => [...prev, ...ps])
  }, [])

  return { particles, burst }
}

/* ─────────────────────────────────────────
   Compression Bar
───────────────────────────────────────── */
function CompressionBar({ percent, active }: { percent: number; active: boolean }) {
  const color = percent < 30 ? '#22c55e' : percent < 60 ? '#f59e0b' : percent < 85 ? '#ef4444' : '#dc2626'
  const glow = percent < 30 ? 'rgba(34,197,94,0.5)' : percent < 60 ? 'rgba(245,158,11,0.5)' : 'rgba(239,68,68,0.6)'
  const label = percent < 30 ? 'STABLE' : percent < 60 ? 'PRESSURE' : percent < 85 ? 'CRITICAL' : 'COLLAPSE'
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 8, color: '#1e1e2e', letterSpacing: '0.15em' }}>COMPRESSION</span>
        <span style={{ fontSize: 8, color: active ? color : '#3a3a55', fontWeight: 800, transition: 'color 0.3s' }}>{label}</span>
      </div>
      <div style={{ height: 6, background: '#080814', borderRadius: 4, overflow: 'hidden', border: '1px solid #131325' }}>
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

/* ─────────────────────────────────────────
   Pipes
───────────────────────────────────────── */
function Pipes({ connections, color, glow }: { connections: string[]; color: string; glow: string }) {
  return (
    <>
      {connections.includes('up') && <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 5, height: '53%', background: color, borderRadius: '3px 3px 0 0', boxShadow: `0 0 6px ${glow}` }} />}
      {connections.includes('down') && <div style={{ position: 'absolute', bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 5, height: '53%', background: color, borderRadius: '0 0 3px 3px', boxShadow: `0 0 6px ${glow}` }} />}
      {connections.includes('left') && <div style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', height: 5, width: '53%', background: color, borderRadius: '3px 0 0 3px', boxShadow: `0 0 6px ${glow}` }} />}
      {connections.includes('right') && <div style={{ position: 'absolute', right: 0, top: '50%', transform: 'translateY(-50%)', height: 5, width: '53%', background: color, borderRadius: '0 3px 3px 0', boxShadow: `0 0 6px ${glow}` }} />}
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 8, height: 8, background: color, borderRadius: '50%', boxShadow: `0 0 8px ${glow}` }} />
    </>
  )
}

/* ─────────────────────────────────────────
   GameTile
───────────────────────────────────────── */
function GameTile({
  type, connections, canRotate, isGoalNode, isHint, inDanger, justRotated, onClick, tileSize
}: {
  type: string; connections: string[]; canRotate: boolean
  isGoalNode: boolean; isHint: boolean; inDanger: boolean
  justRotated?: boolean; onClick: () => void; tileSize: number
}) {
  const [pressed, setPressed] = useState(false)
  const [ripple, setRipple] = useState(false)

  const handleClick = () => {
    if (!canRotate) return
    setPressed(true); setRipple(true)
    setTimeout(() => setPressed(false), 150)
    setTimeout(() => setRipple(false), 400)
    onClick()
  }

  const r = tileSize > 50 ? 8 : 6

  const bgStyle = (() => {
    if (type === 'wall') return { background: 'linear-gradient(145deg, #0e0e1c 0%, #090912 100%)', border: '1px solid #131325' }
    if (type === 'crushed') return { background: 'linear-gradient(145deg, #1a0000 0%, #0d0000 100%)', border: '1px solid #2a0505', boxShadow: 'inset 0 0 12px rgba(239,68,68,0.15)' }
    if (type === 'node') return {
      background: inDanger ? 'linear-gradient(145deg, #3d0808 0%, #2d0606 100%)' : 'linear-gradient(145deg, #14532d 0%, #0f3d21 100%)',
      border: `2px solid ${inDanger ? '#ef4444' : isHint ? '#86efac' : '#22c55e'}`,
      boxShadow: inDanger ? '0 0 20px rgba(239,68,68,0.5)' : '0 0 14px rgba(34,197,94,0.25)',
    }
    if (type === 'path' && canRotate) return {
      background: isHint ? 'linear-gradient(145deg, #7c5c00 0%, #5c4400 100%)' : inDanger ? 'linear-gradient(145deg, #5c1a1a 0%, #3d1010 100%)' : 'linear-gradient(145deg, #78350f 0%, #5c2a0a 100%)',
      border: `2px solid ${isHint ? '#fde68a' : inDanger ? '#ef4444' : '#f59e0b'}`,
      boxShadow: isHint ? '0 0 18px rgba(253,230,138,0.6)' : inDanger ? '0 0 14px rgba(239,68,68,0.4)' : '0 0 8px rgba(245,158,11,0.18)',
    }
    if (type === 'path') return { background: 'linear-gradient(145deg, #1e3060 0%, #172349 100%)', border: '1.5px solid #2a4080', boxShadow: '0 0 6px rgba(59,130,246,0.12)' }
    return { background: 'rgba(10,10,20,0.3)' }
  })()

  const connColor = type === 'node' ? (inDanger ? 'rgba(252,165,165,0.9)' : 'rgba(134,239,172,0.95)')
    : canRotate ? (isHint ? 'rgba(253,230,138,0.95)' : inDanger ? 'rgba(252,165,165,0.9)' : 'rgba(252,211,77,0.92)')
    : 'rgba(147,197,253,0.85)'

  const connGlow = type === 'node' ? (inDanger ? 'rgba(239,68,68,0.6)' : 'rgba(34,197,94,0.5)')
    : canRotate ? (isHint ? 'rgba(253,230,138,0.7)' : 'rgba(245,158,11,0.5)')
    : 'rgba(59,130,246,0.4)'

  return (
    <div onClick={handleClick} style={{
      borderRadius: r, position: 'relative',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      cursor: canRotate ? 'pointer' : 'default',
      transform: pressed ? 'scale(0.84)' : justRotated ? 'scale(1.08)' : 'scale(1)',
      transition: pressed ? 'transform 0.08s ease' : 'transform 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      ...bgStyle, overflow: 'hidden',
    }}>
      {ripple && canRotate && <div style={{ position: 'absolute', inset: 0, borderRadius: r, background: 'rgba(255,255,255,0.12)', opacity: 0, transition: 'opacity 0.4s ease' }} />}
      {connections.length > 0 && type !== 'wall' && type !== 'crushed' && type !== 'empty' && <Pipes connections={connections} color={connColor} glow={connGlow} />}
      {isGoalNode && type === 'node' && <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '40%', height: '40%', border: `2px solid ${inDanger ? 'rgba(252,165,165,0.5)' : 'rgba(134,239,172,0.5)'}`, borderRadius: '50%', zIndex: 1 }} />}
      {canRotate && <div style={{ position: 'absolute', top: 3, right: 3, width: 4, height: 4, borderRadius: '50%', background: isHint ? '#fde68a' : inDanger ? '#fca5a5' : '#fcd34d', boxShadow: `0 0 4px ${isHint ? 'rgba(253,230,138,0.8)' : 'rgba(252,211,77,0.6)'}` }} />}
      {type === 'crushed' && <div style={{ fontSize: tileSize > 40 ? 14 : 10, color: 'rgba(239,68,68,0.4)', fontWeight: 900, zIndex: 1 }}>✕</div>}
    </div>
  )
}

/* ─────────────────────────────────────────
   Overlay
───────────────────────────────────────── */
const overlayBase: React.CSSProperties = {
  position: 'absolute', inset: 0, borderRadius: 18, zIndex: 10,
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
  background: 'rgba(4,4,12,0.88)', backdropFilter: 'blur(6px)', color: '#fff',
}
const btnPrimary: React.CSSProperties = {
  padding: '12px 28px', fontSize: 13, fontWeight: 800, letterSpacing: '0.04em',
  border: 'none', borderRadius: 12, cursor: 'pointer',
  background: 'linear-gradient(135deg, #22c55e, #16a34a)',
  color: '#fff', boxShadow: '0 4px 20px rgba(34,197,94,0.35)',
}
const btnGhost: React.CSSProperties = {
  padding: '12px 18px', fontSize: 13, fontWeight: 600, borderRadius: 12, cursor: 'pointer',
  border: '1px solid #1e1e2e', background: 'rgba(255,255,255,0.02)', color: '#555',
}

function Overlay({ status, moves, levelName, onStart, onNext, onMenu, onRetry, solution, hasNext, elapsedSeconds }: {
  status: string; moves: number; levelName: string
  onStart: () => void; onNext: () => void; onMenu: () => void; onRetry: () => void
  solution: { x: number; y: number; rotations: number }[] | null; hasNext: boolean; elapsedSeconds: number
}) {
  const mins = Math.floor(elapsedSeconds / 60)
  const secs = elapsedSeconds % 60
  const timeStr = elapsedSeconds > 0 ? `${mins > 0 ? mins + ':' : ''}${String(secs).padStart(2, '0')}s` : ''

  if (status === 'idle') return (
    <div style={overlayBase}>
      <div style={{ fontSize: 11, color: '#3a3a55', letterSpacing: '0.2em', marginBottom: 8 }}>READY</div>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#a5b4fc', marginBottom: 6 }}>{levelName}</div>
      {solution && <div style={{ fontSize: 10, color: '#25253a', marginBottom: 20 }}>Par: {solution.reduce((s, p) => s + p.rotations, 0)} moves</div>}
      <button onClick={onStart} style={{ ...btnPrimary, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', boxShadow: '0 0 30px rgba(99,102,241,0.4)' }}>START</button>
    </div>
  )

  if (status === 'won') return (
    <div style={{ ...overlayBase, background: 'rgba(4,12,4,0.9)' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>✦</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: '#22c55e', marginBottom: 6 }}>CONNECTED</div>
      <div style={{ fontSize: 12, color: '#3a3a55', marginBottom: 20 }}>{moves} moves{timeStr ? ` · ${timeStr}` : ''}</div>
      <div style={{ display: 'flex', gap: 10 }}>
        {hasNext && <button onClick={onNext} style={btnPrimary}>NEXT →</button>}
        <button onClick={onMenu} style={btnGhost}>Menu</button>
        <button onClick={onRetry} style={btnGhost}>↺</button>
      </div>
    </div>
  )

  if (status === 'lost') return (
    <div style={{ ...overlayBase, background: 'rgba(12,4,4,0.9)' }}>
      <div style={{ fontSize: 28, marginBottom: 8 }}>☠</div>
      <div style={{ fontSize: 20, fontWeight: 900, color: '#ef4444', marginBottom: 6 }}>CRUSHED</div>
      <div style={{ fontSize: 10, color: '#3a3a55', marginBottom: 20 }}>The walls got you</div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onRetry} style={{ ...btnPrimary, background: 'linear-gradient(135deg,#dc2626,#991b1b)', boxShadow: '0 4px 20px rgba(239,68,68,0.35)' }}>RETRY</button>
        <button onClick={onMenu} style={btnGhost}>Menu</button>
      </div>
    </div>
  )

  return null
}

/* ─────────────────────────────────────────
   Star Field
───────────────────────────────────────── */
function StarField() {
  const stars = useRef(Array.from({ length: 60 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    size: 0.5 + Math.random() * 1.5, opacity: 0.1 + Math.random() * 0.4,
  })))
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      {stars.current.map(s => (
        <div key={s.id} style={{ position: 'absolute', left: `${s.x}%`, top: `${s.y}%`, width: s.size, height: s.size, borderRadius: '50%', background: '#a5b4fc', opacity: s.opacity }} />
      ))}
    </div>
  )
}

/* ─────────────────────────────────────────
   Level Generator Panel
───────────────────────────────────────── */
function LevelGeneratorPanel({ onLoad }: { onLoad: (level: Level) => void }) {
  const { addGeneratedLevel, deleteGeneratedLevel, generatedLevels } = useGameStore()
  const [gridSize, setGridSize] = useState(5)
  const [nodeCount, setNodeCount] = useState(3)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const [generating, setGenerating] = useState(false)
  const [result, setResult] = useState<{ level: Level; valid: boolean; minMoves: number } | null>(null)
  const [tab, setTab] = useState<'gen' | 'saved'>('gen')
  const [decoysOverride, setDecoysOverride] = useState<boolean | null>(null)

  const maxNodes = Math.min(6, Math.floor((gridSize - 2) * (gridSize - 2) / 2))
  const diff = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444' }
  const effectiveDecoys = decoysOverride !== null ? decoysOverride : difficulty !== 'easy'

  const handleGenerate = async () => {
    setGenerating(true)
    setResult(null)
    await new Promise(r => setTimeout(r, 0))
    await new Promise(r => requestAnimationFrame(r))
    try {
      const level = generateLevel({
        gridSize,
        nodeCount: Math.min(nodeCount, maxNodes),
        difficulty,
        decoys: decoysOverride !== null ? decoysOverride : undefined,
      })
      const check = verifyLevel(level)
      setResult({ level, valid: check.solvable, minMoves: check.minMoves })
    } catch {
      setResult(null)
    }
    setGenerating(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 310 }}>
      {/* Sub-tabs */}
      <div style={{ display: 'flex', background: '#07070e', borderRadius: 10, padding: 3, border: '1px solid #12122a', gap: 2 }}>
        {([['gen', '⚡ Generate'], ['saved', `💾 Saved (${generatedLevels.length})`]] as const).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '8px 0', borderRadius: 8, border: 'none', cursor: 'pointer',
            background: tab === t ? '#14142a' : 'transparent',
            color: tab === t ? '#a5b4fc' : '#3a3a55',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {tab === 'gen' && (
        <>
          <div style={{ background: '#07070e', borderRadius: 14, padding: 18, border: '1px solid #12122a', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Grid size */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, letterSpacing: '0.12em', marginBottom: 8 }}>
                <span style={{ color: '#3a3a55' }}>GRID SIZE</span>
                <span style={{ color: '#a5b4fc', fontWeight: 800 }}>{gridSize} × {gridSize}</span>
              </div>
              <input type="range" min={4} max={7} value={gridSize}
                onChange={e => { setGridSize(+e.target.value); setResult(null) }}
                style={{ width: '100%', accentColor: '#6366f1', height: 4 }} />
            </div>

            {/* Node count */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, letterSpacing: '0.12em', marginBottom: 8 }}>
                <span style={{ color: '#3a3a55' }}>GOAL NODES</span>
                <span style={{ color: '#22c55e', fontWeight: 800 }}>{Math.min(nodeCount, maxNodes)}</span>
              </div>
              <input type="range" min={2} max={maxNodes} value={Math.min(nodeCount, maxNodes)}
                onChange={e => { setNodeCount(+e.target.value); setResult(null) }}
                style={{ width: '100%', accentColor: '#22c55e', height: 4 }} />
            </div>

            {/* Difficulty */}
            <div>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', color: '#3a3a55', marginBottom: 8 }}>DIFFICULTY</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {(['easy', 'medium', 'hard'] as const).map(d => (
                  <button key={d} onClick={() => { setDifficulty(d); setResult(null); setDecoysOverride(null) }} style={{
                    flex: 1, padding: '9px 0', borderRadius: 9, cursor: 'pointer',
                    border: `1px solid ${difficulty === d ? diff[d] + '80' : '#1a1a2e'}`,
                    background: difficulty === d ? `${diff[d]}15` : 'rgba(255,255,255,0.01)',
                    color: difficulty === d ? diff[d] : '#2a2a3e',
                    fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', transition: 'all 0.15s',
                  }}>{d}</button>
                ))}
              </div>
            </div>

            {/* Decoys */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 10, letterSpacing: '0.12em', color: '#3a3a55' }}>DECOY TILES</div>
                  <div style={{ fontSize: 9, color: '#25253a', marginTop: 2 }}>{effectiveDecoys ? `${difficulty === 'hard' ? 3 : 2} fake paths` : 'off'}</div>
                </div>
                <button onClick={() => {
                  if (decoysOverride === null) setDecoysOverride(true)
                  else if (decoysOverride === true) setDecoysOverride(false)
                  else setDecoysOverride(null)
                  setResult(null)
                }} style={{
                  padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 10, fontWeight: 700,
                  border: `1px solid ${decoysOverride === null ? '#3a3a55' : decoysOverride ? '#f59e0b80' : '#2a2a3e'}`,
                  background: decoysOverride === null ? 'transparent' : decoysOverride ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.02)',
                  color: decoysOverride === null ? '#3a3a55' : decoysOverride ? '#f59e0b' : '#2a2a3e', transition: 'all 0.15s',
                }}>{decoysOverride === null ? 'AUTO' : decoysOverride ? 'ON' : 'OFF'}</button>
              </div>
            </div>
          </div>

          <button onClick={handleGenerate} disabled={generating} style={{
            padding: '14px 0', borderRadius: 12, border: 'none',
            cursor: generating ? 'wait' : 'pointer',
            background: generating ? '#0e0e1e' : 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: generating ? '#333' : '#fff',
            fontSize: 13, fontWeight: 800, letterSpacing: '0.06em',
            boxShadow: generating ? 'none' : '0 4px 24px rgba(99,102,241,0.4)', transition: 'all 0.2s',
          }}>{generating ? '⟳  GENERATING...' : '⚡  GENERATE LEVEL'}</button>

          {result && (
            <div style={{ background: '#07070e', borderRadius: 12, padding: 16, border: `1px solid ${result.valid ? '#22c55e20' : '#ef444420'}` }}>
              <div style={{ marginBottom: 12 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: result.valid ? '#22c55e' : '#ef4444' }}>
                  {result.valid ? '✓ Valid & Solvable' : '✗ Unsolvable'}
                </div>
                {result.valid && <div style={{ fontSize: 10, color: '#3a3a55', marginTop: 3 }}>Min {result.minMoves} rotation{result.minMoves !== 1 ? 's' : ''} to solve</div>}
              </div>
              {result.valid ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => onLoad(result.level)} style={{ flex: 1, padding: '10px 0', borderRadius: 9, cursor: 'pointer', border: '1px solid #6366f180', background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontSize: 12, fontWeight: 700 }}>▶ Play Now</button>
                  <button onClick={() => { addGeneratedLevel(result.level); setResult(null) }} style={{ flex: 1, padding: '10px 0', borderRadius: 9, cursor: 'pointer', border: '1px solid #22c55e80', background: 'rgba(34,197,94,0.08)', color: '#4ade80', fontSize: 12, fontWeight: 700 }}>💾 Save</button>
                </div>
              ) : (
                <button onClick={handleGenerate} style={{ width: '100%', padding: '10px 0', borderRadius: 9, cursor: 'pointer', border: '1px solid #6366f180', background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontSize: 12, fontWeight: 700 }}>Try Again</button>
              )}
            </div>
          )}
        </>
      )}

      {tab === 'saved' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {generatedLevels.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 0', color: '#25253a', fontSize: 12 }}>
              No saved levels yet.<br /><span style={{ color: '#3a3a55' }}>Generate one and save it!</span>
            </div>
          ) : (
            generatedLevels.map(lvl => (
              <div key={lvl.id} style={{ background: '#07070e', borderRadius: 12, padding: '12px 14px', border: '1px solid #12122a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lvl.name}</div>
                  <div style={{ fontSize: 9, color: '#3a3a55', marginTop: 3 }}>{lvl.gridSize}×{lvl.gridSize} · {lvl.goalNodes.length} nodes</div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => onLoad(lvl)} style={{ padding: '7px 12px', borderRadius: 8, border: '1px solid #6366f180', background: 'rgba(99,102,241,0.1)', color: '#818cf8', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Play</button>
                  <button onClick={() => deleteGeneratedLevel(lvl.id)} style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #ef444430', background: 'rgba(239,68,68,0.06)', color: '#ef4444', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✕</button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────
   Menu Screen
───────────────────────────────────────── */
const worldMeta: Record<number, { name: string; tagline: string; color: string; icon: string }> = {
  1: { name: 'Breathe', tagline: 'Learn the basics', color: '#22c55e', icon: '◈' },
  2: { name: 'Squeeze', tagline: 'Feel the walls', color: '#f59e0b', icon: '◆' },
  3: { name: 'Crush', tagline: 'Survive or die', color: '#ef4444', icon: '⬟' },
}

function MenuScreen() {
  const { completedLevels, bestMoves, loadLevel, generatedLevels } = useGameStore()
  const [view, setView] = useState<'levels' | 'workshop'>('levels')
  const [world, setWorld] = useState(1)
  const totalDone = completedLevels.length
  const pct = Math.round((totalDone / LEVELS.length) * 100)

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      background: 'radial-gradient(ellipse 80% 60% at 50% -10%, #0f0f28 0%, #06060f 70%)',
      color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif',
      overflowY: 'auto', padding: '40px 20px 56px',
    }}>
      <StarField />

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 36, position: 'relative', zIndex: 1 }}>
        <div style={{
          fontSize: 'clamp(3rem, 14vw, 5rem)', fontWeight: 900,
          letterSpacing: '-0.06em', lineHeight: 0.95,
          background: 'linear-gradient(135deg, #c4b5fd 0%, #818cf8 35%, #6366f1 65%, #4f46e5 100%)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          marginBottom: 10, filter: 'drop-shadow(0 0 40px rgba(99,102,241,0.3))',
        }}>PRESSURE</div>
        <div style={{ fontSize: 10, color: '#2a2a45', letterSpacing: '0.35em', marginBottom: 16 }}>CONNECT · BEFORE · CRUSH</div>
        <div style={{ width: 200, margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#2a2a3e', marginBottom: 5 }}>
            <span>PROGRESS</span><span>{totalDone}/{LEVELS.length}</span>
          </div>
          <div style={{ height: 3, background: '#0e0e1c', borderRadius: 2 }}>
            <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg, #6366f1, #22c55e)', borderRadius: 2, transition: 'width 1s ease' }} />
          </div>
        </div>
      </div>

      {/* Nav tabs */}
      <div style={{ display: 'flex', background: '#07070e', borderRadius: 12, padding: 4, border: '1px solid #12122a', marginBottom: 28, gap: 2, position: 'relative', zIndex: 1 }}>
        {([['levels', '📋 Levels'], ['workshop', '⚡ Workshop']] as const).map(([v, label]) => (
          <button key={v} onClick={() => setView(v as typeof view)} style={{
            padding: '10px 24px', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: view === v ? '#14142a' : 'transparent',
            color: view === v ? (v === 'workshop' ? '#a5b4fc' : '#fff') : '#3a3a55',
            fontSize: 12, fontWeight: 700, letterSpacing: '0.02em', transition: 'all 0.15s',
          }}>{label}</button>
        ))}
      </div>

      {view === 'levels' && (
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 340 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 22 }}>
            {([1, 2, 3] as const).map(w => {
              const meta = worldMeta[w]
              const lvls = LEVELS.filter(l => l.world === w)
              const done = lvls.filter(l => completedLevels.includes(l.id)).length
              const active = world === w
              return (
                <button key={w} onClick={() => setWorld(w)} style={{ flex: 1, padding: '12px 8px', borderRadius: 12, cursor: 'pointer', border: `1px solid ${active ? meta.color + '50' : '#12122a'}`, background: active ? `${meta.color}0e` : '#07070e', transition: 'all 0.2s' }}>
                  <div style={{ fontSize: 18, marginBottom: 4, filter: active ? `drop-shadow(0 0 8px ${meta.color}80)` : 'none' }}>{meta.icon}</div>
                  <div style={{ fontSize: 12, fontWeight: 800, color: active ? meta.color : '#3a3a55' }}>{meta.name}</div>
                  <div style={{ fontSize: 9, color: '#25253a', marginTop: 2 }}>{done}/{lvls.length}</div>
                </button>
              )
            })}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
            {[...LEVELS, ...generatedLevels].filter(l => l.world === world).map(level => {
              const done = completedLevels.includes(level.id)
              const best = bestMoves[level.id]
              const w = worldMeta[world] ?? worldMeta[1]
              return (
                <button key={level.id} onClick={() => loadLevel(level)} style={{
                  aspectRatio: '1', borderRadius: 14, cursor: 'pointer',
                  border: `1px solid ${done ? w.color + '40' : '#12122a'}`,
                  background: done ? `linear-gradient(145deg, ${w.color}15 0%, ${w.color}08 100%)` : 'linear-gradient(145deg, #0a0a16 0%, #07070e 100%)',
                  color: done ? w.color : '#2a2a3e', fontSize: 17, fontWeight: 900, position: 'relative',
                  boxShadow: done ? `0 0 16px ${w.color}12` : 'none', transition: 'all 0.15s',
                }}>
                  {level.id}
                  {best !== undefined && (
                    <div style={{ position: 'absolute', top: -5, right: -5, width: 16, height: 16, borderRadius: '50%', background: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, color: '#000', fontWeight: 900, boxShadow: '0 0 8px rgba(251,191,36,0.6)' }}>★</div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {view === 'workshop' && (
        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 340 }}>
          <LevelGeneratorPanel onLoad={loadLevel} />
        </div>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────
   Icon Button Style
───────────────────────────────────────── */
const iconBtn: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 10, border: '1px solid #12122a',
  background: 'rgba(255,255,255,0.015)', color: '#3a3a55', fontSize: 15,
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0, transition: 'all 0.15s',
}

/* ─────────────────────────────────────────
   Main GameBoard
───────────────────────────────────────── */
export default function GameBoard() {
  const {
    currentLevel, tiles, wallOffset, compressionActive,
    moves, status, elapsedSeconds, screenShake,
    timeUntilCompression, wallsJustAdvanced,
    loadLevel, startGame, tapTile, advanceWalls,
    restartLevel, goToMenu, undoMove,
    completeTutorial, showTutorial, bestMoves, tickTimer, tickCompressionTimer,
    generatedLevels, history,
  } = useGameStore()

  const { particles, burst } = useParticles()

  // Use refs for intervals so cleanup is always bound to the right id
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const compressionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Stable refs for store actions — prevents useEffect deps from causing
  // interval teardown/restart on every render (Zustand can recreate fn refs)
  const tickTimerRef = useRef(tickTimer)
  const tickCompressionRef = useRef(tickCompressionTimer)
  const advanceWallsRef = useRef(advanceWalls)
  useEffect(() => { tickTimerRef.current = tickTimer }, [tickTimer])
  useEffect(() => { tickCompressionRef.current = tickCompressionTimer }, [tickCompressionTimer])
  useEffect(() => { advanceWallsRef.current = advanceWalls }, [advanceWalls])

  // Guard: prevents advanceWalls firing twice if timeUntilCompression stays 0
  // across two renders before the store resets it. Use a ref so it survives
  // between renders without causing re-renders itself.
  const advancingRef = useRef(false)

  const boardRef = useRef<HTMLDivElement>(null)
  const [showHint, setShowHint] = useState(false)

  const allLevels = [...LEVELS, ...generatedLevels]
  const solution = currentLevel ? getSolution(currentLevel) : null

  // ── Interval management ───────────────────────────────────────────────────
  // Explicitly clear both intervals whenever status leaves 'playing'.
  // This is the belt-and-suspenders guard — the individual effect cleanups
  // below also clear, but this fires first on any status transition.
  useEffect(() => {
    if (status !== 'playing') {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null }
      if (compressionTimerRef.current) { clearInterval(compressionTimerRef.current); compressionTimerRef.current = null }
      // Reset advance guard so it's ready for next game
      advancingRef.current = false
    }
  }, [status])

  // Elapsed seconds — restart only when status becomes 'playing'
  useEffect(() => {
    if (status !== 'playing') return
    // Clear any lingering interval from a previous game before starting new one
    if (timerRef.current) clearInterval(timerRef.current)
    timerRef.current = setInterval(() => tickTimerRef.current(), 1000)
    return () => { if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null } }
  }, [status]) // intentionally NOT including tickTimerRef — it's a ref, always current

  // Compression countdown — restart only when compressionActive flips on
  useEffect(() => {
    if (status !== 'playing' || !compressionActive) return
    // Clear any lingering interval before starting
    if (compressionTimerRef.current) clearInterval(compressionTimerRef.current)
    compressionTimerRef.current = setInterval(() => tickCompressionRef.current(), 1000)
    return () => { if (compressionTimerRef.current) { clearInterval(compressionTimerRef.current); compressionTimerRef.current = null } }
  }, [status, compressionActive]) // NOT including tickCompressionRef — it's a ref

  // Wall advance trigger — fires when countdown hits 0.
  // advancingRef prevents double-fire if effect runs twice before store resets
  // timeUntilCompression. We use addTimeout from the store registry so it IS
  // cleared by clearAllTimeouts() on level load.
  useEffect(() => {
    if (status !== 'playing' || !compressionActive || timeUntilCompression > 0) {
      // Reset guard any time we're not in the trigger condition
      if (timeUntilCompression > 0) advancingRef.current = false
      return
    }
    if (advancingRef.current) return
    advancingRef.current = true
    advanceWallsRef.current()
    // Guard resets automatically when timeUntilCompression becomes > 0 again
    // (handled by the condition above on next render)
  }, [status, compressionActive, timeUntilCompression])

  // Particles on win
  useEffect(() => {
    if (status !== 'won' || !boardRef.current) return
    const rect = boardRef.current.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    for (let i = 0; i < 8; i++) {
      setTimeout(() => {
        burst(cx + (Math.random() - .5) * 120, cy + (Math.random() - .5) * 100,
          i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#a5b4fc' : '#fbbf24',
          14, i % 2 === 0 ? 'star' : 'circle')
      }, i * 80)
    }
  }, [status, burst])

  // Hide hint on status change
  useEffect(() => { if (status !== 'playing') setShowHint(false) }, [status])

  const handleTileTap = (x: number, y: number) => {
    if (status !== 'playing') return
    const tile = tiles.find(t => t.x === x && t.y === y)
    if (!tile?.canRotate) return
    if (boardRef.current && currentLevel) {
      const rect = boardRef.current.getBoundingClientRect()
      const gs = currentLevel.gridSize
      const px = rect.left + (x + 0.5) * (rect.width / gs)
      const py = rect.top + (y + 0.5) * (rect.height / gs)
      burst(px, py, '#f59e0b', 5)
    }
    tapTile(x, y)
  }

  if (showTutorial || status === 'tutorial') return <TutorialScreen onComplete={completeTutorial} />
  if (status === 'menu' || !currentLevel) return <MenuScreen />

  const gs = currentLevel.gridSize
  const maxOff = Math.floor(gs / 2)
  const comprPct = Math.round((wallOffset / maxOff) * 100)
  const hintPos = showHint && solution?.length ? solution[0] : null
  const nextLevel = allLevels.find(l => l.id === currentLevel.id + 1) ?? null

  // Full-screen responsive board sizing
  const vw = typeof window !== 'undefined' ? window.innerWidth : 400
  const vh = typeof window !== 'undefined' ? window.innerHeight : 800
  const boardPx = Math.min(460, vw * 0.92, (vh - 190) * 0.82)

  const gap = gs > 5 ? 3 : 4
  const padding = gs > 5 ? 6 : 8
  const tileSize = Math.floor((boardPx - padding * 2 - gap * (gs - 1)) / gs)

  const mins = Math.floor(elapsedSeconds / 60)
  const secs = elapsedSeconds % 60
  const timeStr = `${mins > 0 ? mins + ':' : ''}${String(secs).padStart(2, '0')}`
  const countdownSecs = Math.ceil(timeUntilCompression / 1000)

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse 70% 50% at 50% -5%, #0d0d22 0%, #06060f 100%)',
      color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif',
      userSelect: 'none', WebkitUserSelect: 'none', overflow: 'hidden',
      transform: screenShake ? 'translateX(-4px)' : 'none',
      transition: screenShake ? 'none' : 'transform 0.05s ease',
    }}>
      <StarField />

      {/* Particles */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 999 }}>
        {particles.map(p => (
          <div key={p.id} style={{
            position: 'absolute', left: p.x - p.size / 2, top: p.y - p.size / 2,
            width: p.size, height: p.size,
            borderRadius: p.shape === 'circle' ? '50%' : '2px',
            background: p.color, opacity: p.life / p.maxLife,
            transform: p.shape === 'star' ? `rotate(${p.life * 200}deg)` : undefined,
            boxShadow: `0 0 ${p.size * 1.5}px ${p.color}`, pointerEvents: 'none',
          }} />
        ))}
      </div>

      {/* Content */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: boardPx + 20, padding: '0 10px', position: 'relative', zIndex: 1 }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: 10 }}>
          <button onClick={goToMenu} style={iconBtn} title="Menu"><span style={{ fontSize: 14 }}>←</span></button>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 900, letterSpacing: '-0.02em' }}>{currentLevel.name}</div>
            <div style={{ fontSize: 9, color: '#25253a', letterSpacing: '0.18em', marginTop: 1 }}>
              LEVEL {currentLevel.id}{currentLevel.isGenerated ? ' · CUSTOM' : ''}
            </div>
          </div>
          <button onClick={restartLevel} style={iconBtn} title="Restart"><span style={{ fontSize: 14 }}>↺</span></button>
        </div>

        {/* Stats row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', marginBottom: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: '#07070e', border: '1px solid #12122a', borderRadius: 10, padding: '6px 12px', flexShrink: 0, minWidth: 54 }}>
            <div style={{ fontSize: 20, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{moves}</div>
            <div style={{ fontSize: 8, color: '#25253a', letterSpacing: '0.1em' }}>/{currentLevel.maxMoves}</div>
          </div>

          <CompressionBar percent={comprPct} active={compressionActive} />

          {status === 'playing' && compressionActive && (
            <div style={{ background: '#07070e', border: '1px solid #12122a', borderRadius: 10, padding: '6px 10px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 44 }}>
              <div style={{ fontSize: 14, fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums', color: countdownSecs <= 3 ? '#ef4444' : countdownSecs <= 5 ? '#f59e0b' : '#3a3a55', transition: 'color 0.3s' }}>{countdownSecs}</div>
              <div style={{ fontSize: 7, color: '#25253a', letterSpacing: '0.1em', marginTop: 1 }}>SEC</div>
            </div>
          )}

          {status === 'playing' && (
            <div style={{ background: '#07070e', border: '1px solid #12122a', borderRadius: 10, padding: '6px 10px', flexShrink: 0, fontSize: 13, fontWeight: 700, color: '#3a3a55', fontVariantNumeric: 'tabular-nums' }}>{timeStr}</div>
          )}

          {status === 'playing' && (
            <button onClick={undoMove} disabled={history.length === 0} style={{ ...iconBtn, opacity: history.length === 0 ? 0.3 : 1 }} title="Undo">
              <span style={{ fontSize: 14 }}>⎌</span>
            </button>
          )}
        </div>

        {/* Board */}
        <div ref={boardRef} style={{ position: 'relative', width: boardPx, height: boardPx, flexShrink: 0, transition: 'width 0.35s ease, height 0.35s ease' }}>
          <div style={{
            width: '100%', height: '100%',
            display: 'grid', gridTemplateColumns: `repeat(${gs}, 1fr)`,
            gap, padding,
            background: 'linear-gradient(145deg, #060610 0%, #04040c 100%)',
            borderRadius: 18, border: '1.5px solid #10102a', boxSizing: 'border-box',
            boxShadow: '0 0 60px rgba(99,102,241,0.06), 0 4px 40px rgba(0,0,0,0.9)',
          }}>
            {Array.from({ length: gs }, (_, y) =>
              Array.from({ length: gs }, (_, x) => {
                const tile = tiles.find(t => t.x === x && t.y === y)
                const dist = Math.min(x, y, gs - 1 - x, gs - 1 - y)
                const isHint = !!(hintPos && hintPos.x === x && hintPos.y === y)
                // inDanger: strictly inside the wall band (dist < wallOffset), not AT the edge
                const inDanger = compressionActive && dist < wallOffset && !!tile && tile.type !== 'wall' && tile.type !== 'crushed'
                return (
                  <GameTile
                    key={`${x}-${y}`}
                    type={tile?.type ?? 'empty'}
                    connections={tile?.connections ?? []}
                    canRotate={tile?.canRotate ?? false}
                    isGoalNode={tile?.isGoalNode ?? false}
                    isHint={isHint} inDanger={inDanger}
                    justRotated={tile?.justRotated}
                    onClick={() => handleTileTap(x, y)}
                    tileSize={tileSize}
                  />
                )
              })
            )}
          </div>

          {/* Wall overlays */}
          {status === 'playing' && wallOffset > 0 && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', borderRadius: 18, overflow: 'hidden' }}>
              {[
                { style: { top: 0, left: 0, right: 0, height: `${(wallOffset / gs) * 100}%` } as React.CSSProperties, grad: '180deg', tx: wallsJustAdvanced ? 'translateY(2px)' : 'translateY(0)' },
                { style: { bottom: 0, left: 0, right: 0, height: `${(wallOffset / gs) * 100}%` } as React.CSSProperties, grad: '0deg', tx: wallsJustAdvanced ? 'translateY(-2px)' : 'translateY(0)' },
                { style: { left: 0, top: 0, bottom: 0, width: `${(wallOffset / gs) * 100}%` } as React.CSSProperties, grad: '90deg', tx: wallsJustAdvanced ? 'translateX(2px)' : 'translateX(0)' },
                { style: { right: 0, top: 0, bottom: 0, width: `${(wallOffset / gs) * 100}%` } as React.CSSProperties, grad: '270deg', tx: wallsJustAdvanced ? 'translateX(-2px)' : 'translateX(0)' },
              ].map((w, i) => (
                <div key={i} style={{
                  position: 'absolute', ...w.style,
                  background: `linear-gradient(${w.grad}, rgba(239,68,68,0.18) 0%, transparent 100%)`,
                  borderColor: 'rgba(239,68,68,0.35)', borderStyle: 'solid', borderWidth: 0,
                  ...(i === 0 ? { borderBottomWidth: 2 } : i === 1 ? { borderTopWidth: 2 } : i === 2 ? { borderRightWidth: 2 } : { borderLeftWidth: 2 }),
                  transform: w.tx,
                  transition: 'all 0.4s cubic-bezier(0.34,1.56,0.64,1)',
                  boxShadow: wallsJustAdvanced ? '0 0 20px rgba(239,68,68,0.35)' : 'none',
                }} />
              ))}
            </div>
          )}

          {/* Overlays */}
          {(status === 'idle' || status === 'won' || status === 'lost') && (
            <Overlay
              status={status} moves={moves} levelName={currentLevel.name}
              onStart={startGame}
              onNext={() => { if (nextLevel) loadLevel(nextLevel) }}
              onMenu={goToMenu} onRetry={restartLevel}
              solution={solution} hasNext={!!nextLevel}
              elapsedSeconds={elapsedSeconds}
            />
          )}
        </div>

        {/* Bottom controls */}
        <div style={{ display: 'flex', gap: 10, marginTop: 12, alignItems: 'center' }}>
          {status === 'playing' && solution && solution.length > 0 && (
            <button onClick={() => setShowHint(s => !s)} style={{
              padding: '9px 16px', borderRadius: 10, cursor: 'pointer',
              border: `1px solid ${showHint ? '#f59e0b50' : '#12122a'}`,
              background: showHint ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.01)',
              color: showHint ? '#fbbf24' : '#2a2a3e', fontSize: 11, fontWeight: 700, transition: 'all 0.15s',
            }}>{showHint ? '✦ Hide Hint' : '💡 Hint'}</button>
          )}
          {status === 'playing' && bestMoves[currentLevel.id] !== undefined && (
            <div style={{ fontSize: 10, color: '#1e1e2e' }}>Best: {bestMoves[currentLevel.id]}</div>
          )}
        </div>
      </div>
    </div>
  )
}
