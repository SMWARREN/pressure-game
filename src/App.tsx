import { useEffect, useState } from 'react';
import GameBoard from './components/GameBoard';
import TestHarness from './components/testing/TestHarness';
import InstallPrompt from './components/InstallPrompt';
import { AchievementToastContainer } from './components/AchievementToast';
import StateEditor from './components/StateEditor';

function App() {
  const [isTestMode, setIsTestMode] = useState(false);

  useEffect(() => {
    // Check if running in test mode via URL param
    const params = new URLSearchParams(window.location.search);
    setIsTestMode(params.has('levelId') && params.has('modeId'));
  }, []);

  return (
    <>
      {isTestMode ? <TestHarness /> : <GameBoard />}
      <InstallPrompt />
      <AchievementToastContainer />
      {false && import.meta.env.DEV && <StateEditor />}
    </>
  );
}

export default App;
