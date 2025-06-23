
import * as THREE from 'three';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 0, 0);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Parameters
const n = 500; // Number of inner stars
const outerStarCount = 500;
const starSize = 1.0;
const outerStarSize = 15.0;
const r = 10; // Radius of sphere for particle distribution
const outerR = 200;
const speed = 0.02;
const xRot = 0.005;
const yRot = 0.005;
const zRot = 0.005;

let leftRight = 0;
let upDown = 0;
let twist = 0;


// Custom shader for stars
const vertexShader = `
      attribute float size;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        gl_PointSize = size * (50.0 / -mvPosition.z); // Perspective scaling
        gl_Position = projectionMatrix * mvPosition;
      }
    `;

const fragmentShader = `
      void main() {
        float dist = length(gl_PointCoord - vec2(0.5)); // Distance from center
        float intensity = smoothstep(0.5, 0.0, dist); // Core brightness
        float alpha = intensity * (1.0 - dist); // Fade for tail
        gl_FragColor = vec4(1.0, 1.0, 1.0, alpha * 0.8); // White star with fading alpha
      }
    `;

const material = new THREE.ShaderMaterial({
  vertexShader,
  fragmentShader,
  transparent: true,
  blending: THREE.AdditiveBlending,
  depthWrite: false
});

// Outer Stars
const outerStarsGeo = new THREE.BufferGeometry();
const outerPositions = new Float32Array(outerStarCount * 3);
const outerSizes = new Float32Array(outerStarCount); // Size per star

for (let i = 0; i < outerStarCount; i++) {
  outerSizes[i] = outerStarSize+ Math.random() * 10.5;
}

for (let i = 0; i < outerStarCount; i++) {
  // Generate random point inside sphere of radius r
  const theta = Math.random() * 2 * Math.PI;
  const phi = Math.acos(2 * Math.random() - 1);
  const u = 0.9;//Math.random(); // For uniform distribution in sphere
  const outerRadius = outerR * Math.cbrt(u); // Cube root for uniform volume distribution

  const x = outerRadius * Math.sin(phi) * Math.cos(theta);
  const y = outerRadius * Math.sin(phi) * Math.sin(theta);
  const z = outerRadius * Math.cos(phi);

  outerPositions[i * 3] = x;
  outerPositions[i * 3 + 1] = y;
  outerPositions[i * 3 + 2] = z;
}

outerStarsGeo.setAttribute(
  "position",
  new THREE.BufferAttribute(outerPositions, 3)
);
outerStarsGeo.setAttribute("size", new THREE.BufferAttribute(outerSizes, 1));

const outerStars = new THREE.Points(outerStarsGeo, material);
scene.add(outerStars);



// Inner Stars
const particlesGeometry = new THREE.BufferGeometry();
const positions = new Float32Array(n * 3);
//const colors = new Float32Array(n * 3);
const sizes = new Float32Array(n); // Size per star

for (let i = 0; i < n; i++) {
  sizes[i] = starSize;// + Math.random() * 0.1;
}

for (let i = 0; i < n; i++) {
  // Generate random point inside sphere of radius r
  const theta = Math.random() * 2 * Math.PI;
  const phi = Math.acos(2 * Math.random() - 1);
  const u = Math.random(); // For uniform distribution in sphere
  const radius = r * Math.cbrt(u); // Cube root for uniform volume distribution

  const x = radius * Math.sin(phi) * Math.cos(theta);
  const y = radius * Math.sin(phi) * Math.sin(theta);
  const z = radius * Math.cos(phi);

  positions[i * 3] = x;
  positions[i * 3 + 1] = y;
  positions[i * 3 + 2] = z;
}

particlesGeometry.setAttribute(
  "position",
  new THREE.BufferAttribute(positions, 3)
);
particlesGeometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

const stars = new THREE.Points(particlesGeometry, material);
scene.add(stars);


const xAxis = new THREE.Vector3(1,0,0);
const yAxis = new THREE.Vector3(0,1,0);
const zAxis = new THREE.Vector3(0,0,1);
const direction = new THREE.Vector3();
let moveDir = new THREE.Vector3();
let distance = 1.0
let dot = 0.0;


// Do the world updates on a fixed timer
function updatePositions() { 
  camera.rotateOnAxis(xAxis,xRot*upDown);
  camera.rotateOnAxis(yAxis,yRot*leftRight);
  camera.rotateOnAxis(zAxis,zRot*twist);
  
  camera.getWorldDirection(direction); // modifies `direction` in place

  for (let i = 0; i < n; i++) {
    moveDir = direction.clone();
    moveDir.multiplyScalar(-speed);
    positions[i * 3] += moveDir.x;
    positions[i * 3 + 1] += moveDir.y;
    positions[i * 3 + 2] += moveDir.z;

    const particlePos = new THREE.Vector3(
      positions[i * 3],
      positions[i * 3 + 1],
      positions[i * 3 + 2]
    );

    // Calculate distance from origin
    distance = particlePos.length();

    // Compute dot product to determine if particle is in front (hemisphere)
    dot = particlePos.dot(direction);

    if (dot < 0 && distance > r) {
      // recycle points that are too far behind
      recycle(i, direction);
    }
  }

  particlesGeometry.attributes.position.needsUpdate = true;
}

function randomTurn() {
  
  leftRight = Math.floor(Math.random() * 3) - 1;
  upDown = Math.floor(Math.random() * 3) - 1;
  twist = Math.floor(Math.random() * 3) - 1;
  
  randomTimeout = setTimeout(randomTurn, 5000);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function recycle(i, direction) {
  
  const newPos = randomPointOnHemisphere(direction);

  // Update particle position
  positions[i * 3] = newPos.x;
  positions[i * 3 + 1] = newPos.y;
  positions[i * 3 + 2] = newPos.z;
}

function randomPointOnHemisphere(direction) {
  const radius = r;
  // Normalize the direction vector
  const dir = direction.clone().normalize();

  // Sample a random point on the unit sphere using spherical coordinates
  const u = Math.random(); // in [0, 1)
  const v = Math.random(); // in [0, 1)

  const theta = 2 * Math.PI * u;
  const phi = Math.acos(1 - 2 * v); // uniform on sphere

  const x = Math.sin(phi) * Math.cos(theta);
  const y = Math.sin(phi) * Math.sin(theta);
  const z = Math.cos(phi);

  // Create a random point on the unit sphere
  const randomVec = new THREE.Vector3(x, y, z);

  // Create a quaternion that rotates +Z to the direction vector
  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);

  // Rotate the point onto the hemisphere facing the direction vector
  randomVec.applyQuaternion(quaternion);

  // Scale to desired radius
  randomVec.multiplyScalar(radius);

  return randomVec;
}

// Handle window resize
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});


let randomTimeout = 0;
window.addEventListener('keydown', (event) => {
  clearTimeout(randomTimeout);
  if (event.key == 'ArrowRight' || event.key == 'ArrowLeft' || event.key == 'ArrowUp' || event.key == 'ArrowDown') {
    if (randomTimeout > 0) {
      randomTimeout = 0;
      leftRight = 0;
      upDown = 0;
      twist = 0;
    }
    if (event.key === 'ArrowRight') {
      leftRight = -1;
    } else if (event.key === 'ArrowLeft') {
      leftRight = 1;
    } else if (event.key === 'ArrowUp') {
      upDown = 1;
    } else if (event.key === 'ArrowDown') {
      upDown = -1;
    }
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key == 'ArrowRight' || event.key == 'ArrowLeft' || event.key == 'ArrowUp' || event.key == 'ArrowDown') {
    if (event.key === 'ArrowRight') {
      if (leftRight == -1) {
        leftRight = 0;
      }
    } else if (event.key === 'ArrowLeft') {
      if (leftRight == 1) {
        leftRight = 0;
      }
    } else if (event.key === 'ArrowUp') {
      if (upDown = 1) {
        upDown = 0;
      }
    } else if (event.key === 'ArrowDown') {
      if (upDown = -1) {
        upDown = 0;
      }
    }
    if (leftRight == 0 && upDown == 0 && twist == 0) {
      randomTimeout = setTimeout(randomTurn, 10000);
    }
  }
});

const updateInterval = 1000 / 60;
setInterval(updatePositions, updateInterval);
randomTimeout = setTimeout(randomTurn, 10000);

animate();

