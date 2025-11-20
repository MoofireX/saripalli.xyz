import * as THREE from 'three';
import gsap from 'gsap';

// --- Configuration ---
const CONFIG = {
  particleCount: 2000,
  particleSize: 0.02,
  color1: 0x6c5ae6, // Royal Blue
  color2: 0x00f3ff, // Cyan
};

// --- Scene Setup ---
const canvas = document.querySelector('#bg-canvas');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.002); // Fog for depth

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
  antialias: true,
  alpha: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

// --- Raycaster Setup ---
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let isHovering = false;

// --- Objects ---
// Create a particle system
const particlesGeometry = new THREE.BufferGeometry();
const posArray = new Float32Array(CONFIG.particleCount * 3);
const colorsArray = new Float32Array(CONFIG.particleCount * 3);

const color1 = new THREE.Color(CONFIG.color1);
const color2 = new THREE.Color(CONFIG.color2);

for (let i = 0; i < CONFIG.particleCount * 3; i += 3) {
  // Position
  posArray[i] = (Math.random() - 0.5) * 15;     // x
  posArray[i + 1] = (Math.random() - 0.5) * 15;   // y
  posArray[i + 2] = (Math.random() - 0.5) * 15;   // z

  // Color mix
  const mixedColor = color1.clone().lerp(color2, Math.random());
  colorsArray[i] = mixedColor.r;
  colorsArray[i + 1] = mixedColor.g;
  colorsArray[i + 2] = mixedColor.b;
}

particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
particlesGeometry.setAttribute('color', new THREE.BufferAttribute(colorsArray, 3));

const particlesMaterial = new THREE.PointsMaterial({
  size: CONFIG.particleSize,
  vertexColors: true,
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending
});

const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
scene.add(particlesMesh);

// --- Robot Head Icon Setup ---
const robotGroup = new THREE.Group();
scene.add(robotGroup);

// Materials
const armorMaterial = new THREE.MeshStandardMaterial({
  color: 0x09090e, // Cinder
  metalness: 0.8,
  roughness: 0.2,
  emissive: 0x6c5ae6, // Royal Blue tint
  emissiveIntensity: 0.2
});

const glowMaterial = new THREE.MeshBasicMaterial({
  color: 0x00f3ff, // Cyan
});

const screenMaterial = new THREE.MeshBasicMaterial({
  color: 0x00f3ff, // Cyan Screen
  transparent: true,
  opacity: 0
});

// Head
const headGeo = new THREE.BoxGeometry(1.2, 1, 1);
const head = new THREE.Mesh(headGeo, armorMaterial);
robotGroup.add(head);

// Eyes Group (to hide easily)
const eyesGroup = new THREE.Group();
head.add(eyesGroup);

const eyeGeo = new THREE.SphereGeometry(0.15, 16, 16);
const leftEye = new THREE.Mesh(eyeGeo, glowMaterial);
leftEye.position.set(-0.3, 0.1, 0.5);
eyesGroup.add(leftEye);

const rightEye = new THREE.Mesh(eyeGeo, glowMaterial);
rightEye.position.set(0.3, 0.1, 0.5);
eyesGroup.add(rightEye);

// Antenna Group (to hide easily)
const antennaGroup = new THREE.Group();
head.add(antennaGroup);

const antennaStemGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.5);
const antennaStem = new THREE.Mesh(antennaStemGeo, armorMaterial);
antennaStem.position.set(0, 0.75, 0);
antennaGroup.add(antennaStem);

const antennaTipGeo = new THREE.SphereGeometry(0.1, 16, 16);
const antennaTip = new THREE.Mesh(antennaTipGeo, glowMaterial);
antennaTip.position.set(0, 0.25, 0);
antennaStem.add(antennaTip);

// Screen Face (Hidden initially)
const screenFaceGeo = new THREE.PlaneGeometry(1.1, 0.9);
const screenFace = new THREE.Mesh(screenFaceGeo, screenMaterial);
screenFace.position.set(0, 0, 0.51); // Slightly in front of face
head.add(screenFace);

// Add Lights
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const pointLight = new THREE.PointLight(CONFIG.color2, 1);
pointLight.position.set(2, 3, 4);
scene.add(pointLight);

// --- Positioning Helper ---
function updateRobotPosition() {
  // Position at top left based on camera view
  // We need to project from screen coordinates to world coordinates
  // Top-Left is roughly (-aspectRatio * visibleHeight/2, visibleHeight/2)

  // Simple approximation for z=0
  const dist = camera.position.z;
  const vFOV = THREE.MathUtils.degToRad(camera.fov);
  const height = 2 * Math.tan(vFOV / 2) * dist;
  const width = height * camera.aspect;

  // Position with padding
  robotGroup.position.set(width / 2 - 1.5, height / 2 - 1.5, 0);
}
updateRobotPosition();

// --- Animation Loop ---
const clock = new THREE.Clock();
let mouseX = 0;
let mouseY = 0;

// Mouse interaction
window.addEventListener('mousemove', (event) => {
  // Normalized coordinates for Raycaster
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // For parallax
  mouseX = event.clientX / window.innerWidth - 0.5;
  mouseY = event.clientY / window.innerHeight - 0.5;
});

// Floating Animation Variables
let floatTime = 0;
let isOpen = false; // Is the tablet open?

function animate() {
  const elapsedTime = clock.getElapsedTime();
  floatTime += 0.02;

  // Rotate entire particle system slowly
  particlesMesh.rotation.y = elapsedTime * 0.05;
  particlesMesh.rotation.x = elapsedTime * 0.02;

  // Interactive rotation based on mouse
  particlesMesh.rotation.y += mouseX * 0.05;
  particlesMesh.rotation.x += mouseY * 0.05;

  // --- Robot Animation ---
  if (!isOpen) {
    // Float only when closed
    robotGroup.position.y += Math.sin(floatTime) * 0.002; // Subtle float on top of position

    // Look at mouse (clamped)
    const targetRotationX = mouseY * 0.5;
    const targetRotationY = mouseX * 0.5;

    robotGroup.rotation.x += (targetRotationX - robotGroup.rotation.x) * 0.1;
    robotGroup.rotation.y += (targetRotationY - robotGroup.rotation.y) * 0.1;
  }

  // --- Raycasting ---
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects([head], true);

  if (intersects.length > 0 && !isOpen) {
    if (!isHovering) {
      document.body.style.cursor = 'pointer';
      gsap.to(robotGroup.scale, { x: 1.1, y: 1.1, z: 1.1, duration: 0.3 });
      isHovering = true;
    }
  } else {
    if (isHovering) {
      document.body.style.cursor = 'default';
      gsap.to(robotGroup.scale, { x: 1, y: 1, z: 1, duration: 0.3 });
      isHovering = false;
    }
  }

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

animate();

// --- Resize Handling ---
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  if (!isOpen) {
    updateRobotPosition();
  }
});

// --- Intro Animation ---
gsap.from(robotGroup.scale, { x: 0, y: 0, z: 0, duration: 1, ease: "back.out(1.7)", delay: 0.5 });
gsap.to(".project-card", { autoAlpha: 1, duration: 0.5, stagger: 0.1, delay: 1.5 });

// --- Interaction Logic ---
const tabletOverlay = document.getElementById('tablet-overlay');
const closeBtn = document.getElementById('close-tablet');

// Click on Robot
window.addEventListener('click', () => {
  if (isHovering && !isOpen) {
    isOpen = true;
    isHovering = false; // Reset hover state
    document.body.style.cursor = 'default';

    // Hide Main UI
    gsap.to(".hero", { autoAlpha: 0, duration: 0.5 });
    gsap.to(".project-card", { autoAlpha: 0, duration: 0.5, stagger: 0.1 });

    // Transition Animation
    const tl = gsap.timeline();

    // 1. Move to Center & Rotate to Face Front
    tl.to(robotGroup.position, { x: 0, y: 0, z: 2, duration: 1, ease: "power2.inOut" })
      .to(robotGroup.rotation, { x: 0, y: 0, z: 0, duration: 1, ease: "power2.inOut" }, "<")

      // 2. Transform to Screen
      .to([eyesGroup.scale, antennaGroup.scale], { x: 0, y: 0, z: 0, duration: 0.3 }, "-=0.3")
      .to(head.scale, { x: 3, y: 4, z: 0.1, duration: 0.8, ease: "back.out(1.2)" }) // Flatten and widen
      .to(screenMaterial, { opacity: 1, duration: 0.5 }, "-=0.5")

      // 3. Show Overlay
      .to(tabletOverlay, { scale: 1, opacity: 1, duration: 0.5, onStart: () => tabletOverlay.classList.add('active') });
  }
});

// Close Button
closeBtn.addEventListener('click', () => {
  // Hide Overlay
  gsap.to(tabletOverlay, { scale: 0, opacity: 0, duration: 0.3, onComplete: () => tabletOverlay.classList.remove('active') });

  // Reverse Transition
  const tl = gsap.timeline({ onComplete: () => { isOpen = false; updateRobotPosition(); } });

  tl.to(screenMaterial, { opacity: 0, duration: 0.3 })
    .to(head.scale, { x: 1, y: 1, z: 1, duration: 0.5, ease: "back.in(1.2)" })
    .to([eyesGroup.scale, antennaGroup.scale], { x: 1, y: 1, z: 1, duration: 0.3 }, "-=0.2")

    // Return to Corner
    .to(robotGroup.position, {
      x: () => {
        const dist = camera.position.z;
        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const height = 2 * Math.tan(vFOV / 2) * dist;
        const width = height * camera.aspect;
        return width / 2 - 1.5;
      },
      y: () => {
        const dist = camera.position.z;
        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        const height = 2 * Math.tan(vFOV / 2) * dist;
        return height / 2 - 1.5;
      },
      z: 0,
      duration: 1,
      ease: "power2.inOut"
    })

    // Show UI
    .to(".hero", { autoAlpha: 1, duration: 0.5 }, "-=0.5")
    .to(".project-card", { autoAlpha: 1, duration: 0.5, stagger: 0.1 }, "-=0.5");
});
