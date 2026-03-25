import { useState } from 'react';
import { GameProviders } from '@/game/GameProviders';
import GameBoard from '@/components/GameBoard';
import TestHarness from '@/components/testing/TestHarness';
import InstallPrompt from '@/components/InstallPrompt';
import { AchievementToastContainer } from '@/components/AchievementToast';
import { LoadingScreen } from '@/components/LoadingScreen';

function AppContent() {
  return (
    <>
      <LoadingScreen />
      <GameBoard />
      <InstallPrompt />
      <AchievementToastContainer />
      {/* StateEditor disabled during normal development */}
      {/* StateEditor disabled: use query param for dev-only access */}
    </>
  );
}

function App() {
  // Detect test mode synchronously via useState initializer (not useEffect)
  // to avoid race condition where normal GameBoard starts loading before TestHarness takes over
  const [isTestMode] = useState(() => {
    const params = new URLSearchParams(globalThis.location.search);
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
    <GameProviders onEngineReady={() => {}}>
      <AppContent />
    </GameProviders>
  );
}

export default App;
