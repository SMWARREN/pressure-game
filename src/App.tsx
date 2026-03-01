import { useEffect, useState } from 'react';
import { GameProviders } from '@/game/GameProviders';
import GameBoard from './components/GameBoard';
import TestHarness from './components/testing/TestHarness';
import InstallPrompt from './components/InstallPrompt';
import { AchievementToastContainer } from './components/AchievementToast';
import StateEditor from './components/StateEditor';
import type { PressureEngine } from '@/game/engine';

function LoadingScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0a0e27',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#fff',
        flexDirection: 'column',
        gap: '20px',
        zIndex: 9999,
      }}
    >
      <div
        style={{
          width: '40px',
          height: '40px',
          border: '3px solid #6366f120',
          borderTop: '3px solid #6366f1',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }}
      />
      <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>Initializing...</p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function AppContent() {
  return (
    <>
      <GameBoard />
      <InstallPrompt />
      <AchievementToastContainer />
      {/* StateEditor disabled during normal development */}
      {import.meta.env.DEV && false && <StateEditor />}
    </>
  );
}

interface AppProps {
  readonly pressureEngine?: PressureEngine;
}

function App({ pressureEngine }: AppProps) {
  const [isTestMode, setIsTestMode] = useState(false);
  const [engineReady, setEngineReady] = useState(false);

  useEffect(() => {
    // Check if running in test mode via URL param
    const params = new URLSearchParams(window.location.search);
    setIsTestMode(params.has('levelId') && params.has('modeId'));
  }, []);

  if (isTestMode) {
    return <TestHarness pressureEngine={pressureEngine} />;
  }

  return (
    <>
      <GameProviders pressureEngine={pressureEngine} onEngineReady={() => setEngineReady(true)}>
        <AppContent />
      </GameProviders>
      {/* Show loading screen overlay until engine is ready */}
      {!engineReady && <LoadingScreen />}
    </>
  );
}

export default App;
