import GameBoard from './components/GameBoard';
import InstallPrompt from './components/InstallPrompt';
import { AchievementToastContainer } from './components/AchievementToast';
import StateEditor from './components/StateEditor';

function App() {
  return (
    <>
      <GameBoard />
      <InstallPrompt />
      <AchievementToastContainer />
      {false && import.meta.env.DEV && <StateEditor />}
    </>
  );
}

export default App;
