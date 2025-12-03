import * as THREE from 'three';
import * as CANNON from 'cannon-es';

export type RoomType = 'main' | 'minigame1' | 'minigame2' | 'minigame3' | 'minigame4';

export interface Portal {
  id: string;
  position: THREE.Vector3;
  targetRoom: RoomType;
  color: string;
  label: string;
}

export interface RoomConfig {
  id: RoomType;
  name: string;
  size: { width: number; height: number; depth: number };
  floorColor: string;
  wallColor: string;
  portals: Portal[];
  spawnPosition?: THREE.Vector3;
}

export interface PlayerState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  isGrounded: boolean;
  canJump: boolean;
}

export interface GameState {
  currentRoom: RoomType;
  isPlaying: boolean;
  nearPortal: Portal | null;
}

export interface PhysicsWorld {
  world: CANNON.World;
  playerBody: CANNON.Body;
  groundMaterial: CANNON.Material;
  wallMaterial: CANNON.Material;
}

