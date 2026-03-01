import { useEffect, useState } from 'react';
import { GameProviders } from '@/game/GameProviders';
import GameBoard from './components/GameBoard';
import TestHarness from './components/testing/TestHarness';
import InstallPrompt from './components/InstallPrompt';
import { AchievementToastContainer } from './components/AchievementToast';
import StateEditor from './components/StateEditor';

function AppContent() {
  console.log('[App] AppContent rendering');
  return (
    <>
      <GameBoard />
      <InstallPrompt />
      <AchievementToastContainer />
      {false && import.meta.env.DEV && <StateEditor />}
    </>
  );
}

function App() {
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    // Check if running in test mode via URL param
    const params = new URLSearchParams(window.location.search);
    setIsTestMode(params.has('levelId') && params.has('modeId'));
  }, []);

  if(isTestMode) {
    return <TestHarness />
  }

  return (
    <GameProviders>
      <AppContent />
    </GameProviders>
  );
}

export default App;
