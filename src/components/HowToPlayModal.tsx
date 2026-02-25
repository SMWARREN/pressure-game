// PRESSURE - How to Play Modal
// Shows tutorial content as an overlay without losing game progress.

import { useState } from 'react';
import { useGameStore } from '../game/store';
import { getModeById } from '../game/modes';
import { TutorialStep, TutorialDemoType } from '../game/types';

/* ═══════════════════════════════════════════════════════════════════════════
   DEMO VISUAL WRAPPER
═══════════════════════════════════════════════════════════════════════════ */

function DemoVisual({
  type,
  modeId,
  modeColor,
}: {
  type: TutorialDemoType;
  modeId: string;
  modeColor: string;
}) {
  const mode = getModeById(modeId);

  // Use the mode's renderDemo function if available
  if (mode.renderDemo) {
    const demoContent = mode.renderDemo(type, modeColor);
    if (demoContent) {
      return <>{demoContent}</>;
    }
  }

  // Fallback placeholder
  return (
    <div
      style={{
        fontSize: 32,
        opacity: 0.5,
        filter: `drop-shadow(0 0 12px ${modeColor}50)`,
      }}
    >
      ✦
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   FALLBACK STEPS (used if a mode doesn't define tutorialSteps)
═══════════════════════════════════════════════════════════════════════════ */

const FALLBACK_STEPS: TutorialStep[] = [
  {
    icon: '🔌',
    iconColor: '#818cf8',
    title: 'Connect the Pipes',
    subtitle: 'YOUR GOAL',
    demo: 'fixed-path',
    body: 'Connect all goal nodes by rotating the pipe tiles. Fixed blue tiles show the path — your job is to fill in the gaps.',
  },
  {
    icon: '🔄',
    iconColor: '#f59e0b',
    title: 'Tap to Rotate',
    subtitle: 'YOUR MAIN MOVE',
    demo: 'rotatable',
    body: 'Tap any rotatable tile to spin it 90° clockwise. Line up the openings so the pipe flows from node to node.',
  },
  {
    icon: '🟢',
    iconColor: '#22c55e',
    title: 'Goal Nodes',
    subtitle: 'CONNECT THEM ALL',
    demo: 'node',
    body: 'Green glowing tiles are goal nodes. All of them must be connected through a continuous path to win the level.',
  },
  {
    icon: '🎮',
    iconColor: '#6366f1',
    title: 'Controls',
    subtitle: 'UNDO & HINTS',
    demo: 'controls',
    body: 'Use Undo (⎌) to take back a move, or tap Hint (💡) to highlight the next suggested rotation.',
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
   HOW TO PLAY MODAL
═══════════════════════════════════════════════════════════════════════════ */

interface HowToPlayModalProps {
  onClose: () => void;
}

export default function HowToPlayModal({ onClose }: HowToPlayModalProps) {
  const currentModeId = useGameStore((s) => s.currentModeId);
  const mode = getModeById(currentModeId);
  const steps: TutorialStep[] = mode.tutorialSteps ?? FALLBACK_STEPS;
  const accentColor = mode.color;

  const [step, setStep] = useState(0);
  const s = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 100,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          zIndex: 101,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: 380,
            maxHeight: '90vh',
            overflowY: 'auto',
            background: 'linear-gradient(145deg, #0b0b1a 0%, #07070e 100%)',
            borderRadius: 20,
            border: `1px solid ${accentColor}20`,
            padding: 'clamp(18px, 4vw, 28px) clamp(16px, 4vw, 24px)',
            boxShadow: `0 0 60px ${accentColor}08, 0 8px 40px rgba(0,0,0,0.8)`,
            pointerEvents: 'auto',
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 'clamp(10px, 2vh, 16px)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '5px 12px',
                borderRadius: 20,
                border: `1px solid ${accentColor}40`,
                background: `${accentColor}10`,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: accentColor,
              }}
            >
              <span>{mode.icon}</span>
              <span>HOW TO PLAY</span>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 8,
                border: '1px solid #1a1a2e',
                background: 'rgba(255,255,255,0.02)',
                color: '#3a3a55',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              ✕
            </button>
          </div>

          {/* Step indicators */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              justifyContent: 'center',
              marginBottom: 'clamp(12px, 2.5vh, 20px)',
              padding: '4px 0',
            }}
          >
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                style={{
                  border: 'none',
                  cursor: 'pointer',
                  background: 'none',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    width: i === step ? 24 : 8,
                    height: 8,
                    borderRadius: 4,
                    background: i === step ? accentColor : i < step ? '#3a3a55' : '#1a1a2e',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                />
              </button>
            ))}
          </div>

          {/* Step content */}
          <div style={{ textAlign: 'center', marginBottom: 'clamp(14px, 3vw, 20px)' }}>
            <div
              style={{
                fontSize: 'clamp(32px, 10vw, 44px)',
                lineHeight: 1,
                marginBottom: 12,
                color: s.iconColor,
                filter: `drop-shadow(0 0 16px ${s.iconColor}80)`,
              }}
            >
              {s.icon}
            </div>
            <div
              style={{
                fontSize: 'clamp(18px, 5vw, 22px)',
                fontWeight: 900,
                letterSpacing: '-0.02em',
                marginBottom: 6,
              }}
            >
              {s.title}
            </div>
            <div
              style={{
                fontSize: 'clamp(11px, 3vw, 12px)',
                color: '#3a3a55',
                letterSpacing: '0.04em',
              }}
            >
              {s.subtitle}
            </div>
          </div>

          {/* Demo visual */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              padding: 'clamp(12px, 3vw, 18px) 8px',
              marginBottom: 'clamp(12px, 3vw, 18px)',
              background: 'rgba(0,0,0,0.3)',
              borderRadius: 14,
              border: '1px solid #0e0e1e',
              overflowX: 'auto',
            }}
          >
            <DemoVisual type={s.demo} modeId={currentModeId} modeColor={accentColor} />
          </div>

          {/* Body text */}
          <div
            style={{
              background: 'rgba(0,0,0,0.2)',
              borderRadius: 12,
              padding: 'clamp(12px, 3vw, 16px)',
              marginBottom: 'clamp(14px, 3vw, 20px)',
            }}
          >
            <p
              style={{
                fontSize: 'clamp(12px, 3.2vw, 13px)',
                color: '#4a4a6a',
                lineHeight: 1.8,
                margin: 0,
                whiteSpace: 'pre-line',
              }}
            >
              {s.body}
            </p>
          </div>

          {/* Navigation buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                style={{
                  flex: 1,
                  padding: '14px 0',
                  borderRadius: 12,
                  border: '1px solid #1a1a2e',
                  background: 'rgba(255,255,255,0.01)',
                  color: '#3a3a55',
                  fontSize: 'clamp(13px, 3.5vw, 14px)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  minHeight: 48,
                }}
              >
                ← Back
              </button>
            )}
            <button
              onClick={isLast ? onClose : () => setStep(step + 1)}
              style={{
                flex: 2,
                padding: '14px 0',
                borderRadius: 12,
                border: 'none',
                background: isLast
                  ? `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`
                  : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: '#fff',
                fontSize: 'clamp(13px, 3.5vw, 14px)',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: isLast
                  ? `0 4px 20px ${accentColor}55`
                  : '0 4px 20px rgba(99,102,241,0.35)',
                letterSpacing: '0.04em',
                minHeight: 48,
              }}
            >
              {isLast ? 'Got it!' : 'Next →'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}