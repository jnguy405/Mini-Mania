import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Text } from '@react-three/drei';
import { useGameStore } from '../hooks/useGameStore';
import { useKeyboard } from '../hooks/useKeyboard';

interface DiceGameProps {
  position: [number, number, number];
  zoneSize: [number, number, number];
}

interface DiceState {
  body: CANNON.Body;
  mesh: THREE.Group | null;
  value: number;
}

const DICE_FACES = [
  { normal: new THREE.Vector3(0, 1, 0), value: 1 },
  { normal: new THREE.Vector3(0, -1, 0), value: 6 },
  { normal: new THREE.Vector3(1, 0, 0), value: 3 },
  { normal: new THREE.Vector3(-1, 0, 0), value: 4 },
  { normal: new THREE.Vector3(0, 0, 1), value: 2 },
  { normal: new THREE.Vector3(0, 0, -1), value: 5 },
];

// Dice mesh with numbered faces
function Dice({ diceRef, initialPosition }: { 
  diceRef: (group: THREE.Group | null) => void;
  initialPosition: [number, number, number];
}) {
  const diceSize = 0.5;
  const halfSize = diceSize / 2 + 0.001;
  
  return (
    <group ref={diceRef} position={initialPosition}>
      <mesh>
        <boxGeometry args={[diceSize, diceSize, diceSize]} />
        <meshBasicMaterial color="#cc0000" />
      </mesh>

      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(diceSize, diceSize, diceSize)]} />
        <lineBasicMaterial color="#880000" />
      </lineSegments>

      <Text position={[0, halfSize, 0]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.25} color="white" anchorX="center" anchorY="middle" fontWeight="bold">1</Text>
      <Text position={[0, -halfSize, 0]} rotation={[Math.PI / 2, 0, 0]} fontSize={0.25} color="white" anchorX="center" anchorY="middle" fontWeight="bold">6</Text>
      <Text position={[halfSize, 0, 0]} rotation={[0, Math.PI / 2, 0]} fontSize={0.25} color="white" anchorX="center" anchorY="middle" fontWeight="bold">3</Text>
      <Text position={[-halfSize, 0, 0]} rotation={[0, -Math.PI / 2, 0]} fontSize={0.25} color="white" anchorX="center" anchorY="middle" fontWeight="bold">4</Text>
      <Text position={[0, 0, halfSize]} rotation={[0, 0, 0]} fontSize={0.25} color="white" anchorX="center" anchorY="middle" fontWeight="bold">2</Text>
      <Text position={[0, 0, -halfSize]} rotation={[0, Math.PI, 0]} fontSize={0.25} color="white" anchorX="center" anchorY="middle" fontWeight="bold">5</Text>
    </group>
  );
}

// Main dice minigame: physics, rolling logic, betting, UI state
export function DiceGame({ position, zoneSize }: DiceGameProps) {
  const { camera, gl } = useThree();
  const { keys, resetInteract } = useKeyboard();
  const worldRef = useRef<CANNON.World | null>(null);
  const diceStatesRef = useRef<DiceState[]>([]);
  const rollTimeRef = useRef(0);
  const hasSettledRef = useRef(false);
  
  const { 
    currentRoom,
    isNearMiniGame,
    setIsNearMiniGame,
    isRolling,
    setIsRolling,
    setDiceResult,
    isLocked,
    currentBet,
    betAmount,
    addMoney,
    setCurrentBet,
    setBetAmount,
    isMiniGameActive,
    setIsMiniGameActive,
    shouldTriggerRoll,
    clearTriggerRoll,
    lastBetForResult,
    lastBetAmountForResult,
  } = useGameStore();

  // Exits the minigame when pressing Q
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyQ' && isMiniGameActive) {
        setIsMiniGameActive(false);
        if (currentBet !== null && betAmount > 0) {
          addMoney(betAmount);
          setCurrentBet(null);
          setBetAmount(0);
        }
        gl.domElement.requestPointerLock();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMiniGameActive, currentBet, betAmount, addMoney, setCurrentBet, setBetAmount, setIsMiniGameActive, gl]);

  // Initializes physics world and the two dice
  useEffect(() => {
    if (currentRoom !== 'minigame1') return;

    const world = new CANNON.World();
    world.gravity.set(0, -30, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    
    const diceMaterial = new CANNON.Material('dice');
    const groundMaterial = new CANNON.Material('ground');
    const wallMaterial = new CANNON.Material('wall');
    
    const diceGroundContact = new CANNON.ContactMaterial(diceMaterial, groundMaterial, {
      friction: 0.5,
      restitution: 0.3,
    });
    world.addContactMaterial(diceGroundContact);
    
    const diceWallContact = new CANNON.ContactMaterial(diceMaterial, wallMaterial, {
      friction: 0.1,
      restitution: 0.5,
    });
    world.addContactMaterial(diceWallContact);

    const groundBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(position[0], position[1] + 0.05, position[2]),
      shape: new CANNON.Box(new CANNON.Vec3(zoneSize[0] / 2, 0.1, zoneSize[2] / 2)),
      material: groundMaterial,
    });
    world.addBody(groundBody);

    const wallHeight = 2;
    const wallThickness = 0.2;
    
    const northWall = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(position[0], position[1] + wallHeight / 2, position[2] - zoneSize[2] / 2),
      shape: new CANNON.Box(new CANNON.Vec3(zoneSize[0] / 2, wallHeight / 2, wallThickness / 2)),
      material: wallMaterial,
    });
    world.addBody(northWall);
    
    const southWall = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(position[0], position[1] + wallHeight / 2, position[2] + zoneSize[2] / 2),
      shape: new CANNON.Box(new CANNON.Vec3(zoneSize[0] / 2, wallHeight / 2, wallThickness / 2)),
      material: wallMaterial,
    });
    world.addBody(southWall);
    
    const eastWall = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(position[0] + zoneSize[0] / 2, position[1] + wallHeight / 2, position[2]),
      shape: new CANNON.Box(new CANNON.Vec3(wallThickness / 2, wallHeight / 2, zoneSize[2] / 2)),
      material: wallMaterial,
    });
    world.addBody(eastWall);
    
    const westWall = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(position[0] - zoneSize[0] / 2, position[1] + wallHeight / 2, position[2]),
      shape: new CANNON.Box(new CANNON.Vec3(wallThickness / 2, wallHeight / 2, zoneSize[2] / 2)),
      material: wallMaterial,
    });
    world.addBody(westWall);

    const diceSize = 0.5;
    const diceShape = new CANNON.Box(new CANNON.Vec3(diceSize / 2, diceSize / 2, diceSize / 2));
    
    const diceStates: DiceState[] = [];
    const offsets = [[-0.6, 0], [0.6, 0]];
    
    for (let i = 0; i < 2; i++) {
      const diceBody = new CANNON.Body({
        mass: 1,
        position: new CANNON.Vec3(position[0] + offsets[i][0], position[1] + 0.5, position[2] + offsets[i][1]),
        shape: diceShape,
        material: diceMaterial,
      });
      world.addBody(diceBody);
      
      diceStates.push({
        body: diceBody,
        mesh: null,
        value: 1,
      });
    }

    worldRef.current = world;
    diceStatesRef.current = diceStates;

    return () => {
      worldRef.current = null;
      diceStatesRef.current = [];
    };
  }, [currentRoom, position, zoneSize]);

  // Computes which face is upward based on orientation
  const getDiceValue = (quaternion: THREE.Quaternion): number => {
    const up = new THREE.Vector3(0, 1, 0);
    let maxDot = -Infinity;
    let value = 1;

    for (const face of DICE_FACES) {
      const rotatedNormal = face.normal.clone().applyQuaternion(quaternion);
      const dot = rotatedNormal.dot(up);
      if (dot > maxDot) {
        maxDot = dot;
        value = face.value;
      }
    }

    return value;
  };

  // Performs the dice roll by applying physics impulses
  const executeRoll = useCallback(() => {
    if (!worldRef.current || diceStatesRef.current.length === 0) return;
    
    setIsRolling(true);
    hasSettledRef.current = false;
    rollTimeRef.current = 0;
    setDiceResult(null);
    
    const offsets = [[-0.8, 0], [0.8, 0]];
    
    diceStatesRef.current.forEach((dice, i) => {
      dice.body.position.set(position[0] + offsets[i][0], position[1] + 2.5, position[2]);
      
      dice.body.quaternion.setFromEuler(
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI * 2
      );
      
      dice.body.velocity.set(
        (Math.random() - 0.5) * 5,
        -5,
        (Math.random() - 0.5) * 5
      );
      
      dice.body.angularVelocity.set(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );
    });
  }, [position, setDiceResult, setIsRolling]);

  useEffect(() => {
    if (shouldTriggerRoll && !isRolling) {
      clearTriggerRoll();
      executeRoll();
    }
  }, [shouldTriggerRoll, isRolling, clearTriggerRoll, executeRoll]);

  // Main per-frame game loop
  useFrame((_, delta) => {
    if (currentRoom !== 'minigame1') return;
    
    const playerPos = camera.position;
    const zoneCenter = new THREE.Vector3(position[0], position[1], position[2]);
    const distance = playerPos.distanceTo(zoneCenter);
    
    const isNear = distance < 6;
    if (isNear !== isNearMiniGame) {
      setIsNearMiniGame(isNear);
      if (!isNear) {
        setIsMiniGameActive(false);
        setCurrentBet(null);
        setBetAmount(0);
      }
    }

    if (isNear && keys.current.interact && isLocked && !isMiniGameActive) {
      resetInteract();
      setIsMiniGameActive(true);
      document.exitPointerLock();
    }

    if (worldRef.current && isRolling) {
      worldRef.current.step(1 / 60, delta, 3);
      rollTimeRef.current += delta;

      let allSettled = true;
      const newValues: number[] = [];

      diceStatesRef.current.forEach((dice) => {
        if (dice.mesh) {
          dice.mesh.position.copy(dice.body.position as unknown as THREE.Vector3);
          dice.mesh.quaternion.copy(dice.body.quaternion as unknown as THREE.Quaternion);
        }

        const speed = dice.body.velocity.length();
        const angularSpeed = dice.body.angularVelocity.length();
        
        if (speed > 0.1 || angularSpeed > 0.1) {
          allSettled = false;
        }

        const quat = new THREE.Quaternion(
          dice.body.quaternion.x,
          dice.body.quaternion.y,
          dice.body.quaternion.z,
          dice.body.quaternion.w
        );
        newValues.push(getDiceValue(quat));
      });

      if ((allSettled || rollTimeRef.current > 5) && !hasSettledRef.current) {
        hasSettledRef.current = true;
        setIsRolling(false);
        
        const total = newValues[0] + newValues[1];
        const result = {
          dice1: newValues[0],
          dice2: newValues[1],
          dice3: 0,
          total,
        };
        
        setDiceResult(result);
        
        const bet = lastBetForResult;
        const amount = lastBetAmountForResult;
        
        if (bet === total) {
          const winnings = amount * 2;
          addMoney(winnings);
        }
        
        setCurrentBet(null);
        setBetAmount(0);
      }
    }

    if (worldRef.current && !isRolling) {
      worldRef.current.step(1 / 60, delta, 3);
      
      diceStatesRef.current.forEach((dice) => {
        if (dice.mesh) {
          dice.mesh.position.copy(dice.body.position as unknown as THREE.Vector3);
          dice.mesh.quaternion.copy(dice.body.quaternion as unknown as THREE.Quaternion);
        }
      });
    }
  });

  const setDiceMeshRef = (index: number) => (group: THREE.Group | null) => {
    if (group && diceStatesRef.current[index]) {
      diceStatesRef.current[index].mesh = group;
    }
  };

  if (currentRoom !== 'minigame1') return null;

  return (
    <group>
      <mesh position={[position[0], position[1] + 1, position[2] - zoneSize[2] / 2]}>
        <boxGeometry args={[zoneSize[0], 2, 0.05]} />
        <meshBasicMaterial color="#ff4444" transparent opacity={0.15} />
      </mesh>
      <mesh position={[position[0], position[1] + 1, position[2] + zoneSize[2] / 2]}>
        <boxGeometry args={[zoneSize[0], 2, 0.05]} />
        <meshBasicMaterial color="#ff4444" transparent opacity={0.15} />
      </mesh>
      <mesh position={[position[0] + zoneSize[0] / 2, position[1] + 1, position[2]]}>
        <boxGeometry args={[0.05, 2, zoneSize[2]]} />
        <meshBasicMaterial color="#ff4444" transparent opacity={0.15} />
      </mesh>
      <mesh position={[position[0] - zoneSize[0] / 2, position[1] + 1, position[2]]}>
        <boxGeometry args={[0.05, 2, zoneSize[2]]} />
        <meshBasicMaterial color="#ff4444" transparent opacity={0.15} />
      </mesh>

      {[0, 1].map((i) => (
        <Dice 
          key={i} 
          diceRef={setDiceMeshRef(i)}
          initialPosition={[
            position[0] + (i === 0 ? -0.6 : 0.6),
            position[1] + 0.5,
            position[2]
          ]}
        />
      ))}
    </group>
  );
}
