import { useGameStore } from '../hooks/useGameStore';

export function StartScreen() {
  const { isPlaying, setIsPlaying } = useGameStore();

  if (isPlaying) return null;

  const handleStart = () => {
    setIsPlaying(true);
  };

  return (
    <div className="start-screen">
      <h1>🎮 3D Mini Games</h1>
      <p>Explore four different minigame rooms!</p>
      <button className="start-button" onClick={handleStart}>
        Start Game
      </button>
      <div className="controls-info">
        <span>WASD - Move | Space - Jump | Shift - Sprint</span>
        <span>Mouse - Look | E - Interact (Portals / Games)</span>
      </div>
    </div>
  );
}

