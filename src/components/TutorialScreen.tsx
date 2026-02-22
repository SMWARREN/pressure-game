import { useState } from 'react'

const STEPS = [
  {
    icon: '⬡',
    iconColor: '#818cf8',
    title: 'Welcome to PRESSURE',
    subtitle: 'A time-compression puzzle game',
    body: 'Walls are closing in. Your mission: connect all goal nodes before everything gets crushed. Think fast. Move smart. Survive the squeeze.',
    demo: 'intro',
  },
  {
    icon: '◎',
    iconColor: '#22c55e',
    title: 'Goal Nodes',
    subtitle: 'Connect them all to win',
    body: 'Green nodes are your objective. You must connect ALL of them through a continuous path. If any node gets crushed by the walls — you lose instantly.',
    demo: 'node',
  },
  {
    icon: '⌿',
    iconColor: '#3b82f6',
    title: 'Fixed Paths',
    subtitle: 'Blue tiles — they cannot rotate',
    body: 'Blue path tiles show their connections with glowing lines. They are fixed in place. Use them as bridges between nodes and rotatable tiles.',
    demo: 'fixed-path',
  },
  {
    icon: '⊕',
    iconColor: '#f59e0b',
    title: 'Rotatable Paths',
    subtitle: 'Tap amber tiles to rotate 90°',
    body: 'Amber-colored paths can be rotated! Each tap rotates them 90° clockwise. The glowing dot in the corner marks them as rotatable. These are the key to solving each puzzle.',
    demo: 'rotatable',
  },
  {
    icon: '▥',
    iconColor: '#6b7280',
    title: 'Walls',
    subtitle: 'The deadly edges',
    body: 'Dark tiles around the border are walls. As time passes, the walls advance inward, crushing everything in their path. Watch the compression bar at the top!',
    demo: 'walls',
  },
  {
    icon: '⟳',
    iconColor: '#a78bfa',
    title: 'Undo & Hints',
    subtitle: 'You have tools',
    body: 'Made a mistake? Use the Undo button (⎌) to reverse your last move. Stuck? Tap Hint to highlight the next tile you should rotate. Use them wisely!',
    demo: 'tools',
  },
  {
    icon: '✦',
    iconColor: '#fbbf24',
    title: 'Ready to Play?',
    subtitle: 'Think early. Move once. Survive.',
    body: '1. Study the board before starting\n2. Plan your rotation path\n3. Act before compression begins\n4. Connect all nodes to win!\n\nGood luck surviving the pressure.',
    demo: 'ready',
  },
]

function DemoVisual({ type }: { type: string }) {
  const tileBase: React.CSSProperties = {
    width: 52, height: 52, borderRadius: 8, position: 'relative',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  }
  const pipe = (dir: string, color: string) => {
    const styles: React.CSSProperties = {
      position: 'absolute', background: color, borderRadius: 2,
      boxShadow: `0 0 6px ${color}`,
    }
    if (dir === 'up') return <div style={{ ...styles, top: 0, left: '50%', transform: 'translateX(-50%)', width: 5, height: '53%' }} />
    if (dir === 'down') return <div style={{ ...styles, bottom: 0, left: '50%', transform: 'translateX(-50%)', width: 5, height: '53%' }} />
    if (dir === 'left') return <div style={{ ...styles, left: 0, top: '50%', transform: 'translateY(-50%)', width: '53%', height: 5 }} />
    if (dir === 'right') return <div style={{ ...styles, right: 0, top: '50%', transform: 'translateY(-50%)', width: '53%', height: 5 }} />
    return null
  }
  const dot = (color: string) => (
    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}`, zIndex: 1 }} />
  )
  const rotateDot = (
    <div style={{ position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', boxShadow: '0 0 8px #f59e0b', zIndex: 2 }} />
  )

  if (type === 'intro') return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ ...tileBase, background: 'linear-gradient(145deg, #14532d, #0f3d21)', border: '2px solid #22c55e', boxShadow: '0 0 14px rgba(34,197,94,0.3)' }}>
        {pipe('right', 'rgba(134,239,172,0.9)')}
        {dot('rgba(134,239,172,0.9)')}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '40%', height: '40%', border: '2px solid rgba(134,239,172,0.5)', borderRadius: '50%', zIndex: 1 }} />
      </div>
      <div style={{ ...tileBase, background: 'linear-gradient(145deg, #78350f, #5c2a0a)', border: '2px solid #f59e0b', boxShadow: '0 0 8px rgba(245,158,11,0.2)' }}>
        {pipe('left', 'rgba(252,211,77,0.9)')}
        {pipe('right', 'rgba(252,211,77,0.9)')}
        {dot('rgba(252,211,77,0.9)')}
        {rotateDot}
      </div>
      <div style={{ ...tileBase, background: 'linear-gradient(145deg, #14532d, #0f3d21)', border: '2px solid #22c55e', boxShadow: '0 0 14px rgba(34,197,94,0.3)' }}>
        {pipe('left', 'rgba(134,239,172,0.9)')}
        {dot('rgba(134,239,172,0.9)')}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '40%', height: '40%', border: '2px solid rgba(134,239,172,0.5)', borderRadius: '50%', zIndex: 1 }} />
      </div>
    </div>
  )

  if (type === 'node') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ ...tileBase, background: 'linear-gradient(145deg, #14532d, #0f3d21)', border: '2px solid #22c55e', boxShadow: '0 0 18px rgba(34,197,94,0.4)' }}>
        {pipe('right', 'rgba(134,239,172,0.9)')}
        {pipe('down', 'rgba(134,239,172,0.9)')}
        {dot('rgba(134,239,172,0.9)')}
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '42%', height: '42%', border: '2px solid rgba(134,239,172,0.5)', borderRadius: '50%', zIndex: 1 }} />
      </div>
      <div style={{ fontSize: 10, color: '#22c55e', letterSpacing: '0.1em' }}>GOAL NODE</div>
    </div>
  )

  if (type === 'fixed-path') return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
      <div style={{ ...tileBase, background: 'linear-gradient(145deg, #1e3060, #172349)', border: '1.5px solid #2a4080' }}>
        {pipe('right', 'rgba(147,197,253,0.85)')}
        {dot('rgba(147,197,253,0.85)')}
      </div>
      <div style={{ ...tileBase, background: 'linear-gradient(145deg, #1e3060, #172349)', border: '1.5px solid #2a4080' }}>
        {pipe('left', 'rgba(147,197,253,0.85)')}
        {pipe('right', 'rgba(147,197,253,0.85)')}
        {dot('rgba(147,197,253,0.85)')}
      </div>
      <div style={{ ...tileBase, background: 'linear-gradient(145deg, #1e3060, #172349)', border: '1.5px solid #2a4080' }}>
        {pipe('left', 'rgba(147,197,253,0.85)')}
        {dot('rgba(147,197,253,0.85)')}
      </div>
    </div>
  )

  if (type === 'rotatable') return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ ...tileBase, background: 'linear-gradient(145deg, #78350f, #5c2a0a)', border: '2px solid #f59e0b', boxShadow: '0 0 8px rgba(245,158,11,0.2)' }}>
          {pipe('up', 'rgba(252,211,77,0.9)')}
          {pipe('right', 'rgba(252,211,77,0.9)')}
          {dot('rgba(252,211,77,0.9)')}
          {rotateDot}
        </div>
        <div style={{ fontSize: 9, color: '#78350f' }}>BEFORE</div>
      </div>
      <div style={{ fontSize: 20, color: '#f59e0b' }}>→</div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ ...tileBase, background: 'linear-gradient(145deg, #78350f, #5c2a0a)', border: '2px solid #fde68a', boxShadow: '0 0 18px rgba(253,230,138,0.5)' }}>
          {pipe('right', 'rgba(253,230,138,0.95)')}
          {pipe('down', 'rgba(253,230,138,0.95)')}
          {dot('rgba(253,230,138,0.95)')}
          {rotateDot}
        </div>
        <div style={{ fontSize: 9, color: '#f59e0b' }}>AFTER TAP</div>
      </div>
    </div>
  )

  if (type === 'walls') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {['#0e0e1c', '#0e0e1c', '#0e0e1c', '#0e0e1c', '#0e0e1c'].map((bg, i) => (
          <div key={i} style={{ width: 36, height: 36, borderRadius: 6, background: bg, border: '1px solid #131325' }} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        <div style={{ width: 36, height: 36, borderRadius: 6, background: '#0e0e1c', border: '1px solid #131325' }} />
        <div style={{ width: 36, height: 36, borderRadius: 6, background: 'linear-gradient(145deg, #14532d, #0f3d21)', border: '2px solid #22c55e', boxShadow: '0 0 10px rgba(34,197,94,0.3)' }} />
        <div style={{ width: 36, height: 36, borderRadius: 6, background: 'linear-gradient(145deg, #78350f, #5c2a0a)', border: '2px solid #f59e0b' }} />
        <div style={{ width: 36, height: 36, borderRadius: 6, background: 'linear-gradient(145deg, #14532d, #0f3d21)', border: '2px solid #22c55e', boxShadow: '0 0 10px rgba(34,197,94,0.3)' }} />
        <div style={{ width: 36, height: 36, borderRadius: 6, background: '#0e0e1c', border: '1px solid #131325' }} />
      </div>
      <div style={{ display: 'flex', gap: 4 }}>
        {[0,1,2,3,4].map(i => (
          <div key={i} style={{ width: 36, height: 36, borderRadius: 6, background: '#0e0e1c', border: '1px solid #131325' }} />
        ))}
      </div>
      <div style={{ fontSize: 9, color: '#3a3a55', letterSpacing: '0.1em' }}>WALLS ADVANCE INWARD →</div>
    </div>
  )

  if (type === 'tools') return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 10,
          background: 'rgba(255,255,255,0.02)', border: '1px solid #12122a',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20, color: '#3a3a55',
        }}>⎌</div>
        <div style={{ fontSize: 9, color: '#3a3a55' }}>UNDO</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{
          padding: '10px 16px', borderRadius: 10,
          border: '1px solid #f59e0b50', background: 'rgba(245,158,11,0.08)',
          color: '#fbbf24', fontSize: 20,
        }}>💡</div>
        <div style={{ fontSize: 9, color: '#f59e0b' }}>HINT</div>
      </div>
    </div>
  )

  if (type === 'ready') return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ fontSize: 48, filter: 'drop-shadow(0 0 20px rgba(251,191,36,0.7))' }}>✦</div>
      <div style={{ display: 'flex', gap: 6 }}>
        {['#22c55e', '#6366f1', '#f59e0b', '#ef4444'].map((c, i) => (
          <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c, boxShadow: `0 0 8px ${c}` }} />
        ))}
      </div>
    </div>
  )

  return null
}

export default function TutorialScreen({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(0)
  const s = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse 70% 50% at 50% -5%, #0d0d22 0%, #06060f 100%)',
      color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif',
      padding: 'max(16px, env(safe-area-inset-top, 16px)) 16px max(16px, env(safe-area-inset-bottom, 16px))',
      overflowY: 'auto',
    }}>
      {/* Step indicators - larger touch targets */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 'clamp(16px, 3vh, 24px)', padding: '8px 0' }}>
        {STEPS.map((_, i) => (
          <button key={i} onClick={() => setStep(i)} style={{
            width: i === step ? 24 : 8, height: 8, borderRadius: 4,
            background: i === step ? '#818cf8' : i < step ? '#3a3a55' : '#1a1a2e',
            border: 'none', cursor: 'pointer',
            transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            minHeight: 44, minWidth: 44,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              width: i === step ? 24 : 8, height: 8, borderRadius: 4,
              background: i === step ? '#818cf8' : i < step ? '#3a3a55' : '#1a1a2e',
            }} />
          </button>
        ))}
      </div>

      <div style={{
        width: '100%', maxWidth: 380,
        background: 'linear-gradient(145deg, #0b0b1a 0%, #07070e 100%)',
        borderRadius: 20, border: '1px solid #12122a',
        padding: 'clamp(18px, 4vw, 28px) clamp(16px, 4vw, 24px)',
        boxShadow: '0 0 60px rgba(99,102,241,0.06), 0 8px 40px rgba(0,0,0,0.8)',
      }}>
        <div style={{ textAlign: 'center', marginBottom: 'clamp(14px, 3vw, 20px)' }}>
          <div style={{
            fontSize: 'clamp(32px, 10vw, 44px)', lineHeight: 1, marginBottom: 12,
            color: s.iconColor,
            filter: `drop-shadow(0 0 16px ${s.iconColor}80)`,
          }}>{s.icon}</div>
          <div style={{ fontSize: 'clamp(18px, 5vw, 22px)', fontWeight: 900, letterSpacing: '-0.02em', marginBottom: 6 }}>
            {s.title}
          </div>
          <div style={{ fontSize: 'clamp(11px, 3vw, 12px)', color: '#3a3a55', letterSpacing: '0.04em' }}>{s.subtitle}</div>
        </div>

        <div style={{
          display: 'flex', justifyContent: 'center',
          padding: 'clamp(12px, 3vw, 18px) 8px', marginBottom: 'clamp(12px, 3vw, 18px)',
          background: 'rgba(0,0,0,0.3)', borderRadius: 14,
          border: '1px solid #0e0e1e',
          overflowX: 'auto',
        }}>
          <DemoVisual type={s.demo} />
        </div>

        <div style={{
          background: 'rgba(0,0,0,0.2)', borderRadius: 12, padding: 'clamp(12px, 3vw, 16px)',
          marginBottom: 'clamp(14px, 3vw, 20px)',
        }}>
          <p style={{
            fontSize: 'clamp(12px, 3.2vw, 13px)', color: '#4a4a6a', lineHeight: 1.8,
            margin: 0, whiteSpace: 'pre-line',
          }}>{s.body}</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          {step > 0 && (
            <button onClick={() => setStep(step - 1)} style={{
              flex: 1, padding: '14px 0', borderRadius: 12,
              border: '1px solid #1a1a2e', background: 'rgba(255,255,255,0.01)',
              color: '#3a3a55', fontSize: 'clamp(13px, 3.5vw, 14px)', fontWeight: 600, cursor: 'pointer',
              minHeight: 48,
            }}>← Back</button>
          )}
          <button
            onClick={isLast ? onComplete : () => setStep(step + 1)}
            style={{
              flex: 2, padding: '14px 0', borderRadius: 12, border: 'none',
              background: isLast
                ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                : 'linear-gradient(135deg, #6366f1, #4f46e5)',
              color: '#fff', fontSize: 'clamp(13px, 3.5vw, 14px)', fontWeight: 800, cursor: 'pointer',
              boxShadow: isLast ? '0 4px 20px rgba(34,197,94,0.35)' : '0 4px 20px rgba(99,102,241,0.35)',
              letterSpacing: '0.04em',
              minHeight: 48,
            }}
          >
            {isLast ? '▶ Play Now!' : 'Next →'}
          </button>
        </div>
      </div>

      <button onClick={onComplete} style={{
        marginTop: 'clamp(12px, 2vh, 20px)', padding: '12px 24px',
        background: 'none', border: 'none', cursor: 'pointer',
        color: '#1e1e2e', fontSize: 'clamp(11px, 3vw, 12px)', letterSpacing: '0.08em',
        minHeight: 44,
      }}>
        SKIP TUTORIAL
      </button>
    </div>
  )
}
