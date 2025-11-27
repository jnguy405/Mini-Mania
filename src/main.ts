import './style.css'
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Player } from './player';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Inventory } from './inventory';
import { SimonGame } from './SimonGame';
import { PickupBlock } from './PickupBlock';

// ========== UI ELEMENTS ==========
const promptDiv = document.createElement('div');
promptDiv.id = 'interaction-prompt';
promptDiv.innerText = "[E] Start Minigame";
document.body.appendChild(promptDiv);

const clearScreen = document.createElement('div');
clearScreen.style.position = 'absolute';
clearScreen.style.top = '0';
clearScreen.style.left = '0';
clearScreen.style.width = '100%';
clearScreen.style.height = '100%';
clearScreen.style.backgroundColor = 'black';
clearScreen.style.color = '#44ff44'; 
clearScreen.style.display = 'none';
clearScreen.style.flexDirection = 'column';
clearScreen.style.alignItems = 'center';
clearScreen.style.justifyContent = 'center';
clearScreen.style.zIndex = '9999';
clearScreen.innerHTML = `
    <h1 style="font-size: 5rem; text-shadow: 0 0 20px currentColor;">YOU ESCAPED</h1>
    <p style="font-size: 1.5rem; margin-top: 20px;">The Backrooms have been conquered.</p>
    <button onclick="location.reload()" style="margin-top: 40px; padding: 10px 30px; font-size: 1.2rem; cursor: pointer; background: #222; color: white; border: 1px solid #44ff44;">PLAY AGAIN</button>
`;
document.body.appendChild(clearScreen);

// ========== SCENE SETUP ==========
const scene = new THREE.Scene();
const monoColor = new THREE.Color(0xd1c485); 
const lightColor = new THREE.Color(0xffffee); 
const fogColor = new THREE.Color(0xd1c485); 

scene.background = fogColor;
scene.fog = new THREE.Fog(fogColor, 7, 50); 

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.2, 1000);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0; 
document.body.appendChild(renderer.domElement);

// ========== LIGHTING SETUP ==========
const flashLight = new THREE.SpotLight(0xffffff, 2.5, 40, Math.PI / 6, 0.5, 1);
flashLight.position.set(0, 0, 0); 
flashLight.target.position.set(0, 0, -1); 
camera.add(flashLight); 
camera.add(flashLight.target);
scene.add(camera); 

const ambientLight = new THREE.AmbientLight(0xffffff, 0.4); 
scene.add(ambientLight);

const fluorescentLights: THREE.PointLight[] = []; 
for (let x = -60; x <= 60; x += 30) { 
    for (let z = -60; z <= 60; z += 30) {
        const pointLight = new THREE.PointLight(lightColor, 0.8, 60, 1.2);
        pointLight.position.set(x, 9.9, z); 
        pointLight.castShadow = false;
        scene.add(pointLight);
        fluorescentLights.push(pointLight);
    }
}

// ========== GAME SYSTEMS ==========
const inventory = new Inventory();
let isGameActive = false;
let currentNearbyTrigger: TriggerObj | null = null;
let isFinalTriggerNear = false; 

const simonGame = new SimonGame(
    (rewardColor) => {
        inventory.addItem(rewardColor);
        console.log(`Item acquired: ${rewardColor}`);
        if (currentNearbyTrigger) {
            currentNearbyTrigger.active = false;
            currentNearbyTrigger.mesh.visible = false; 
        }
        checkWinCond();
    },
    () => {
        isGameActive = false;
        player.setControls(true);
        promptDiv.style.display = 'none';
    }
);

// ========== PHYSICS WORLD ==========
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
const defaultMaterial = new CANNON.Material('default');
const defaultContactMaterial = new CANNON.ContactMaterial(defaultMaterial, defaultMaterial, { friction: 0.5, restitution: 0.0 });
world.addContactMaterial(defaultContactMaterial);

// ========== ENVIRONMENT SETUP ==========
const commonMat = new THREE.MeshStandardMaterial({ color: monoColor, roughness: 0.8, side: THREE.DoubleSide });

// Floor
const floorMesh = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), commonMat);
floorMesh.rotation.x = -Math.PI / 2;
floorMesh.position.y = -0.01; 
scene.add(floorMesh);
const floorBody = new CANNON.Body({ type: CANNON.Body.STATIC, shape: new CANNON.Plane(), material: defaultMaterial });
floorBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
floorBody.position.y = 1; 
world.addBody(floorBody);

// Ceiling
const ceilingMesh = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), commonMat);
ceilingMesh.rotation.x = Math.PI / 2; 
ceilingMesh.position.y = 10.0; 
scene.add(ceilingMesh);

// ========== LEVEL GEOMETRY LOADING ==========
function createTrimeshBody(mesh: THREE.Mesh): CANNON.Body | null {
    const geometry = mesh.geometry;
    const vertices = [];
    const posAttr = geometry.attributes.position;
    for (let i = 0; i < posAttr.count; i++) {
        vertices.push(posAttr.getX(i), posAttr.getY(i), posAttr.getZ(i));
    }
    const indices = [];
    if (geometry.index) {
        for (let i = 0; i < geometry.index.count; i++) {
            indices.push(geometry.index.getX(i));
        }
    } else {
        for (let i = 0; i < posAttr.count; i++) {
            indices.push(i);
        }
    }
    const shape = new CANNON.Trimesh(vertices, indices);
    shape.setScale(new CANNON.Vec3(mesh.scale.x, mesh.scale.y, mesh.scale.z));
    const body = new CANNON.Body({ type: CANNON.Body.STATIC, shape: shape, material: defaultMaterial });
    body.position.copy(mesh.position as unknown as CANNON.Vec3);
    body.quaternion.copy(mesh.quaternion as unknown as CANNON.Quaternion);
    return body;
}

const gltfLoader = new GLTFLoader();
gltfLoader.load(import.meta.env.BASE_URL + 'back1.glb', (gltf) => {
    const model = gltf.scene;
    scene.add(model);
    model.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = false;
            mesh.receiveShadow = false;
            mesh.material = commonMat; 
            if (mesh.userData.isCollider) {
                const body = createTrimeshBody(mesh);
                if (body) world.addBody(body);
            }
        }
    });
});

// ========== INTERACTIVE OBJECTS ==========
const pickupBlocks: PickupBlock[] = [];
const block1 = new PickupBlock(scene, world, new THREE.Vector3(2, 3, 2), defaultMaterial);
pickupBlocks.push(block1);

// Minigame triggers
interface TriggerObj {
    position: THREE.Vector3;
    color: string;
    active: boolean;
    mesh: THREE.Mesh;
}
const triggers: TriggerObj[] = [];

function createTriggerBox(x: number, z: number, color: string) {
    const geometry = new THREE.BoxGeometry(1.0, 1.0, 1.0);
    const material = new THREE.MeshBasicMaterial({ 
        color: 0xff0000, 
        wireframe: true,
        transparent: true,
        opacity: 0.7
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, 1.5, z); 
    scene.add(mesh);
    triggers.push({ position: new THREE.Vector3(x, 1.5, z), color: color, active: true, mesh: mesh });
}

createTriggerBox(-34.83, -30.99, 'red'); 
createTriggerBox(27.80, -5.88, 'blue');   
createTriggerBox(-34.47, 34.98, 'green'); 

// Final escape trigger
const finalBoxGeo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const finalBoxMat = new THREE.MeshBasicMaterial({ 
    color: 0x0000ff, 
    wireframe: true,
    transparent: true,
    opacity: 0.9 
});
const finalTriggerMesh = new THREE.Mesh(finalBoxGeo, finalBoxMat);
finalTriggerMesh.position.set(0, 1.5, 0); 
finalTriggerMesh.visible = false; 
scene.add(finalTriggerMesh);

let isFinalTriggerActive = false; 

// Pressure plate puzzle
const btnPos = new THREE.Vector3(-4.73, 1.05, -22.87);

const btnGeo = new THREE.CylinderGeometry(0.8, 0.8, 0.1, 32);
const btnMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0x330000 });
const btnMesh = new THREE.Mesh(btnGeo, btnMat);
btnMesh.position.copy(btnPos);
btnMesh.receiveShadow = true;
scene.add(btnMesh);

const btnShape = new CANNON.Box(new CANNON.Vec3(0.6, 0.05, 0.6)); 
const btnBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: btnShape,
    material: defaultMaterial
});
btnBody.position.copy(btnPos as unknown as CANNON.Vec3);
world.addBody(btnBody);

const btnLight = new THREE.PointLight(0x00ff00, 0, 3);
btnLight.position.set(btnPos.x, 2.0, btnPos.z); 
scene.add(btnLight);

let isBtnActive = false;

// ========== GAME LOGIC ==========
function checkWinCond() {
    const hasAllItems = inventory.hasItem('red') && inventory.hasItem('blue') && inventory.hasItem('green');
    
    if (hasAllItems && isBtnActive && !isFinalTriggerActive) {
        console.log("Escape route opened!");
        finalTriggerMesh.visible = true;
        isFinalTriggerActive = true;
    } else if (isFinalTriggerActive && (!hasAllItems || !isBtnActive)) {
        finalTriggerMesh.visible = false;
        isFinalTriggerActive = false;
        console.log("Escape route closed!");
    }
}

function updateBtnState() {
    let pressed = false;
    pickupBlocks.forEach(block => {
        const dist = new THREE.Vector2(block.mesh.position.x, block.mesh.position.z)
            .distanceTo(new THREE.Vector2(btnPos.x, btnPos.z));
            
        if (dist < 0.8 && Math.abs(block.mesh.position.y - btnPos.y) < 1.0) {
            pressed = true;
        }
    });

    if (pressed !== isBtnActive) {
        isBtnActive = pressed;
        if (pressed) {
            console.log("🔘 Button Pressed!");
            btnMesh.material.color.setHex(0x00ff00);
            btnMesh.material.emissive.setHex(0x004400);
            btnLight.intensity = 1.5;
        } else {
            console.log("⚪ Button Released!");
            btnMesh.material.color.setHex(0xff0000);
            btnMesh.material.emissive.setHex(0x330000);
            btnLight.intensity = 0;
        }
        checkWinCond();
    }
}

// ========== PLAYER CONTROLS ==========
const player = new Player(scene, world, camera);

window.addEventListener('keydown', (event) => {
    if (isGameActive) return; 

    if (event.code === 'KeyE') {
        if (currentNearbyTrigger && !inventory.hasItem(currentNearbyTrigger.color)) {
            console.log("Starting Minigame!");
            isGameActive = true;
            player.setControls(false);
            promptDiv.style.display = 'none';
            simonGame.show(currentNearbyTrigger.color);
        }
        else if (isFinalTriggerNear && isFinalTriggerActive) {
            player.setControls(false); 
            document.exitPointerLock(); 
            clearScreen.style.display = 'flex'; 
            promptDiv.style.display = 'none';
        }
    }
});

// ========== MAIN GAME LOOP ==========
const clock = new THREE.Clock();

function animate() {
    requestAnimationFrame(animate);
    const dt = clock.getDelta();

    world.step(1 / 60, dt, 3);
    
    if (!isGameActive) {
        player.update();

        const playerPos = player.body.position;
        const pVec = new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z);
        
        let foundMiniGame = false;
        triggers.forEach(trigger => {
            if (!trigger.active) return;
            
            const distSq = (pVec.x - trigger.position.x) ** 2 + (pVec.z - trigger.position.z) ** 2;
            if (distSq < 9) {
                foundMiniGame = true;
                currentNearbyTrigger = trigger;
                
                if (!inventory.hasItem(trigger.color)) {
                    promptDiv.innerText = `[E] Get ${trigger.color} Item`;
                    promptDiv.style.display = 'block';
                    
                    // Rotate box
                    trigger.mesh.rotation.x += 0.02;
                    trigger.mesh.rotation.y += 0.03;
                    trigger.mesh.rotation.z += 0.01;
                } else {
                    promptDiv.style.display = 'none';
                }
            }
        });

        isFinalTriggerNear = false;
        if (isFinalTriggerActive) {
            const distToFinal = pVec.distanceTo(finalTriggerMesh.position);
            if (distToFinal < 3.0) { 
                isFinalTriggerNear = true;
                if (!foundMiniGame) {
                    promptDiv.innerText = "[E] Escape";
                    promptDiv.style.color = "#44ff44"; 
                    promptDiv.style.display = 'block';
                }
            }
        }

        if (!foundMiniGame && !isFinalTriggerNear) {
            currentNearbyTrigger = null;
            promptDiv.style.display = 'none';
            promptDiv.style.color = "white"; 
        }
    }

    pickupBlocks.forEach(block => block.update());
    updateBtnState();

    // Lighting effects
    fluorescentLights.forEach(light => {
        const flicker = Math.random() > 0.99 ? Math.random() * 0.2 + 0.8 : 1;
        light.intensity = 0.8 * flicker;
    });

    if (isFinalTriggerActive) {
        finalTriggerMesh.rotation.x += 0.01;
        finalTriggerMesh.rotation.y += 0.02;
        finalTriggerMesh.rotation.z += 0.01;
    }

    renderer.render(scene, camera);
}

animate();

// ========== WINDOW MANAGEMENT ==========
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('keydown', (event) => {
    if (event.code === 'KeyP') {
        const pos = player.body.position;
        console.log(`📍 Position: x=${pos.x.toFixed(2)}, z=${pos.z.toFixed(2)}`);
    }
});