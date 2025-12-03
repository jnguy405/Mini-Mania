import { Canvas } from '@react-three/fiber';
import { useGameStore } from '../hooks/useGameStore';
import { usePhysics } from '../hooks/usePhysics';
import { ROOM_CONFIGS } from '../config/rooms';
import { Player } from './Player';
import { Room } from './Room';
import { DebugGUI } from './DebugGUI';

function GameScene() {
  const { currentRoom } = useGameStore();
  const roomConfig = ROOM_CONFIGS[currentRoom];
  
  const { 
    playerBody, 
    groundMaterial, 
    wallMaterial, 
    addBody, 
    removeBody, 
    clearBodies, 
    step 
  } = usePhysics();

  return (
    <>
      <Room
        config={roomConfig}
        addBody={addBody}
        removeBody={removeBody}
        clearBodies={clearBodies}
        groundMaterial={groundMaterial}
        wallMaterial={wallMaterial}
      />
      <Player playerBody={playerBody} physicsStep={step} />
      <DebugGUI />
    </>
  );
}

export function Game() {
  const { isPlaying } = useGameStore();

  if (!isPlaying) return null;

  return (
    <Canvas
      camera={{ fov: 75, near: 0.1, far: 1000 }}
      style={{ width: '100vw', height: '100vh' }}
    >
      <GameScene />
    </Canvas>
  );
}

