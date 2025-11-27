import * as THREE from 'three';
import * as CANNON from 'cannon-es';

// Interactive physics block that can be picked up and moved by players
export class PickupBlock {
    mesh: THREE.Mesh;
    body: CANNON.Body;

    constructor(
        scene: THREE.Scene, 
        world: CANNON.World, 
        position: THREE.Vector3, 
        material: CANNON.Material
    ) {
        const size = 1.0;

        // Visual representation - orange box with realistic lighting
        const geo = new THREE.BoxGeometry(size, size, size);
        const mat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.7 });
        this.mesh = new THREE.Mesh(geo, mat);
        this.mesh.position.copy(position);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // Physics body - slightly smaller collision box to prevent wall sticking
        // Uses box shape for stable stacking behavior on floors
        const shape = new CANNON.Box(new CANNON.Vec3(size / 2 * 0.95, size / 2 * 0.95, size / 2 * 0.95));
        this.body = new CANNON.Body({
            mass: 5, // Heavy enough to feel substantial, light enough to move
            position: new CANNON.Vec3(position.x, position.y, position.z),
            shape: shape,
            material: material
        });
        this.body.angularDamping = 0.5; // Prevents excessive spinning

        // Enable player interaction - Player.ts checks this userData
        this.mesh.userData = {
            isPickupable: true,
            physicsBody: this.body
        };

        // Add to respective simulation worlds
        scene.add(this.mesh);
        world.addBody(this.body);
    }

    /**
     * Synchronizes visual mesh with physics body state
     * Called every frame to reflect physics simulation results
     */
    update() {
        this.mesh.position.copy(this.body.position as unknown as THREE.Vector3);
        this.mesh.quaternion.copy(this.body.quaternion as unknown as THREE.Quaternion);
    }
}