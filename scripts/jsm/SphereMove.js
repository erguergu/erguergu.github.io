import * as THREE from  'three';

const scene = new THREE.Scene();

// Create a camera with a perspective projection
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// Create a WebGL renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add a sphere at the origin
const radius = 100;
const sphereGeometry = new THREE.SphereGeometry(radius, 32, 32);
const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x0077ff, wireframe: true });
const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
scene.add(sphere);

// Set the initial position of the camera
const cameraDistance = radius + 1;
camera.position.set(0, cameraDistance, 0);

// Define spherical coordinates for the camera position
let phi = 0;  // Start from y-axis
let theta = 0;

// Function to update the camera's position based on spherical coordinates
function updateCameraPosition() {
    // Update camera position using spherical coordinates
    camera.position.x = cameraDistance * Math.sin(phi) * Math.cos(theta);
    camera.position.y = cameraDistance * Math.cos(phi);
    camera.position.z = cameraDistance * Math.sin(phi) * Math.sin(theta);
  
    // Calculate the vector from the origin to the camera
    const direction = new THREE.Vector3(camera.position.x, camera.position.y, camera.position.z).normalize();
  
    // Create a quaternion to represent the rotation needed to align camera "up" away from the sphere
    const quaternion = new THREE.Quaternion();
    quaternion.setFromUnitVectors(camera.up, direction);
  
    // Apply the quaternion rotation to the camera
    camera.quaternion.copy(quaternion);
  }
  

// Initial camera setup
updateCameraPosition();

// Event listener for key presses
document.addEventListener('keydown', (event) => {
  const speed = 0.05;  // Adjust rotation/movement speed

  switch(event.key) {
    case 'ArrowLeft':
      // Rotate left (around local y-axis)
      camera.rotation.y += speed;
      break;

    case 'ArrowRight':
      // Rotate right (around local y-axis)
      camera.rotation.y -= speed;
      break;

    case 'ArrowUp':
    // Move the camera forward along the surface of the sphere
    // Calculate the camera's forward direction vector
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.normalize();

    // Calculate changes in spherical coordinates based on forward vector
    // The forward vector gives us the direction to move on the sphere
    let dPhi = moveSpeed * forward.y;
    let dTheta = moveSpeed * Math.atan2(forward.z, forward.x);

    // Update phi and theta based on the forward direction
    phi -= dPhi;
    theta += dTheta;

    // Clamp phi to be between 0 and Math.PI to stay on the sphere
    phi = Math.max(0, Math.min(Math.PI, phi));

    updateCameraPosition();
    break;

    // Optional: Implement ArrowDown for moving down along the sphere
    case 'ArrowDown':
      phi += speed;
      if (phi > Math.PI) phi = Math.PI;  // Prevent going above the sphere
      updateCameraPosition();
      break;

    default:
      break;
  }
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

animate();
