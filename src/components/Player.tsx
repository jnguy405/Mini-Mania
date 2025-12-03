import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { useKeyboard } from '../hooks/useKeyboard';
import { useGameStore } from '../hooks/useGameStore';
import { PLAYER_CONFIG, ROOM_CONFIGS, PORTAL_CONFIG } from '../config/rooms';

interface PlayerProps {
  playerBody: React.MutableRefObject<CANNON.Body | null>;
  physicsStep: (delta: number) => void;
}

interface DebugState {
  prevYaw: number;
  prevPitch: number;
  prevQuaternion: THREE.Quaternion;
  frameCount: number;
}

// First-person player controller handling movement, camera rotation, portals, and physics sync
export function Player({ playerBody, physicsStep }: PlayerProps) {
  const { camera, gl } = useThree();
  const { keys, resetInteract } = useKeyboard();

  // Camera rotation state
  const yawRef = useRef(0);
  const pitchRef = useRef(0);

  // Movement state
  const velocityRef = useRef(new THREE.Vector3());
  const canJumpRef = useRef(true);

  // Debug tracking state
  const debugRef = useRef<DebugState>({
    prevYaw: 0,
    prevPitch: 0,
    prevQuaternion: new THREE.Quaternion(),
    frameCount: 0,
  });

  const { 
    currentRoom, 
    setNearPortal, 
    nearPortal, 
    teleportToRoom, 
    setIsLocked,
    isLocked,
    playerTeleportTarget,
    setPlayerTeleportTarget,
    isBasketballActive,
    saveGame,
    loadGame,
  } = useGameStore();

  // Requests browser pointer lock to enable FPS-style camera control
  const requestPointerLock = useCallback(() => {
    gl.domElement.requestPointerLock();
  }, [gl]);

  // Handles all mouse movement input and updates yaw/pitch accordingly
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (document.pointerLockElement !== gl.domElement) return;

    const sensitivity = PLAYER_CONFIG.mouseSensitivity * 0.002;

    const THRESHOLD = 100;
    if (Math.abs(event.movementX) > THRESHOLD || Math.abs(event.movementY) > THRESHOLD) {
      return;
    }

    yawRef.current -= event.movementX * sensitivity;
    while (yawRef.current > Math.PI) yawRef.current -= Math.PI * 2;
    while (yawRef.current < -Math.PI) yawRef.current += Math.PI * 2;

    const maxPitch = Math.PI / 2 - 0.05;
    pitchRef.current -= event.movementY * sensitivity;
    pitchRef.current = Math.max(-maxPitch, Math.min(maxPitch, pitchRef.current));
  }, [gl]);

  // Updates store when pointer lock state changes
  const handlePointerLockChange = useCallback(() => {
    const locked = document.pointerLockElement === gl.domElement;
    setIsLocked(locked);
  }, [gl, setIsLocked]);

  // Clicking the canvas initiates pointer lock if not already locked
  const handleClick = useCallback(() => {
    if (document.pointerLockElement !== gl.domElement) {
      requestPointerLock();
    }
  }, [gl, requestPointerLock]);

  // Registers mouse + pointer lock event listeners
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('pointerlockchange', handlePointerLockChange);
    gl.domElement.addEventListener('click', handleClick);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      gl.domElement.removeEventListener('click', handleClick);
    };
  }, [handleMouseMove, handlePointerLockChange, handleClick, gl]);

  // Allows saving/loading game state via keyboard (F5/F9)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const body = playerBody.current;
      if (!body) return;

      if (e.code === 'F5') {
        e.preventDefault();
        saveGame({
          x: body.position.x,
          y: body.position.y,
          z: body.position.z,
        });
      }

      if (e.code === 'F9') {
        e.preventDefault();
        loadGame();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [playerBody, saveGame, loadGame]);

  // Handles player and camera repositioning when switching rooms
  useEffect(() => {
    const body = playerBody.current;
    const roomConfig = ROOM_CONFIGS[currentRoom];
    const spawnPos = roomConfig.spawnPosition || new THREE.Vector3(0, PLAYER_CONFIG.spawnHeight, 0);

    if (body) {
      body.position.set(spawnPos.x, spawnPos.y, spawnPos.z);
      body.velocity.set(0, 0, 0);
    }

    camera.position.set(
      spawnPos.x, 
      spawnPos.y + PLAYER_CONFIG.eyeHeight - PLAYER_CONFIG.spawnHeight, 
      spawnPos.z
    );

    yawRef.current = 0;
    pitchRef.current = 0;

    debugRef.current.prevYaw = 0;
    debugRef.current.prevPitch = 0;
    debugRef.current.prevQuaternion.identity();
  }, [currentRoom, playerBody, camera]);

  // Teleports the player instantly to a stored teleport target
  useEffect(() => {
    if (!playerTeleportTarget) return;

    const body = playerBody.current;
    if (body) {
      body.position.set(
        playerTeleportTarget.x,
        playerTeleportTarget.y,
        playerTeleportTarget.z
      );
      body.velocity.set(0, 0, 0);
    }

    camera.position.set(
      playerTeleportTarget.x,
      playerTeleportTarget.y + PLAYER_CONFIG.eyeHeight - PLAYER_CONFIG.spawnHeight,
      playerTeleportTarget.z
    );

    setPlayerTeleportTarget(null);
  }, [playerTeleportTarget, playerBody, camera, setPlayerTeleportTarget]);

  // Main per-frame update loop for physics, camera, and movement
  useFrame((_, delta) => {
    const body = playerBody.current;
    if (!body || !isLocked) return;

    physicsStep(delta);

    const debug = debugRef.current;
    debug.frameCount++;

    const euler = new THREE.Euler(pitchRef.current, yawRef.current, 0, 'YXZ');
    camera.quaternion.setFromEuler(euler);

    const YAW_JUMP_THRESHOLD = 0.5;
    const PITCH_JUMP_THRESHOLD = 0.3;

    const yawDelta = Math.abs(yawRef.current - debug.prevYaw);
    const pitchDelta = Math.abs(pitchRef.current - debug.prevPitch);

    const adjustedYawDelta = Math.min(yawDelta, Math.PI * 2 - yawDelta);

    if (adjustedYawDelta > YAW_JUMP_THRESHOLD || pitchDelta > PITCH_JUMP_THRESHOLD) {
      // (Debug log removed)
    }

    debug.prevYaw = yawRef.current;
    debug.prevPitch = pitchRef.current;
    debug.prevQuaternion.copy(camera.quaternion);

    const forward = new THREE.Vector3(
      -Math.sin(yawRef.current),
      0,
      -Math.cos(yawRef.current)
    );
    const right = new THREE.Vector3(
      Math.cos(yawRef.current),
      0,
      -Math.sin(yawRef.current)
    );

    const speed = keys.current.sprint 
      ? PLAYER_CONFIG.moveSpeed * PLAYER_CONFIG.sprintMultiplier 
      : PLAYER_CONFIG.moveSpeed;

    const velocity = velocityRef.current;
    velocity.set(0, 0, 0);

    if (keys.current.forward) velocity.add(forward.clone().multiplyScalar(speed));
    if (keys.current.backward) velocity.add(forward.clone().multiplyScalar(-speed));
    if (keys.current.left) velocity.add(right.clone().multiplyScalar(-speed));
    if (keys.current.right) velocity.add(right.clone().multiplyScalar(speed));

    const currentYVelocity = body.velocity.y;
    body.velocity.set(velocity.x, currentYVelocity, velocity.z);

    const isGrounded =
      Math.abs(body.velocity.y) < 0.5 &&
      body.position.y <= PLAYER_CONFIG.spawnHeight + 0.2;

    if (keys.current.jump && isGrounded && canJumpRef.current && !isBasketballActive) {
      body.velocity.set(body.velocity.x, PLAYER_CONFIG.jumpForce, body.velocity.z);
      canJumpRef.current = false;
    }
    if (!keys.current.jump) {
      canJumpRef.current = true;
    }

    camera.position.set(
      body.position.x,
      body.position.y + PLAYER_CONFIG.eyeHeight - PLAYER_CONFIG.spawnHeight,
      body.position.z
    );

    const roomConfig = ROOM_CONFIGS[currentRoom];
    let foundPortal = null;

    for (const portal of roomConfig.portals) {
      const distance = camera.position.distanceTo(portal.position);
      if (distance < PORTAL_CONFIG.interactionDistance) {
        foundPortal = portal;
        break;
      }
    }
    setNearPortal(foundPortal);

    if (keys.current.interact && nearPortal) {
      resetInteract();
      teleportToRoom(nearPortal.targetRoom);
    }
  });

  // Player renders no mesh; controls camera and physics only
  return null;
}
