
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
    const cubes = [];
    const container = new THREE.Group();
    const boundingBoxes = [];

    const colors = [
        [ 0xff0000, 0xff0000, 0xff0000, 0xff0000, 0xff0000, 0xff0000 ]
        , [ 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00 ]
        , [ 0x0000ff, 0x0000ff, 0x0000ff, 0x0000ff, 0x0000ff, 0x0000ff ]
    ];

    const xNames = ['left', 'center', 'right'];
    const yNames = ['bottom', 'center', 'top'];
    const zNames = ['back', 'center', 'front'];

    let cubeIndex = 0;

    // x axis, left to right
    for (let x = 0; x < matrixSize; x++) {

        // y axis, bottom to top
        for (let y = 0; y < matrixSize; y++) {

            // z axis, back to front
            for (let z = 0; z < matrixSize; z++) {
                // Create a colored cube
                const coloredCube = createColoredCube(allFaceColors[cubeIndex]);

                // Set the position of the cube
                const posX = x * (cubeSize + spacing) - (matrixSize - 1) * (cubeSize + spacing) / 2;
                const posY = y * (cubeSize + spacing) - (matrixSize - 1) * (cubeSize + spacing) / 2;
                const posZ = z * (cubeSize + spacing) - (matrixSize - 1) * (cubeSize + spacing) / 2;
                coloredCube.position.set(posX, posY, posZ);

                // Add the cube to the container
                cubes.push(coloredCube);
                container.add(coloredCube);

                // Create and position the bounding box
                const boundingBox = new THREE.Box3(
                    new THREE.Vector3(posX - cubeSize / 2, posY - cubeSize / 2, posZ - cubeSize / 2),
                    new THREE.Vector3(posX + cubeSize / 2, posY + cubeSize / 2, posZ + cubeSize / 2)
                );
                boundingBoxes.push({ x: x, y: y, z: z, posX: posX, posY: posY, posZ: posZ, box: boundingBox });

                console.log(`created cube${cubeIndex} ${xNames[x]} ${yNames[y]} ${zNames[z]}`);
                cubeIndex++;
            }
        }
    }

    return { cubes: cubes, cubeMatrix: container, boundingBoxes: boundingBoxes };
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

function beginRotate() {
    isRotating = true;
}

function doRotate() {

    // add cubes to rotatorobj
    for (let i = 0; i < 9; i++) {
       rotatorObj.attach(cubes[i]);
    }

    
    // rotate the rotator
    rotatorObj.rotation.x += (Math.PI / 2) / framesPerStep; // 90 degrees every half second

    // add cubes back to the parent
    for (let i = 0; i < 9; i++) {
       cubeMatrix.attach(cubes[i]);
    }
}

// Animation variables
let isRotating = false;
let startTime = Date.now();
let frameCount = 0;
const framesPerStep = 20;
function animate() {

    if (frameCount++ < framesPerStep) {
       doRotate();
    }

    if (frameCount == framesPerStep * 2) {
        frameCount = 0;
    }
    // cubeMatrix.rotation.x += 0.01;
    // cubeMatrix.rotation.y += 0.009;

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


const r = 0xff0000, o = 0xFF8C00, b = 0x0000ff, g = 0x00ff00, w = 0xffffff, y = 0xffff00, p = 0x000000;
// Define colors for each face (six colors, one for each face)
const faceColors = [
    r, // Red right
    o, // Orange left
    b, // Blue top 
    g, // Green bottom
    w, // White front
    y  // Yellow back
];

const allFaceColors = [ 
    //  left bottom back      left bottom cent     left bottom front
      [ p, o, p, g, p, y ], [ p, o, p, g, p, p ], [ p, o, p, g, w, p ]
    , [ p, o, p, p, p, y ], [ p, o, p, p, p, p ], [ p, o, p, p, w, p ]
    , [ p, o, b, p, p, y ], [ p, o, b, p, p, p ], [ p, o, b, p, w, p ]
    
    , [ p, p, p, g, p, y ], [ p, p, p, g, p, p ], [ p, p, p, g, w, p ]
    , [ p, p, p, p, p, y ], [ p, p, p, p, p, p ], [ p, p, p, p, w, p ]
    , [ p, p, b, p, p, y ], [ p, p, b, p, p, p ], [ p, p, b, p, w, p ]
    
    , [ r, p, p, g, p, y ], [ r, p, p, g, p, p ], [ r, p, p, g, w, p ]
    , [ r, p, p, p, p, y ], [ r, p, p, p, p, p ], [ r, p, p, p, w, p ]
    , [ r, p, b, p, p, y ], [ r, p, b, p, p, p ], [ r, p, b, p, w, p ]
 ];

// Create a 3x3x3 matrix of colored cubes
const cubeSize = 1; // Size of each cube
const spacing = 0.1; // Spacing between cubes
const { cubes, cubeMatrix, boundingBoxes } = createCubeMatrix(cubeSize, spacing, faceColors);
scene.add(cubeMatrix);
const rotatorObj =  new THREE.Group();
scene.add(rotatorObj);

// Position the camera
camera.position.z = 5.5;
