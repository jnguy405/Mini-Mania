import { useEffect, useRef, useCallback } from 'react';

interface KeyState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  sprint: boolean;
  interact: boolean;
}

export function useKeyboard() {
  const keys = useRef<KeyState>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    jump: false,
    sprint: false,
    interact: false,
  });

  const interactPressed = useRef(false);

  const resetInteract = useCallback(() => {
    keys.current.interact = false;
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
          keys.current.forward = true;
          break;
        case 'KeyS':
          keys.current.backward = true;
          break;
        case 'KeyA':
          keys.current.left = true;
          break;
        case 'KeyD':
          keys.current.right = true;
          break;
        case 'Space':
          keys.current.jump = true;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keys.current.sprint = true;
          break;
        case 'KeyE':
          if (!interactPressed.current) {
            keys.current.interact = true;
            interactPressed.current = true;
          }
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
          keys.current.forward = false;
          break;
        case 'KeyS':
          keys.current.backward = false;
          break;
        case 'KeyA':
          keys.current.left = false;
          break;
        case 'KeyD':
          keys.current.right = false;
          break;
        case 'Space':
          keys.current.jump = false;
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keys.current.sprint = false;
          break;
        case 'KeyE':
          keys.current.interact = false;
          interactPressed.current = false;
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  return { keys, resetInteract };
}
