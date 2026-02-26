import GameBoard from './components/GameBoard';
import InstallPrompt from './components/InstallPrompt';
import { AchievementToastContainer } from './components/AchievementToast';

function App() {
  return (
    <>
      <GameBoard />
      <InstallPrompt />
      <AchievementToastContainer />
    </>
  );
}

export default App;
