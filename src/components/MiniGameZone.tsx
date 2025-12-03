import * as THREE from 'three';

interface MiniGameZoneProps {
  position: [number, number, number];
  size?: [number, number, number];
  color?: string;
  label?: string;
}

// Renders a rectangular ground border line used to mark a minigame zone
export function MiniGameZone({ 
  position, 
  size = [6, 0.1, 6], 
  color = '#ff4444',
}: MiniGameZoneProps) {
  const borderGeometry = new THREE.BufferGeometry();
  const halfWidth = size[0] / 2;
  const halfDepth = size[2] / 2;
  
  const vertices = new Float32Array([
    -halfWidth, 0.02, -halfDepth,
    halfWidth, 0.02, -halfDepth,
    halfWidth, 0.02, -halfDepth,
    halfWidth, 0.02, halfDepth,
    halfWidth, 0.02, halfDepth,
    -halfWidth, 0.02, halfDepth,
    -halfWidth, 0.02, halfDepth,
    -halfWidth, 0.02, -halfDepth,
  ]);
  borderGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

  return (
    <group position={position}>
      <lineSegments geometry={borderGeometry}>
        <lineBasicMaterial color={color} linewidth={2} />
      </lineSegments>
    </group>
  );
}
