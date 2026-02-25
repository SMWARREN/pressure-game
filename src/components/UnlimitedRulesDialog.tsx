// PRESSURE - Unlimited Rules Dialog
// Shows rules every time you start an Unlimited level

import { useState, useEffect } from 'react';
import { getModeById } from '@/game/modes';

interface UnlimitedRulesDialogProps {
  levelName: string;
  previousScore: number | null;
  onStart: () => void;
  onBack: () => void;
  modeId?: string;
  onWatchBest?: () => void;
}

export default function UnlimitedRulesDialog({
  levelName,
  previousScore,
  onStart,
  onBack,
  modeId = 'classic',
  onWatchBest,
}: UnlimitedRulesDialogProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Animate in
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Get mode-specific rules
  const mode = getModeById(modeId);
  const isShoppingMode = modeId === 'shoppingSpree';
  const isCandyMode = modeId === 'candy';

  // Mode-specific rule sets
  const getRules = () => {
    const baseRules = [
      { icon: '⏱️', text: 'Start with limited time — survive as long as you can!' },
      { icon: '🔥', text: 'Groups of 4+ add time (bigger = more time)' },
    ];

    if (isShoppingMode) {
      return [
        ...baseRules,
        { icon: '🦹', text: 'Thieves spawn as time runs low — they block tiles!' },
        { icon: '💥', text: 'Big combos (4+) scare away nearby thieves!' },
        { icon: '🏆', text: 'Beat your high score to win!' },
      ];
    }

    if (isCandyMode) {
      return [
        ...baseRules,
        { icon: '🧊', text: 'Tiles freeze as time runs low!' },
        { icon: '💥', text: 'Big combos (4+) unfreeze nearby tiles' },
        { icon: '🏆', text: 'Beat your high score to win!' },
      ];
    }

    // Default rules for other modes
    return [...baseRules, { icon: '🏆', text: 'Beat your high score to win!' }];
  };

  const rules = getRules();
  const modeColor = mode.color || '#22c55e';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.85)',
        backdropFilter: 'blur(8px)',
        zIndex: 100,
        padding: 20,
        opacity: visible ? 1 : 0,
        transition: 'opacity 0.3s',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(145deg, #0d0d22 0%, #06060f 100%)',
          border: '1px solid #22c55e40',
          borderRadius: 20,
          padding: '28px 24px',
          maxWidth: 340,
          width: '100%',
          textAlign: 'center',
          boxShadow: '0 0 40px rgba(34,197,94,0.2)',
          transform: visible ? 'scale(1)' : 'scale(0.95)',
          transition: 'transform 0.3s',
        }}
      >
        {/* Header */}
        <div style={{ fontSize: 28, marginBottom: 8 }}>♾️</div>
        <div
          style={{
            fontSize: 18,
            fontWeight: 900,
            color: '#22c55e',
            marginBottom: 4,
            letterSpacing: '-0.02em',
          }}
        >
          UNLIMITED MODE
        </div>
        <div style={{ fontSize: 12, color: '#3a3a55', marginBottom: 20 }}>{levelName}</div>

        {/* Rules */}
        <div
          style={{
            background: '#07070e',
            borderRadius: 12,
            padding: '16px',
            marginBottom: 20,
            textAlign: 'left',
          }}
        >
          <div
            style={{ fontSize: 10, color: modeColor, letterSpacing: '0.15em', marginBottom: 12 }}
          >
            RULES
          </div>

          {rules.map((rule, index) => (
            <RuleItem key={index} icon={rule.icon} text={rule.text} />
          ))}
        </div>

        {/* Previous Score */}
        {previousScore !== null && (
          <div
            style={{
              background: 'linear-gradient(135deg, #22c55e15, #22c55e08)',
              border: '1px solid #22c55e30',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 10, color: '#22c55e', letterSpacing: '0.15em' }}>
              YOUR HIGH SCORE
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: '#22c55e', marginTop: 4 }}>
              {previousScore.toLocaleString()}
            </div>
          </div>
        )}

        {/* First time message */}
        {previousScore === null && (
          <div
            style={{
              background: 'rgba(165,180,252,0.08)',
              border: '1px solid rgba(165,180,252,0.2)',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 12, color: '#a5b4fc' }}>
              🎮 First attempt — set a high score!
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            onClick={onBack}
            style={{
              flex: 1,
              minWidth: 60,
              padding: '14px',
              borderRadius: 12,
              border: '1px solid #1e1e35',
              background: 'transparent',
              color: '#3a3a55',
              fontSize: 12,
              fontWeight: 700,
              cursor: 'pointer',
              letterSpacing: '0.05em',
            }}
          >
            BACK
          </button>
          {onWatchBest && (
            <button
              onClick={onWatchBest}
              style={{
                flex: 1,
                minWidth: 80,
                padding: '14px',
                borderRadius: 12,
                border: '1px solid #a5b4fc40',
                background: 'rgba(165,180,252,0.08)',
                color: '#a5b4fc',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
            >
              ▶ BEST
            </button>
          )}
          <button
            onClick={onStart}
            style={{
              flex: 2,
              minWidth: 80,
              padding: '14px',
              borderRadius: 12,
              border: 'none',
              background: 'linear-gradient(135deg, #22c55e, #16a34a)',
              color: '#fff',
              fontSize: 12,
              fontWeight: 800,
              cursor: 'pointer',
              letterSpacing: '0.05em',
              boxShadow: '0 4px 16px rgba(34,197,94,0.4)',
            }}
          >
            START
          </button>
        </div>
      </div>
    </div>
  );
}

function RuleItem({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 10 }}>
      <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 12, color: '#a5b4fc', lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}
