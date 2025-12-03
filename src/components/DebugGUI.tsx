import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import GUI from 'lil-gui';
import type { RoomType } from '../types';
import { useGameStore } from '../hooks/useGameStore';
import { PLAYER_CONFIG, PHYSICS_CONFIG } from '../config/rooms';

export function DebugGUI() {
  const guiRef = useRef<GUI | null>(null);
  const { camera } = useThree();
  const { currentRoom, setCurrentRoom, money, setMoney } = useGameStore();

  useEffect(() => {
    if (guiRef.current) return;

    const gui = new GUI({ title: '🎮 Debug Panel' });
    guiRef.current = gui;

    const playerFolder = gui.addFolder('Player');
    playerFolder.add(PLAYER_CONFIG, 'moveSpeed', 5, 30, 1).name('Move Speed');
    playerFolder.add(PLAYER_CONFIG, 'jumpForce', 1, 15, 0.5).name('Jump Force');
    playerFolder.add(PLAYER_CONFIG, 'sprintMultiplier', 1, 3, 0.1).name('Sprint Multiplier');
    playerFolder.add(PLAYER_CONFIG, 'mouseSensitivity', 0.1, 2, 0.05).name('Mouse Sensitivity');
    playerFolder.close();

    const inventoryFolder = gui.addFolder('💰 Inventory');
    const inventoryState = { money: money };
    
    inventoryFolder.add(inventoryState, 'money', 0, 10000, 1)
      .name('Money')
      .listen()
      .onChange((value: number) => {
        setMoney(value);
      });
    
    const quickMoneyActions = {
      add100: () => {
        const newMoney = useGameStore.getState().money + 100;
        setMoney(newMoney);
        inventoryState.money = newMoney;
      },
      add1000: () => {
        const newMoney = useGameStore.getState().money + 1000;
        setMoney(newMoney);
        inventoryState.money = newMoney;
      },
      reset: () => {
        setMoney(100);
        inventoryState.money = 100;
      },
    };
    
    inventoryFolder.add(quickMoneyActions, 'add100').name('+100');
    inventoryFolder.add(quickMoneyActions, 'add1000').name('+1000');
    inventoryFolder.add(quickMoneyActions, 'reset').name('Reset (100)');
    
    const updateMoney = () => {
      inventoryState.money = useGameStore.getState().money;
      requestAnimationFrame(updateMoney);
    };
    updateMoney();
    
    inventoryFolder.open();

    const physicsFolder = gui.addFolder('Physics');
    physicsFolder.add(PHYSICS_CONFIG, 'gravity', -50, 0, 1).name('Gravity');
    physicsFolder.add(PHYSICS_CONFIG, 'groundFriction', 0, 1, 0.1).name('Ground Friction');
    physicsFolder.close();

    const cameraFolder = gui.addFolder('Camera Position');
    const cameraPos = { x: 0, y: 0, z: 0 };
      cameraFolder.add(cameraPos, 'x').name('X').listen().disable();
      cameraFolder.add(cameraPos, 'y').name('Y').listen().disable();
      cameraFolder.add(cameraPos, 'z').name('Z').listen().disable();
    
    // 카메라 위치 업데이트
    const updateCamera = () => {
      cameraPos.x = Math.round(camera.position.x * 100) / 100;
      cameraPos.y = Math.round(camera.position.y * 100) / 100;
      cameraPos.z = Math.round(camera.position.z * 100) / 100;
      requestAnimationFrame(updateCamera);
    };
    updateCamera();
    cameraFolder.close();

    const roomFolder = gui.addFolder('Rooms');
    const roomOptions: { room: RoomType } = {
      room: currentRoom,
    };
    roomFolder.add(roomOptions, 'room', ['main', 'minigame1', 'minigame2', 'minigame3', 'minigame4'])
      .name('Current Room')
      .onChange((value: RoomType) => {
        setCurrentRoom(value);
      });
    roomFolder.close();

    return () => {
      gui.destroy();
      guiRef.current = null;
    };
  }, [camera, currentRoom, setCurrentRoom, money, setMoney]);

  return null;
}
