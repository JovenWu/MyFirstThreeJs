import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

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

// Object
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

//Card
const cardGeometry = new THREE.BoxGeometry(0.5, 0.05, 0.7);
const cardMaterial = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0.8,
  roughness: 0.4,
  reflectivity: 0.8,
  clearcoat: 1,
  clearcoatRoughness: 0.2,
});
const card = new THREE.Mesh(cardGeometry, cardMaterial);
card.position.y = 0.5;
card.position.x = 2;
card.name = "card";
scene.add(card);

// Light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
const directionalLight2 = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(-2, 15, -2);
scene.add(directionalLight);

directionalLight2.position.set(5, 5, 5);
scene.add(directionalLight2);

// Render
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Orbit Controls
const control = new OrbitControls(camera, renderer.domElement);
control.enebaleDamping = true;
control.dampingFactor = 0.2;
control.enableZoom = true;
control.enablePan = false;

// Animation variables
const originalCardPosition = new THREE.Vector3();
const originalCardRotation = new THREE.Euler();
const targetPosition = new THREE.Vector3();
let isAnimating = false;
let selectedCard = null;

//Animation Function
function animateCard() {
  if (!selectedCard) return;

  if (isAnimating) {
      const direction = new THREE.Vector3();
      camera.getWorldDirection(direction);
      targetPosition.copy(camera.position).add(direction.multiplyScalar(0.7));

      const quaternion = new THREE.Quaternion();
      camera.getWorldQuaternion(quaternion);
      const verticalRotation = new THREE.Quaternion().setFromEuler(
          new THREE.Euler(Math.PI / 2, 0, 0)
      );
      quaternion.multiply(verticalRotation);
      selectedCard.quaternion.slerp(quaternion, 0.05);
  } else {
      targetPosition.copy(originalCardPosition);
      selectedCard.quaternion.slerp(new THREE.Quaternion().setFromEuler(originalCardRotation), 0.05);
  }

  selectedCard.position.lerp(targetPosition, 0.05);

  if (!isAnimating && selectedCard.position.distanceTo(originalCardPosition) < 0.01) {
      selectedCard = null;
  }
}
//Click able Object
const clickableObjects = [card];

//Event Listener for Click

window.addEventListener("click", (event) => {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(clickableObjects);

  if (intersects.length > 0) {
      if (!selectedCard) {
          selectedCard = intersects[0].object;
          originalCardPosition.copy(selectedCard.position);
          originalCardRotation.copy(selectedCard.rotation);
      }
      isAnimating = !isAnimating;
  }
});

//Event listener for Resizing
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
})

// Animate
function animate() {
  requestAnimationFrame(animate);
  animateCard();

  control.update();
  renderer.render(scene, camera);
}

animate();

//! Debug Stuff
const gridHelper = new THREE.GridHelper(100, 100);
scene.add(gridHelper);
