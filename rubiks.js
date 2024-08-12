
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

    const colors = [
        [ 0xff0000, 0xff0000, 0xff0000, 0xff0000, 0xff0000, 0xff0000 ]
        , [ 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00 ]
        , [ 0x0000ff, 0x0000ff, 0x0000ff, 0x0000ff, 0x0000ff, 0x0000ff ]
    ];

    const xNames = ['left', 'center', 'right'];
    const yNames = ['bottom', 'center', 'top'];
    const zNames = ['back', 'center', 'front'];

    // x axis, left to right
    for (let x = 0; x < matrixSize; x++) {

        // y axis, bottom to top
        for (let y = 0; y < matrixSize; y++) {

            // z axis, back to front
            for (let z = 0; z < matrixSize; z++) {
                // Create a colored cube
                const coloredCube = createColoredCube(faceColors);


                // Set the position of the cube
                const posX = x * (cubeSize + spacing) - (matrixSize - 1) * (cubeSize + spacing) / 2;
                const posY = y * (cubeSize + spacing) - (matrixSize - 1) * (cubeSize + spacing) / 2;
                const posZ = z * (cubeSize + spacing) - (matrixSize - 1) * (cubeSize + spacing) / 2;
                coloredCube.position.set(posX, posY, posZ);

                // Add the cube to the container
                container.add(coloredCube);

                console.log(`created cube ${xNames[x]} ${yNames[y]} ${zNames[z]}`);
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

function animate() {

	cubeMatrix.rotation.x += 0.01;
	cubeMatrix.rotation.y += 0.009;

	renderer.render( scene, camera );

}

// Example usage:
import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.setAnimationLoop( animate );

// Define colors for each face (six colors, one for each face)
const faceColors = [
    0xff0000, // Red right
    0xFF8C00, // Orange left
    0x0000ff, // Blue top 
    0x00ff00, // Green bottom
    0xffffff, // White front
    0xffff00  // Yellow back
];

// Create a 3x3x3 matrix of colored cubes
const cubeSize = 1; // Size of each cube
const spacing = 0.1; // Spacing between cubes
const cubeMatrix = createCubeMatrix(cubeSize, spacing, faceColors);
scene.add(cubeMatrix);

// Position the camera
camera.position.z = 5.5;