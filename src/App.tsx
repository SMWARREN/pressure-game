import { useState } from 'react';
import { GameProviders } from '@/game/GameProviders';
import GameBoard from './components/GameBoard';
import TestHarness from './components/testing/TestHarness';
import InstallPrompt from './components/InstallPrompt';
import { AchievementToastContainer } from './components/AchievementToast';

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
      {/* StateEditor disabled: use query param for dev-only access */}
    </>
  );
}

function App() {
  const [engineReady, setEngineReady] = useState(false);

  // Detect test mode synchronously via useState initializer (not useEffect)
  // to avoid race condition where normal GameBoard starts loading before TestHarness takes over
  const [isTestMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const testMode = params.has('levelId') && params.has('modeId');
    if (testMode && process.env.NODE_ENV !== 'production') {
      performance.mark('app-test-mode-detected');
    }
    return testMode;
  });

  if (isTestMode) {
    return <TestHarness />;
  }

  return (
    <>
      <GameProviders onEngineReady={() => setEngineReady(true)}>
        <AppContent />
      </GameProviders>
      {/* Show loading screen overlay until engine is ready */}
      {!engineReady && <LoadingScreen />}
    </>
  );
}

export default App;
