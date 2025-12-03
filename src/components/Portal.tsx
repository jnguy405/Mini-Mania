import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Portal as PortalType } from '../types';
import { PORTAL_CONFIG } from '../config/rooms';
import { useGameStore } from '../hooks/useGameStore';

interface PortalProps {
  portal: PortalType;
}

// Displays an animated glowing portal that activates when the player is nearby
export function Portal({ portal }: PortalProps) {
  const glowRef = useRef<THREE.Mesh>(null);
  const { nearPortal } = useGameStore();
  
  const isNear = nearPortal?.id === portal.id;

  // Animates portal glow using a pulsing opacity effect
  useFrame((state) => {
    if (glowRef.current) {
      const pulse = 0.7 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
      (glowRef.current.material as THREE.MeshBasicMaterial).opacity =
        isNear ? Math.min(pulse + 0.2, 1) : pulse;
    }
  });

  // Computes the portal’s facing direction based on wall placement
  const getRotation = () => {
    const { x, z } = portal.position;
    if (Math.abs(z) > Math.abs(x)) {
      return z < 0 ? 0 : Math.PI;
    }
    return x > 0 ? -Math.PI / 2 : Math.PI / 2;
  };

  // Computes slight forward offset so the glowing panel sits in front of the wall
  const getGlowOffset = (): [number, number, number] => {
    const { x, z } = portal.position;
    const offset = 0.15;
    if (Math.abs(z) > Math.abs(x)) {
      return z < 0 ? [0, 0, offset] : [0, 0, -offset];
    }
    return x > 0 ? [-offset, 0, 0] : [offset, 0, 0];
  };

  const glowOffset = getGlowOffset();

  return (
    <group position={[portal.position.x, portal.position.y, portal.position.z]}>
      <mesh rotation={[0, getRotation(), 0]}>
        <boxGeometry args={[PORTAL_CONFIG.width + 0.3, PORTAL_CONFIG.height + 0.2, 0.2]} />
        <meshBasicMaterial color="#111111" />
      </mesh>

      <mesh 
        ref={glowRef} 
        rotation={[0, getRotation(), 0]}
        position={glowOffset}
      >
        <planeGeometry args={[PORTAL_CONFIG.width, PORTAL_CONFIG.height]} />
        <meshBasicMaterial 
          color={portal.color} 
          transparent 
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
