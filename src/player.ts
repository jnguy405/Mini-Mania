import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

interface KeyInput {
    w: boolean;
    a: boolean;
    s: boolean;
    d: boolean;
    shift: boolean;
}

export class Player {
    scene: THREE.Scene;
    world: CANNON.World;
    camera: THREE.PerspectiveCamera;
    
    walkSpeed: number;
    runSpeed: number;
    
    height: number;
    radius: number;
    
    input: KeyInput;
    body: CANNON.Body;
    controls: PointerLockControls;

    // [Important] Flag to disable controls during minigame
    enabled: boolean = true; 

    constructor(scene: THREE.Scene, world: CANNON.World, camera: THREE.PerspectiveCamera) {
        this.scene = scene;
        this.world = world;
        this.camera = camera;

        // Speed settings
        this.walkSpeed = 10; 
        this.runSpeed = 20;  
        
        // Player dimensions (Low POV)
        this.height = 0.8; 
        this.radius = 0.5; 

        this.input = { w: false, a: false, s: false, d: false, shift: false };

        this.body = this.initPhysics();
        this.controls = this.initControls();
    }

    private initPhysics(): CANNON.Body {
        const shape = new CANNON.Sphere(this.radius);
        const body = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(0, 2, 0), // Spawn in air
            shape: shape,
            material: new CANNON.Material({ friction: 0.0, restitution: 0.0 }), // Zero friction (Smooth movement)
            fixedRotation: true, // Prevent rolling
        });
        
        // Damping to stop sliding
        body.linearDamping = 0.9; 
        
        this.world.addBody(body);
        return body;
    }

    private initControls(): PointerLockControls {
        const controls = new PointerLockControls(this.camera, document.body);

        // Lock pointer on click (Start game) - Only if enabled
        document.addEventListener('click', () => {
            if (this.enabled) {
                controls.lock();
            }
        });

        const onKeyDown = (event: KeyboardEvent) => {
            if (!this.enabled) return; // Ignore input if disabled

            switch (event.code) {
                case 'KeyW': this.input.w = true; break;
                case 'KeyA': this.input.a = true; break;
                case 'KeyS': this.input.s = true; break;
                case 'KeyD': this.input.d = true; break;
                case 'ShiftLeft':
                case 'ShiftRight': this.input.shift = true; break;
            }
        };

        const onKeyUp = (event: KeyboardEvent) => {
            // Always detect key up (Prevent stuck keys)
            switch (event.code) {
                case 'KeyW': this.input.w = false; break;
                case 'KeyA': this.input.a = false; break;
                case 'KeyS': this.input.s = false; break;
                case 'KeyD': this.input.d = false; break;
                case 'ShiftLeft':
                case 'ShiftRight': this.input.shift = false; break;
            }
        };

        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);

        return controls;
    }

    // [Important] Toggle controls from external (main.ts)
    setControls(enabled: boolean) {
        this.enabled = enabled;
        if (enabled) {
            this.controls.lock(); // Re-lock pointer
        } else {
            this.controls.unlock(); // Unlock pointer (Show cursor)
            
            // Stop movement
            this.input = { w: false, a: false, s: false, d: false, shift: false };
            this.body.velocity.set(0, 0, 0); 
        }
    }

    update() {
        // Calculate movement only if enabled and locked
        if (this.controls.isLocked && this.enabled) {
            const currentSpeed = this.input.shift ? this.runSpeed : this.walkSpeed;

            const direction = new THREE.Vector3();
            const frontVector = new THREE.Vector3(
                0, 0, Number(this.input.s) - Number(this.input.w)
            );
            const sideVector = new THREE.Vector3(
                Number(this.input.d) - Number(this.input.a), 0, 0
            );

            direction.addVectors(frontVector, sideVector).normalize().multiplyScalar(currentSpeed);

            const euler = new THREE.Euler(0, 0, 0, 'YXZ');
            euler.setFromQuaternion(this.camera.quaternion);
            
            const v_x = Math.sin(euler.y) * direction.z + Math.cos(euler.y) * direction.x;
            const v_z = Math.cos(euler.y) * direction.z - Math.sin(euler.y) * direction.x;

            this.body.velocity.x = v_x;
            this.body.velocity.z = v_z;
        }

        // Camera always follows physics body
        this.camera.position.set(
            this.body.position.x,
            this.body.position.y + this.height,
            this.body.position.z
        );
    }
}