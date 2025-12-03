import { useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { useGameStore } from '../hooks/useGameStore';
import { useKeyboard } from '../hooks/useKeyboard';

interface BasketballGameProps {
  position: [number, number, number];
  zoneSize: [number, number, number];
}

// Renders a basketball hoop model
function Hoop({ position }: { position: [number, number, number] }) {
  const hoopRadius = 0.45;
  const hoopHeight = 3.05;
  const backboardWidth = 1.8;
  const backboardHeight = 1.2;
  
  return (
    <group position={position} rotation={[0, Math.PI, 0]}>
      <mesh position={[0, hoopHeight + 0.3, 0.1]}>
        <boxGeometry args={[backboardWidth, backboardHeight, 0.05]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.8} />
      </mesh>

      <lineSegments position={[0, hoopHeight + 0.3, 0.12]}>
        <edgesGeometry args={[new THREE.BoxGeometry(backboardWidth, backboardHeight, 0.05)]} />
        <lineBasicMaterial color="#ff4444" linewidth={2} />
      </lineSegments>

      <mesh position={[0, hoopHeight, -0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[hoopRadius, 0.02, 16, 32]} />
        <meshBasicMaterial color="#ff6600" />
      </mesh>

      <mesh position={[0, hoopHeight / 2, 0.2]}>
        <cylinderGeometry args={[0.08, 0.08, hoopHeight, 8]} />
        <meshBasicMaterial color="#333333" />
      </mesh>

      <mesh position={[0, hoopHeight - 0.3, -0.3]}>
        <cylinderGeometry args={[hoopRadius, hoopRadius * 0.7, 0.5, 16, 1, true]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.3} wireframe />
      </mesh>
    </group>
  );
}

// Renders the basketball mesh controlled by the physics engine
function Basketball({ 
  ballRef
}: { 
  ballRef: (mesh: THREE.Mesh | null) => void;
}) {
  return (
    <mesh ref={ballRef}>
      <sphereGeometry args={[0.12, 32, 32]} />
      <meshBasicMaterial color="#ff6600" />

      <lineSegments>
        <edgesGeometry args={[new THREE.SphereGeometry(0.121, 8, 8)]} />
        <lineBasicMaterial color="#333333" />
      </lineSegments>
    </mesh>
  );
}

// Main basketball minigame: physics, throwing logic, scoring, interactions
export function BasketballGame({ position, zoneSize }: BasketballGameProps) {
  const { camera, gl } = useThree();
  const { keys, resetInteract } = useKeyboard();
  const worldRef = useRef<CANNON.World | null>(null);
  const ballBodyRef = useRef<CANNON.Body | null>(null);
  const ballMeshRef = useRef<THREE.Mesh | null>(null);
  const scoreCheckTimeRef = useRef(0);
  const lastBallYRef = useRef(0);
  const hasScoreCheckedRef = useRef(false);
  const hasThrownBallRef = useRef(false);
  const ballGroundedTimeRef = useRef(0);
  const trajectoryRef = useRef<THREE.Vector3[]>([]);
  const trajectoryLineRef = useRef<THREE.Line | null>(null);
  
  const {
    currentRoom,
    isNearBasketball,
    setIsNearBasketball,
    isBasketballActive,
    setIsBasketballActive,
    isHoldingBall,
    setIsHoldingBall,
    throwPower,
    setThrowPower,
    isChargingThrow,
    setIsChargingThrow,
    incrementBasketballScore,
    incrementBasketballAttempts,
    basketballBetPlaced,
    basketballBetAmount,
    addMoney,
    removeMoney,
    isLocked,
    exitBasketballZone,
  } = useGameStore();

  // Computes initial ball spawn position
  const ballInitialPosition = useMemo<[number, number, number]>(() => [
    position[0], 
    position[1] + 0.5, 
    position[2] + zoneSize[2] / 2 - 1.5
  ], [position, zoneSize]);

  // Computes hoop world position
  const hoopPosition = useMemo<[number, number, number]>(() => [
    position[0], 
    position[1], 
    position[2] - zoneSize[2] / 2 + 0.5
  ], [position, zoneSize]);

  // Exits the basketball minigame
  const exitGame = useCallback(() => {
    exitBasketballZone();
    gl.domElement.requestPointerLock();
  }, [exitBasketballZone, gl]);

  // Handles Q key to exit game
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyQ' && isBasketballActive) {
        exitGame();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isBasketballActive, exitGame]);

  // Resets state whenever a bet is placed
  useEffect(() => {
    if (basketballBetPlaced) {
      hasThrownBallRef.current = false;
      hasScoreCheckedRef.current = false;
      scoreCheckTimeRef.current = 0;
    }
  }, [basketballBetPlaced]);

  // Handles picking up the ball with the mouse
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (!isBasketballActive || !basketballBetPlaced || e.button !== 0) return;
      
      if (!isHoldingBall && ballBodyRef.current && ballMeshRef.current) {
        const ballPos = new THREE.Vector3(
          ballBodyRef.current.position.x,
          ballBodyRef.current.position.y,
          ballBodyRef.current.position.z
        );
        const playerPos = camera.position.clone();
        const distance = ballPos.distanceTo(playerPos);
        
        if (distance < 3) {
          const success = removeMoney(basketballBetAmount);
          if (!success) return;
          
          setIsHoldingBall(true);
          ballBodyRef.current.velocity.set(0, 0, 0);
          ballBodyRef.current.angularVelocity.set(0, 0, 0);
          
          trajectoryRef.current = [];
        }
      }
    };
    
    window.addEventListener('mousedown', handleMouseDown);
    return () => window.removeEventListener('mousedown', handleMouseDown);
  }, [isBasketballActive, basketballBetPlaced, isHoldingBall, camera, setIsHoldingBall, removeMoney, basketballBetAmount]);

  // Throws the basketball with calculated force
  const throwBall = useCallback(() => {
    if (!ballBodyRef.current || !isHoldingBall) return;

    const throwPos = camera.position.clone();
    const forward = new THREE.Vector3(0, 0, -1);
    forward.applyQuaternion(camera.quaternion);
    throwPos.add(forward.multiplyScalar(0.8));
    throwPos.y -= 0.3;
    
    ballBodyRef.current.position.set(throwPos.x, throwPos.y, throwPos.z);

    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyQuaternion(camera.quaternion);
    
    direction.y += 0.4;
    direction.normalize();

    const power = (throwPower / 100) * 6 + 4;
    
    ballBodyRef.current.velocity.set(
      direction.x * power,
      direction.y * power + 3,
      direction.z * power
    );
    
    ballBodyRef.current.angularVelocity.set(
      Math.random() * 5 - 2.5,
      Math.random() * 5 - 2.5,
      Math.random() * 5 - 2.5
    );

    hasThrownBallRef.current = true;
    hasScoreCheckedRef.current = false;
    scoreCheckTimeRef.current = 0;

    setIsHoldingBall(false);
    setIsChargingThrow(false);
    setThrowPower(0);
    incrementBasketballAttempts();
  }, [camera, incrementBasketballAttempts, isHoldingBall, setIsChargingThrow, setIsHoldingBall, setThrowPower, throwPower]);

  // Handles spacebar charge & release for throwing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isBasketballActive || !basketballBetPlaced || !isHoldingBall) return;
      
      if (e.code === 'Space' && !isChargingThrow) {
        e.preventDefault();
        setIsChargingThrow(true);
        setThrowPower(0);
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      if (!isBasketballActive || !basketballBetPlaced || !isHoldingBall) return;
      
      if (e.code === 'Space' && isChargingThrow) {
        e.preventDefault();
        throwBall();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [basketballBetPlaced, isBasketballActive, isChargingThrow, isHoldingBall, setIsChargingThrow, setThrowPower, throwBall]);

  // Initializes the Cannon.js physics world
  useEffect(() => {
    if (currentRoom !== 'minigame2') return;

    const world = new CANNON.World();
    world.gravity.set(0, -15, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    
    const ballMaterial = new CANNON.Material('ball');
    const groundMaterial = new CANNON.Material('ground');
    const wallMaterial = new CANNON.Material('wall');
    
    world.addContactMaterial(new CANNON.ContactMaterial(ballMaterial, groundMaterial, {
      friction: 0.7,
      restitution: 0.6,
    }));
    
    world.addContactMaterial(new CANNON.ContactMaterial(ballMaterial, wallMaterial, {
      friction: 0.3,
      restitution: 0.5,
    }));

    const groundBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(position[0], position[1], position[2]),
      shape: new CANNON.Box(new CANNON.Vec3(zoneSize[0] / 2, 0.1, zoneSize[2] / 2)),
      material: groundMaterial,
    });
    world.addBody(groundBody);

    const wallHeight = 8;
    const wallThickness = 0.1;
    
    const northWall = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(position[0], position[1] + wallHeight / 2, position[2] - zoneSize[2] / 2),
      shape: new CANNON.Box(new CANNON.Vec3(zoneSize[0] / 2, wallHeight / 2, wallThickness)),
      material: wallMaterial,
    });
    world.addBody(northWall);

    const southWall = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(position[0], position[1] + wallHeight / 2, position[2] + zoneSize[2] / 2),
      shape: new CANNON.Box(new CANNON.Vec3(zoneSize[0] / 2, wallHeight / 2, wallThickness)),
      material: wallMaterial,
    });
    world.addBody(southWall);

    const eastWall = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(position[0] + zoneSize[0] / 2, position[1] + wallHeight / 2, position[2]),
      shape: new CANNON.Box(new CANNON.Vec3(wallThickness, wallHeight / 2, zoneSize[2] / 2)),
      material: wallMaterial,
    });
    world.addBody(eastWall);

    const westWall = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(position[0] - zoneSize[0] / 2, position[1] + wallHeight / 2, position[2]),
      shape: new CANNON.Box(new CANNON.Vec3(wallThickness, wallHeight / 2, zoneSize[2] / 2)),
      material: wallMaterial,
    });
    world.addBody(westWall);

    const ceiling = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(position[0], position[1] + wallHeight, position[2]),
      shape: new CANNON.Box(new CANNON.Vec3(zoneSize[0] / 2, 0.1, zoneSize[2] / 2)),
      material: wallMaterial,
    });
    world.addBody(ceiling);

    const backboard = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(hoopPosition[0], hoopPosition[1] + 3.35, hoopPosition[2] - 0.1),
      shape: new CANNON.Box(new CANNON.Vec3(0.9, 0.6, 0.05)),
      material: wallMaterial,
    });
    world.addBody(backboard);

    const rimRadius = 0.45;
    const rimY = hoopPosition[1] + 3.05;
    const rimZ = hoopPosition[2] + 0.3;
    const rimSegments = 12;
    const rimSphereRadius = 0.03;

    for (let i = 0; i < rimSegments; i++) {
      const angle = (i / rimSegments) * Math.PI * 2;
      const rimX = hoopPosition[0] + Math.cos(angle) * rimRadius;
      const rimZPos = rimZ + Math.sin(angle) * rimRadius;
      
      const rimSegment = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(rimX, rimY, rimZPos),
        shape: new CANNON.Sphere(rimSphereRadius),
        material: wallMaterial,
      });
      world.addBody(rimSegment);
    }

    const ballBody = new CANNON.Body({
      mass: 0.6,
      position: new CANNON.Vec3(ballInitialPosition[0], ballInitialPosition[1], ballInitialPosition[2]),
      shape: new CANNON.Sphere(0.12),
      material: ballMaterial,
      linearDamping: 0.1,
      angularDamping: 0.3,
    });
    world.addBody(ballBody);
    ballBodyRef.current = ballBody;
    
    if (ballMeshRef.current) {
      ballMeshRef.current.position.set(ballInitialPosition[0], ballInitialPosition[1], ballInitialPosition[2]);
    }

    worldRef.current = world;

    return () => {
      worldRef.current = null;
      ballBodyRef.current = null;
    };
  }, [ballInitialPosition, currentRoom, position, zoneSize, hoopPosition]);

  // Checks if the ball scored
  const checkScore = useCallback(() => {
    if (!ballBodyRef.current || hasScoreCheckedRef.current) return;
    
    const ballPos = ballBodyRef.current.position;
    const hoopCenter = { 
      x: hoopPosition[0], 
      y: hoopPosition[1] + 3.05,
      z: hoopPosition[2] + 0.3
    };
    
    const dx = ballPos.x - hoopCenter.x;
    const dz = ballPos.z - hoopCenter.z;
    const horizontalDist = Math.sqrt(dx * dx + dz * dz);
    
    const currentY = ballPos.y;
    const lastY = lastBallYRef.current;
    
    if (horizontalDist < 0.35 && lastY > hoopCenter.y && currentY < hoopCenter.y) {
      incrementBasketballScore();
      hasScoreCheckedRef.current = true;
      
      if (basketballBetPlaced) {
        addMoney(basketballBetAmount * 2);
      }
    }
    
    lastBallYRef.current = currentY;
  }, [addMoney, basketballBetAmount, basketballBetPlaced, hoopPosition, incrementBasketballScore]);

  // Main per-frame update loop
  useFrame((_, delta) => {
    if (currentRoom !== 'minigame2') return;

    const playerPos = camera.position;
    const zoneCenter = new THREE.Vector3(position[0], position[1], position[2]);
    const distance = playerPos.distanceTo(zoneCenter);

    const isNear = distance < 8;
    if (isNear !== isNearBasketball) {
      setIsNearBasketball(isNear);
      if (!isNear && isBasketballActive) {
        exitGame();
      }
    }

    if (isNear && keys.current.interact && isLocked && !isBasketballActive) {
      resetInteract();
      setIsBasketballActive(true);
      document.exitPointerLock();
    }

    if (isChargingThrow) {
      setThrowPower(throwPower + delta * 80);
      if (throwPower >= 100) {
        throwBall();
      }
    }

    if (worldRef.current && ballBodyRef.current) {
      worldRef.current.step(1 / 60, delta, 3);
      
      if (isHoldingBall && !hasThrownBallRef.current) {
        const holdPos = camera.position.clone();
        const forward = new THREE.Vector3(0, 0, -1);
        forward.applyQuaternion(camera.quaternion);
        holdPos.add(forward.multiplyScalar(0.8));
        holdPos.y -= 0.3;
        
        ballBodyRef.current.position.set(holdPos.x, holdPos.y, holdPos.z);
        ballBodyRef.current.velocity.set(0, 0, 0);
      }
      
      if (hasThrownBallRef.current && Math.floor(scoreCheckTimeRef.current * 2) !== Math.floor((scoreCheckTimeRef.current - delta) * 2)) {
        // log skipped
      }
      
      if (ballMeshRef.current) {
        ballMeshRef.current.position.copy(ballBodyRef.current.position as unknown as THREE.Vector3);
        ballMeshRef.current.quaternion.copy(ballBodyRef.current.quaternion as unknown as THREE.Quaternion);
      }

      if (hasThrownBallRef.current && !isHoldingBall) {
        const pos = new THREE.Vector3(
          ballBodyRef.current.position.x,
          ballBodyRef.current.position.y,
          ballBodyRef.current.position.z
        );

        const lastPos = trajectoryRef.current[trajectoryRef.current.length - 1];
        if (!lastPos || pos.distanceTo(lastPos) > 0.05) {
          trajectoryRef.current.push(pos);
        }
        
        if (trajectoryLineRef.current && trajectoryRef.current.length >= 2) {
          const geometry = new THREE.BufferGeometry().setFromPoints(trajectoryRef.current);
          trajectoryLineRef.current.geometry.dispose();
          trajectoryLineRef.current.geometry = geometry;
        }
      }

      if (!isHoldingBall && hasThrownBallRef.current) {
        scoreCheckTimeRef.current += delta;
        checkScore();
        
        const ballY = ballBodyRef.current.position.y;
        const ballVelY = Math.abs(ballBodyRef.current.velocity.y);
        const isOnGround = ballY < position[1] + 0.3 && ballVelY < 0.5;
        
        if (isOnGround) {
          ballGroundedTimeRef.current += delta;
          
          if (ballGroundedTimeRef.current > 1) {
            ballBodyRef.current.position.set(
              ballInitialPosition[0],
              ballInitialPosition[1],
              ballInitialPosition[2]
            );
            ballBodyRef.current.velocity.set(0, 0, 0);
            ballBodyRef.current.angularVelocity.set(0, 0, 0);
            
            hasThrownBallRef.current = false;
            hasScoreCheckedRef.current = false;
            ballGroundedTimeRef.current = 0;
            scoreCheckTimeRef.current = 0;
          }
        } else {
          ballGroundedTimeRef.current = 0;
        }
      }
    }
  });

  const setBallMeshRef = (mesh: THREE.Mesh | null) => {
    ballMeshRef.current = mesh;
  };

  if (currentRoom !== 'minigame2') return null;

  return (
    <group>
      <mesh position={[position[0], position[1] + 4, position[2] - zoneSize[2] / 2]}>
        <boxGeometry args={[zoneSize[0], 8, 0.05]} />
        <meshBasicMaterial color="#44ffff" transparent opacity={0.15} />
      </mesh>

      <mesh position={[position[0], position[1] + 4, position[2] + zoneSize[2] / 2]}>
        <boxGeometry args={[zoneSize[0], 8, 0.05]} />
        <meshBasicMaterial color="#44ffff" transparent opacity={0.15} />
      </mesh>

      <mesh position={[position[0] + zoneSize[0] / 2, position[1] + 4, position[2]]}>
        <boxGeometry args={[0.05, 8, zoneSize[2]]} />
        <meshBasicMaterial color="#44ffff" transparent opacity={0.15} />
      </mesh>

      <mesh position={[position[0] - zoneSize[0] / 2, position[1] + 4, position[2]]}>
        <boxGeometry args={[0.05, 8, zoneSize[2]]} />
        <meshBasicMaterial color="#44ffff" transparent opacity={0.15} />
      </mesh>

      <Hoop position={hoopPosition} />

      <Basketball ballRef={setBallMeshRef} />

      <line ref={(line) => { trajectoryLineRef.current = line as unknown as THREE.Line; }}>
        <bufferGeometry />
        <lineBasicMaterial color="#ffff00" linewidth={2} transparent opacity={0.8} />
      </line>

      <mesh position={[position[0], position[1] + 0.01, position[2] + zoneSize[2] / 2 - 1.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.4, 32]} />
        <meshBasicMaterial color="#00ff00" transparent opacity={0.5} />
      </mesh>

      <mesh position={[hoopPosition[0], position[1] + 0.01, hoopPosition[2] + 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3, 3.1, 32, 1, 0, Math.PI]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
      </mesh>

      <mesh position={[hoopPosition[0], position[1] + 0.01, hoopPosition[2] + 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[3.6, 0.1]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}
