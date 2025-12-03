import { Game } from './components/Game';
import { UI } from './components/UI';
import { StartScreen } from './components/StartScreen';

function App() {
  return (
    <>
      <StartScreen />
      <Game />
      <UI />
    </>
  );
}

export default App;
