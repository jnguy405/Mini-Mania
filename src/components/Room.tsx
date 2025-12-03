import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import type { RoomConfig } from '../types';
import { Portal } from './Portal';
import { MiniGameZone } from './MiniGameZone';
import { DiceGame } from './DiceGame';
import { BasketballGame } from './BasketballGame';
import { SimonGame } from './SimonGame';
import { MINIGAME_ZONE_CONFIG } from '../config/rooms';

interface RoomProps {
  config: RoomConfig;
  addBody: (body: CANNON.Body) => void;
  removeBody: (body: CANNON.Body) => void;
  clearBodies: () => void;
  groundMaterial: React.MutableRefObject<CANNON.Material | null>;
  wallMaterial: React.MutableRefObject<CANNON.Material | null>;
}

export function Room({ 
  config, 
  addBody, 
  clearBodies, 
  groundMaterial, 
  wallMaterial 
}: RoomProps) {
  const { size, floorColor, wallColor, portals } = config;
  const bodiesRef = useRef<CANNON.Body[]>([]);

  useEffect(() => {
    clearBodies();
    bodiesRef.current = [];

    if (!groundMaterial.current || !wallMaterial.current) return;

    const floorShape = new CANNON.Box(new CANNON.Vec3(size.width / 2, 0.5, size.depth / 2));
    const floorBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, -0.5, 0),
      shape: floorShape,
      material: groundMaterial.current,
    });
    addBody(floorBody);
    bodiesRef.current.push(floorBody);

    const ceilingBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, size.height + 0.5, 0),
      shape: floorShape,
      material: wallMaterial.current,
    });
    addBody(ceilingBody);
    bodiesRef.current.push(ceilingBody);

    const wallThickness = 0.5;
    
    const northWallShape = new CANNON.Box(new CANNON.Vec3(size.width / 2, size.height / 2, wallThickness / 2));
    const northWallBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, size.height / 2, -size.depth / 2 - wallThickness / 2),
      shape: northWallShape,
      material: wallMaterial.current,
    });
    addBody(northWallBody);
    bodiesRef.current.push(northWallBody);

    const southWallBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, size.height / 2, size.depth / 2 + wallThickness / 2),
      shape: northWallShape,
      material: wallMaterial.current,
    });
    addBody(southWallBody);
    bodiesRef.current.push(southWallBody);

    const eastWallShape = new CANNON.Box(new CANNON.Vec3(wallThickness / 2, size.height / 2, size.depth / 2));
    const eastWallBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(size.width / 2 + wallThickness / 2, size.height / 2, 0),
      shape: eastWallShape,
      material: wallMaterial.current,
    });
    addBody(eastWallBody);
    bodiesRef.current.push(eastWallBody);

    const westWallBody = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(-size.width / 2 - wallThickness / 2, size.height / 2, 0),
      shape: eastWallShape,
      material: wallMaterial.current,
    });
    addBody(westWallBody);
    bodiesRef.current.push(westWallBody);

    const zoneConfig = MINIGAME_ZONE_CONFIG[config.id as keyof typeof MINIGAME_ZONE_CONFIG];
    if (zoneConfig && (config.id === 'minigame1' || config.id === 'minigame2')) {
      const zonePos = zoneConfig.position;
      const zoneSize = zoneConfig.size;
      const zoneWallHeight = config.id === 'minigame2' ? 4 : 2;
      const zoneWallThickness = 0.1;

      const zoneNorthWallShape = new CANNON.Box(new CANNON.Vec3(zoneSize[0] / 2, zoneWallHeight / 2, zoneWallThickness / 2));
      const zoneNorthWall = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(zonePos[0], zoneWallHeight / 2, zonePos[2] - zoneSize[2] / 2),
        shape: zoneNorthWallShape,
        material: wallMaterial.current,
      });
      addBody(zoneNorthWall);
      bodiesRef.current.push(zoneNorthWall);

      const zoneSouthWall = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(zonePos[0], zoneWallHeight / 2, zonePos[2] + zoneSize[2] / 2),
        shape: zoneNorthWallShape,
        material: wallMaterial.current,
      });
      addBody(zoneSouthWall);
      bodiesRef.current.push(zoneSouthWall);

      const zoneEastWallShape = new CANNON.Box(new CANNON.Vec3(zoneWallThickness / 2, zoneWallHeight / 2, zoneSize[2] / 2));
      const zoneEastWall = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(zonePos[0] + zoneSize[0] / 2, zoneWallHeight / 2, zonePos[2]),
        shape: zoneEastWallShape,
        material: wallMaterial.current,
      });
      addBody(zoneEastWall);
      bodiesRef.current.push(zoneEastWall);

      const zoneWestWall = new CANNON.Body({
        mass: 0,
        position: new CANNON.Vec3(zonePos[0] - zoneSize[0] / 2, zoneWallHeight / 2, zonePos[2]),
        shape: zoneEastWallShape,
        material: wallMaterial.current,
      });
      addBody(zoneWestWall);
      bodiesRef.current.push(zoneWestWall);
    }

  }, [config, addBody, clearBodies, groundMaterial, wallMaterial, size]);

  return (
    <group>
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size.width, size.depth]} />
        <meshBasicMaterial color={floorColor} />
      </mesh>

      <gridHelper 
        args={[size.width, size.width / 2, '#888888', '#666666']} 
        position={[0, 0.01, 0]} 
      />

      <mesh position={[0, size.height, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size.width, size.depth]} />
        <meshBasicMaterial color={wallColor} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, size.height / 2, -size.depth / 2]}>
        <planeGeometry args={[size.width, size.height]} />
        <meshBasicMaterial color={wallColor} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[0, size.height / 2, size.depth / 2]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[size.width, size.height]} />
        <meshBasicMaterial color={wallColor} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[size.width / 2, size.height / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[size.depth, size.height]} />
        <meshBasicMaterial color={wallColor} side={THREE.DoubleSide} />
      </mesh>

      <mesh position={[-size.width / 2, size.height / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[size.depth, size.height]} />
        <meshBasicMaterial color={wallColor} side={THREE.DoubleSide} />
      </mesh>

      {portals.map((portal) => (
        <Portal key={portal.id} portal={portal} />
      ))}

      {config.id === 'minigame1' && (
        <>
          <MiniGameZone 
            position={MINIGAME_ZONE_CONFIG.minigame1.position}
            size={MINIGAME_ZONE_CONFIG.minigame1.size}
            color="#ff6666"
            label="Dice Game"
          />
          <DiceGame 
            position={MINIGAME_ZONE_CONFIG.minigame1.position}
            zoneSize={MINIGAME_ZONE_CONFIG.minigame1.size}
          />
        </>
      )}

      {config.id === 'minigame2' && (
        <>
          <MiniGameZone 
            position={MINIGAME_ZONE_CONFIG.minigame2.position}
            size={MINIGAME_ZONE_CONFIG.minigame2.size}
            color="#66ffff"
            label="Basketball Game"
          />
          <BasketballGame 
            position={MINIGAME_ZONE_CONFIG.minigame2.position}
            zoneSize={MINIGAME_ZONE_CONFIG.minigame2.size}
          />
        </>
      )}

      {config.id === 'minigame3' && (
        <>
          <MiniGameZone 
            position={MINIGAME_ZONE_CONFIG.minigame3.position}
            size={MINIGAME_ZONE_CONFIG.minigame3.size}
            color="#9966ff"
            label="Simon Game"
          />
          <SimonGame 
            position={MINIGAME_ZONE_CONFIG.minigame3.position}
            zoneSize={MINIGAME_ZONE_CONFIG.minigame3.size}
          />
        </>
      )}

      {config.id === 'minigame4' && (
        <MiniGameZone 
          position={MINIGAME_ZONE_CONFIG.minigame4.position}
          size={MINIGAME_ZONE_CONFIG.minigame4.size}
          color="#aa66ff"
          label="Coming Soon"
        />
      )}
    </group>
  );
}

