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
    
    // Movement properties
    walkSpeed: number;
    runSpeed: number;
    
    // Physical dimensions
    height: number;
    radius: number;
    
    // Input state
    input: KeyInput;
    body: CANNON.Body;
    controls: PointerLockControls;
    
    // Object interaction system
    raycaster: THREE.Raycaster;
    screenCenter: THREE.Vector2;
    handBody: CANNON.Body;
    carriedBody: CANNON.Body | null = null;
    isMouseDown: boolean = false;

    // Control state
    enabled: boolean = true; 

    constructor(scene: THREE.Scene, world: CANNON.World, camera: THREE.PerspectiveCamera) {
        this.scene = scene;
        this.world = world;
        this.camera = camera;

        this.walkSpeed = 10; 
        this.runSpeed = 20;  
        
        this.height = 0.8; 
        this.radius = 0.5; 

        // Interaction setup
        this.raycaster = new THREE.Raycaster();
        this.raycaster.far = 4; // Maximum grab distance
        this.screenCenter = new THREE.Vector2(0, 0);

        this.input = { w: false, a: false, s: false, d: false, shift: false };

        this.body = this.initPhysics();
        this.handBody = this.initHandPhysics();
        this.controls = this.initControls();
        
        this.initInteraction();
    }

    // ========== PHYSICS SETUP ==========
    private initPhysics(): CANNON.Body {
        const shape = new CANNON.Sphere(this.radius);
        const body = new CANNON.Body({
            mass: 1,
            position: new CANNON.Vec3(0, 2, 0), 
            shape: shape,
            material: new CANNON.Material({ friction: 0.0, restitution: 0.0 }),
            fixedRotation: true, // Prevent player rotation
        });
        
        body.linearDamping = 0.9; // Movement resistance
        
        this.world.addBody(body);
        return body;
    }

    private initHandPhysics(): CANNON.Body {
        // Kinematic body serves as anchor point for carried objects
        const body = new CANNON.Body({
            type: CANNON.Body.KINEMATIC,
            collisionFilterGroup: 0, // No collisions
            collisionFilterMask: 0
        });
        this.world.addBody(body);
        return body;
    }

    // ========== CONTROL SYSTEM ==========
    private initControls(): PointerLockControls {
        const controls = new PointerLockControls(this.camera, document.body);
        
        // Pointer lock activation
        document.addEventListener('click', () => {
            if (this.enabled) { controls.lock(); }
        });
        
        // Keyboard input handling
        const onKeyDown = (event: KeyboardEvent) => {
            if (!this.enabled) return; 
            switch (event.code) {
                case 'KeyW': this.input.w = true; break; 
                case 'KeyA': this.input.a = true; break;
                case 'KeyS': this.input.s = true; break; 
                case 'KeyD': this.input.d = true; break;
                case 'ShiftLeft': case 'ShiftRight': this.input.shift = true; break;
            }
        };
        
        const onKeyUp = (event: KeyboardEvent) => {
            switch (event.code) {
                case 'KeyW': this.input.w = false; break; 
                case 'KeyA': this.input.a = false; break;
                case 'KeyS': this.input.s = false; break; 
                case 'KeyD': this.input.d = false; break;
                case 'ShiftLeft': case 'ShiftRight': this.input.shift = false; break;
            }
        };
        
        document.addEventListener('keydown', onKeyDown);
        document.addEventListener('keyup', onKeyUp);
        return controls;
    }

    // ========== OBJECT INTERACTION ==========
    private initInteraction() {
        // Mouse input for grabbing objects
        window.addEventListener('mousedown', (event) => {
            if (this.enabled && this.controls.isLocked && event.button === 0) {
                this.isMouseDown = true;
                this.tryGrab();
            }
        });
        
        window.addEventListener('mouseup', (event) => {
            if (event.button === 0) {
                this.isMouseDown = false;
                this.release();
            }
        });
    }

    private tryGrab() {
        if (this.carriedBody) return; // Already carrying something

        // Raycast from camera center to find pickupable objects
        this.raycaster.setFromCamera(this.screenCenter, this.camera);
        const intersects = this.raycaster.intersectObjects(this.scene.children, true);

        for (const intersect of intersects) {
            const mesh = intersect.object as THREE.Mesh;
            if (mesh.userData.isPickupable && mesh.userData.physicsBody) {
                this.grab(mesh.userData.physicsBody as CANNON.Body);
                break; // Only grab one object at a time
            }
        }
    }

    private grab(body: CANNON.Body) {
        this.carriedBody = body;
        
        // Convert to kinematic body for direct position control
        body.type = CANNON.Body.KINEMATIC;
        body.velocity.set(0, 0, 0);
        body.angularVelocity.set(0, 0, 0);
    }

    private release() {
        if (this.carriedBody) {
            // Restore dynamic physics properties
            this.carriedBody.type = CANNON.Body.DYNAMIC;
            this.carriedBody.velocity.copy(this.body.velocity); // Inherit player momentum
            this.carriedBody = null;
        }
    }

    // ========== PUBLIC CONTROL INTERFACE ==========
    setControls(enabled: boolean) {
        this.enabled = enabled;
        if (enabled) {
            this.controls.lock(); // Re-engage pointer lock
        } else {
            this.controls.unlock(); // Release pointer lock
            this.input = { w: false, a: false, s: false, d: false, shift: false }; // Reset input
            this.body.velocity.set(0, 0, 0); // Stop movement
            this.release(); // Drop any carried objects
        }
    }

    // ========== MAIN UPDATE LOOP ==========
    update() {
        // Process movement input when controls are active
        if (this.controls.isLocked && this.enabled) {
            const currentSpeed = this.input.shift ? this.runSpeed : this.walkSpeed;

            // Calculate movement direction vectors
            const direction = new THREE.Vector3();
            const frontVector = new THREE.Vector3(0, 0, Number(this.input.s) - Number(this.input.w));
            const sideVector = new THREE.Vector3(Number(this.input.d) - Number(this.input.a), 0, 0);

            direction.addVectors(frontVector, sideVector).normalize().multiplyScalar(currentSpeed);

            // Convert direction to camera-relative movement
            const euler = new THREE.Euler(0, 0, 0, 'YXZ');
            euler.setFromQuaternion(this.camera.quaternion);
            
            const v_x = Math.sin(euler.y) * direction.z + Math.cos(euler.y) * direction.x;
            const v_z = Math.cos(euler.y) * direction.z - Math.sin(euler.y) * direction.x;

            this.body.velocity.x = v_x;
            this.body.velocity.z = v_z;
        }

        // Synchronize camera with physics body position
        this.camera.position.set(
            this.body.position.x,
            this.body.position.y + this.height, // Camera at eye level
            this.body.position.z
        );

        // Update hand position for object carrying
        const handOffset = new THREE.Vector3(0, 0, -2.5); // Position in front of camera
        handOffset.applyQuaternion(this.camera.quaternion);
        const handPos = this.camera.position.clone().add(handOffset);
        this.handBody.position.copy(handPos as unknown as CANNON.Vec3);

        // Update carried object to follow hand position
        if (this.carriedBody) {
            this.carriedBody.position.copy(this.handBody.position);
            this.carriedBody.quaternion.copy(this.camera.quaternion as unknown as CANNON.Quaternion);
        }
    }
}