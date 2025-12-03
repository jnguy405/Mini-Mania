import { useRef, useEffect } from 'react';
import * as CANNON from 'cannon-es';
import { PHYSICS_CONFIG, PLAYER_CONFIG } from '../config/rooms';

export function usePhysics() {
  const worldRef = useRef<CANNON.World | null>(null);
  const playerBodyRef = useRef<CANNON.Body | null>(null);
  const groundMaterialRef = useRef<CANNON.Material | null>(null);
  const wallMaterialRef = useRef<CANNON.Material | null>(null);
  const bodiesRef = useRef<CANNON.Body[]>([]);

  useEffect(() => {
    // create physics world
    const world = new CANNON.World();
    world.gravity.set(0, PHYSICS_CONFIG.gravity, 0);
    world.broadphase = new CANNON.NaiveBroadphase();
    
    // create materials
    const groundMaterial = new CANNON.Material('ground');
    const wallMaterial = new CANNON.Material('wall');
    const playerMaterial = new CANNON.Material('player');

    // create contact materials
    const playerGroundContact = new CANNON.ContactMaterial(
      playerMaterial,
      groundMaterial,
      {
        friction: PHYSICS_CONFIG.groundFriction,
        restitution: PHYSICS_CONFIG.groundRestitution,
      }
    );
    world.addContactMaterial(playerGroundContact);

    // create contact materials
    const playerWallContact = new CANNON.ContactMaterial(
      playerMaterial,
      wallMaterial,
      {
        friction: PHYSICS_CONFIG.wallFriction,
        restitution: PHYSICS_CONFIG.wallRestitution,
      }
    );
    world.addContactMaterial(playerWallContact);

    // create player body
    const playerShape = new CANNON.Sphere(PLAYER_CONFIG.radius);
    const playerBody = new CANNON.Body({
      mass: PLAYER_CONFIG.mass,
      position: new CANNON.Vec3(0, PLAYER_CONFIG.spawnHeight, 0),
      shape: playerShape,
      material: playerMaterial,
      fixedRotation: true,
      linearDamping: 0,
      angularDamping: 1,
    });
    world.addBody(playerBody);

    worldRef.current = world;
    playerBodyRef.current = playerBody;
    groundMaterialRef.current = groundMaterial;
    wallMaterialRef.current = wallMaterial;

    return () => {
      // cleanup
      bodiesRef.current.forEach(body => world.removeBody(body));
      bodiesRef.current = [];
    };
  }, []);

  const addBody = (body: CANNON.Body) => {
    if (worldRef.current) {
      worldRef.current.addBody(body);
      bodiesRef.current.push(body);
    }
  };

  const removeBody = (body: CANNON.Body) => {
    if (worldRef.current) {
      worldRef.current.removeBody(body);
      bodiesRef.current = bodiesRef.current.filter(b => b !== body);
    }
  };

  const clearBodies = () => {
    if (worldRef.current) {
      bodiesRef.current.forEach(body => worldRef.current!.removeBody(body));
      bodiesRef.current = [];
    }
  };

  const step = (delta: number) => {
    if (worldRef.current) {
      worldRef.current.step(1 / 60, delta, 3);
    }
  };

  return {
    world: worldRef,
    playerBody: playerBodyRef,
    groundMaterial: groundMaterialRef,
    wallMaterial: wallMaterialRef,
    addBody,
    removeBody,
    clearBodies,
    step,
  };
}

