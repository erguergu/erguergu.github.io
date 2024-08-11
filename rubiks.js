// Assuming you have already set up your scene, camera, and renderer

// Function to create a cube with independent face colors
function createColoredCube(faceColors) {
    // Validate input
    if (!Array.isArray(faceColors) || faceColors.length !== 6) {
        throw new Error('faceColors must be an array of 6 colors.');
    }

    // Create a geometry for the cube
    const geometry = new THREE.BoxGeometry();

    // Create an array to hold the materials
    const materials = faceColors.map(color => new THREE.MeshBasicMaterial({ color }));

    // Create the mesh with the geometry and materials
    const cube = new THREE.Mesh(geometry, materials);

    return cube;
}

// Function to create a 3x3x3 matrix of cubes
function createCubeMatrix(cubeSize, spacing, faceColors) {
    const matrixSize = 3; // 3x3x3 matrix

    // Create a container for all cubes
    const container = new THREE.Group();

    // Loop through each position in the matrix
    for (let x = 0; x < matrixSize; x++) {
        for (let y = 0; y < matrixSize; y++) {
            for (let z = 0; z < matrixSize; z++) {
                // Create a colored cube
                const coloredCube = createColoredCube(faceColors);

                // Set the position of the cube
                coloredCube.position.set(
                    x * (cubeSize + spacing) - (matrixSize - 1) * (cubeSize + spacing) / 2,
                    y * (cubeSize + spacing) - (matrixSize - 1) * (cubeSize + spacing) / 2,
                    z * (cubeSize + spacing) - (matrixSize - 1) * (cubeSize + spacing) / 2
                );

                // Add the cube to the container
                container.add(coloredCube);
            }
        }
    }

    return container;
}

// Function to revolve an object around a given point
function revolveObject(object, point, angle, axis) {
    // Step 1: Translate the object to make the point of revolution the origin
    object.position.sub(point);

    // Step 2: Rotate the object around the given axis
    object.rotateOnAxis(axis, angle);

    // Step 3: Translate the object back to its original position
    object.position.add(point);
}

// Example usage:
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Define colors for each face (six colors, one for each face)
const faceColors = [
    0xff0000, // Red
    0x00ff00, // Green
    0x0000ff, // Blue
    0xffff00, // Yellow
    0xff00ff, // Magenta
    0x00ffff  // Cyan
];

// Create a 3x3x3 matrix of colored cubes
const cubeSize = 1; // Size of each cube
const spacing = 0.1; // Spacing between cubes
const cubeMatrix = createCubeMatrix(cubeSize, spacing, faceColors);
scene.add(cubeMatrix);

// Position the camera
camera.position.z = 10;