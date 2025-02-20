import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import cardFTexture from "./images/cardFrontTexture.jpg";
import cardBTexture from "./images/cardBackTexture.png";

//Ray Cast
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color("#F0F0F0");

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.x = 7;
camera.position.y = 7;
camera.position.z = 7;

// Texture
const textureLoader = new THREE.TextureLoader();
const cardFrontTexture = textureLoader.load(
  cardFTexture
);
const cardBackTexture = textureLoader.load(
  cardBTexture
);

// Walls and Floor
const wallGeometry = new THREE.BoxGeometry(10, 10, 1);
const wallMaterial = new THREE.MeshLambertMaterial({ color: 0xfffaec });
const wall = new THREE.Mesh(wallGeometry, wallMaterial);
wall.position.y = 5.5;
wall.position.z = -4.5;
scene.add(wall);

const wall2Geometry = new THREE.BoxGeometry(1, 10, 10);
const wall2Material = new THREE.MeshLambertMaterial({ color: 0xf5ecd5 });
const wall2 = new THREE.Mesh(wall2Geometry, wall2Material);
wall2.position.y = 5.5;
wall2.position.x = -4.5;
scene.add(wall2);

const floorGeometry = new THREE.BoxGeometry(10, 1, 10);
const floorMaterial = new THREE.MeshLambertMaterial({ color: 0x3d3d3d });
const floor = new THREE.Mesh(floorGeometry, floorMaterial);
scene.add(floor);

const cards = [];
const sideMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0.8,
  roughness: 0.4,
  reflectivity: 0.8,
  clearcoat: 1,
  clearcoatRoughness: 0.2,
});

const frontMaterial = sideMaterial.clone();
frontMaterial.map = cardFrontTexture;

const backMaterial = sideMaterial.clone();
backMaterial.map = cardBackTexture;

const materials = [
  sideMaterial,
  sideMaterial,
  backMaterial,
  frontMaterial,
  sideMaterial,
  sideMaterial,
];

const cardPositions = [
  { x: 2, y: 0.5, z: 0 },
  { x: 0, y: 0.5, z: 2 },
  { x: -2, y: 0.5, z: 0 },
  { x: 0, y: 0.5, z: -2 },
  { x: 1, y: 0.5, z: 1 },
];

const cardGeometry = new THREE.BoxGeometry(0.5, 0.02, 0.7);

cardPositions.forEach((pos, index) => {
  const cardMaterials = materials.map((material) => material.clone());

  const card = new THREE.Mesh(cardGeometry, cardMaterials);
  card.position.set(pos.x, pos.y, pos.z);
  card.name = `card_${index}`;
  card.userData.originalPosition = new THREE.Vector3(pos.x, pos.y, pos.z);
  card.userData.originalRotation = new THREE.Euler().copy(card.rotation);
  card.userData.hasBeenClicked = false;
  cards.push(card);
  scene.add(card);
});

// Light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(-2, 15, -2);
scene.add(directionalLight);

directionalLight2.position.set(5, 5, 5);
scene.add(directionalLight2);

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Orbit Controls
const control = new OrbitControls(camera, renderer.domElement);
control.enableDamping = true;
control.dampingFactor = 0.2;
control.enableZoom = true;
control.enablePan = false;

// Animation state
let selectedCard = null;
let isAnimating = false;
const targetPosition = new THREE.Vector3();

// Animation Function
function animateCard() {
  if (!selectedCard) return;
  if (isAnimating) {
    const direction = new THREE.Vector3();
    camera.getWorldDirection(direction);
    const newTargetPosition = new THREE.Vector3()
      .copy(camera.position)
      .add(direction.multiplyScalar(0.8));
    targetPosition.lerp(newTargetPosition, 0.1);

    const quaternion = new THREE.Quaternion();
    camera.getWorldQuaternion(quaternion);
    const verticalRotation = new THREE.Quaternion().setFromEuler(
      new THREE.Euler(Math.PI / 2, Math.PI, Math.PI)
    );
    quaternion.multiply(verticalRotation);
    selectedCard.quaternion.slerp(quaternion, 0.03);
    selectedCard.userData.hasBeenClicked = true;
  } else {
    targetPosition.copy(selectedCard.userData.originalPosition);
    const targetRotation = new THREE.Quaternion().setFromEuler(
      selectedCard.userData.hasBeenClicked
        ? (selectedCard.userData.originalRotation = new THREE.Euler(
            0,
            0,
            Math.PI
          ))
        : selectedCard.userData.originalRotation
    );
    selectedCard.quaternion.slerp(targetRotation, 0.03);
  }

  selectedCard.position.lerp(targetPosition, 0.03);

  if (
    !isAnimating &&
    selectedCard.position.distanceTo(selectedCard.userData.originalPosition) <
      0.01 &&
    selectedCard.quaternion.angleTo(
      new THREE.Quaternion().setFromEuler(
        selectedCard.userData.originalRotation
      )
    ) < 0.01
  ) {
    selectedCard = null;
  }
}

// Click Event Handler
window.addEventListener("click", (event) => {
  if (cards.length === 0) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(cards);

  if (intersects.length > 0) {
    const clickedCard = intersects[0].object;

    if (selectedCard && selectedCard !== clickedCard) {
      isAnimating = false;
    }

    if (!selectedCard || selectedCard === clickedCard) {
      selectedCard = clickedCard;
      isAnimating = !isAnimating;
    }
  }
});

// Resize Event Handler
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animation Loop
function animate() {
  requestAnimationFrame(animate);
  animateCard();
  control.update();
  renderer.render(scene, camera);
}

// Debug Helper
const gridHelper = new THREE.GridHelper(100, 100);
scene.add(gridHelper);

animate();
