
// Animation variables
let faceToRotate = 'x-left';
let rotateDir = 1;
let frameCount = 0;
const framesPerStep = 8;
let rotCount = 0;
let maxRots = getRandomInt(10)+10; // between 30 and 60 moves to scramble
let isScrambling = true;
let isSolving = false;
let isRotating = false;
let isInteractive = false;
const moveHistory = [];
const rotSteps = [
    { faceToRotate: 'y-bottom', rotateDir: -1 }
    , { faceToRotate: 'x-left', rotateDir: 1 }
];
let touchHappened = false;

import * as THREE from 'three';

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);
renderer.setAnimationLoop(animate);

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
    [p, o, p, g, p, y], [p, o, p, g, p, p], [p, o, p, g, w, p]
    , [p, o, p, p, p, y], [p, o, p, p, p, p], [p, o, p, p, w, p]
    , [p, o, b, p, p, y], [p, o, b, p, p, p], [p, o, b, p, w, p]

    , [p, p, p, g, p, y], [p, p, p, g, p, p], [p, p, p, g, w, p]
    , [p, p, p, p, p, y], [p, p, p, p, p, p], [p, p, p, p, w, p]
    , [p, p, b, p, p, y], [p, p, b, p, p, p], [p, p, b, p, w, p]

    , [r, p, p, g, p, y], [r, p, p, g, p, p], [r, p, p, g, w, p]
    , [r, p, p, p, p, y], [r, p, p, p, p, p], [r, p, p, p, w, p]
    , [r, p, b, p, p, y], [r, p, b, p, p, p], [r, p, b, p, w, p]
];

const faceIndexes = [
    {
        'name': 'x-left'
        , 'indexes': [0, 1, 2, 3, 4, 5, 6, 7, 8]
        , 'actuals': []
    }
    , 
    {
        'name': 'x-center'
        , 'indexes': [9, 10, 11, 12, 13, 14, 15, 16, 17]
        , 'actuals': []
    }
    , 
    {
        'name': 'x-right'
        , 'indexes': [18, 19, 20, 21, 22, 23, 24, 25, 26]
        , 'actuals': []
    }
    , 
    {
        'name': 'y-bottom'
        , 'indexes': [0, 1, 2, 9, 10, 11, 18, 19, 20]
        , 'actuals': []
    }
    , 
    {
        'name': 'y-center'
        , 'indexes': [3, 4, 5, 12, 13, 14, 21, 22, 23]
        , 'actuals': []
    }
    , 
    {
        'name': 'y-top'
        , 'indexes': [6, 7, 8, 15, 16, 17, 24, 25, 26]
        , 'actuals': []
    }
    ,
    {
        'name': 'z-back'
        , 'indexes': [0, 3, 6, 9, 12, 15, 18, 21, 24]
        , 'actuals': []
    }
    , 
    {
        'name': 'z-center'
        , 'indexes': [1, 4, 7, 10, 13, 16, 19, 22, 25]
        , 'actuals': []
    }
    , 
    {
        'name': 'z-front'
        , 'indexes': [2, 5, 8, 11, 14, 17, 20, 23, 26]
        , 'actuals': []
    }
    ,
    {
        'name': 'x-all'
        , 'indexes': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]
        , 'actuals': []
    }
    , 
    {
        'name': 'y-all'
        , 'indexes': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]
        , 'actuals': []
    }
    , 
    {
        'name': 'z-all'
        , 'indexes': [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26]
        , 'actuals': []
    }
]

// Create a 3x3x3 matrix of colored cubes
const cubeSize = 1; // Size of each cube
const spacing = 0.1; // Spacing between cubes
const { frontCubes, cubes, cubeMatrix, coords } = createCubeMatrix(cubeSize, spacing, faceColors);
scene.add(cubeMatrix);
for (let frontCube of frontCubes) {
    scene.add(frontCube);
}
const rotatorObj = new THREE.Group();
scene.add(rotatorObj);

const gestureData = {
    moveStart: null,
    moveEnd: null,
    slope: null,
    xDir: null,
    yDir: null
}


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
    const frontCubes = [];
    const cubes = [];
    const container = new THREE.Group();
    const coords = [];

    const colors = [
        [0xff0000, 0xff0000, 0xff0000, 0xff0000, 0xff0000, 0xff0000]
        , [0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00, 0x00ff00]
        , [0x0000ff, 0x0000ff, 0x0000ff, 0x0000ff, 0x0000ff, 0x0000ff]
    ];

    const xNames = ['left', 'center', 'right'];
    const yNames = ['bottom', 'center', 'top'];
    const zNames = ['back', 'center', 'front'];

    const zFront = faceIndexes.filter((p) => p.name == 'z-front')[0];
    console.log(`zFront: `, zFront.indexes);

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
                coords.push({ x: x, y: y, z: z, v: new THREE.Vector3( 0, 0, 0) });

                if (zFront.indexes.filter((p) => p == cubeIndex).length > 0) {
                    const frontCubeSize = .9;
                    const geometry = new THREE.BoxGeometry(frontCubeSize, frontCubeSize, frontCubeSize);
                    const material = new THREE.MeshBasicMaterial();
                    const frontCube = new THREE.Mesh(geometry, material);
                    frontCube.visible = false;
                    frontCube.position.set(posX, posY, posZ);
                    frontCubes.push(frontCube);
                }
                cubeIndex++;
            }
        }
    }

    return { frontCubes: frontCubes, cubes: cubes, cubeMatrix: container, coords: coords };
}

function getColorNames(colors) {
    return 'oof';
    // const colorLookup = [
    //     { key: 'r', val: 'Red' }
    //     , { key: 'o', val: 'Orange' }
    //     , { key: 'b', val: 'Blue' }
    //     , { key: 'g', val: 'Green' }
    //     , { key: 'w', val: 'White' }
    //     , { key: 'y', val: 'Yellow' }
    // ];
    // const retVal = colors
    //     .filter( (p) => p != 'p' )
    //     .map( (p) => colorLookup.filter( (q) => q.key == p )[0].val )
    //     .join(', ');
    // return retVal;
}

function veq( v1, v2, epsilon = 0.001 ) {
    
    //console.log(`eps: ${epsilon}`);
    return ( ( Math.abs( v1.x - v2.x ) < epsilon ) && ( Math.abs( v1.y - v2.y ) < epsilon ) && ( Math.abs( v1.z - v2.z ) < epsilon ) );
}

function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

function setRandomRotation() {

    // use this flag to ensure that this move doesn't simply negate the last move
    let wegood = false;

    while (!wegood) {
        const lastFace = faceToRotate;
        const lastDir = rotateDir;
        const ind = getRandomInt(faceIndexes.length); // 0-8
        faceToRotate = faceIndexes[ind].name;

        rotateDir = getRandomInt(2) == 0 ? -1 : 1;

        if (!(lastFace == faceToRotate && lastDir != rotateDir)) {
            wegood = true;
        } else {
            console.log(`fixed one!`);
        }
        //console.log(`setRandomRotation selected ${faceToRotate}, ${rotateDir}`);
    }
}

function getNextRotation() {
    const rot = rotSteps[rotCount];
    faceToRotate = rot.faceToRotate;
    rotateDir = rot.rotateDir;
}

function initializeCoords() {
    //console.log(`initializeCoordss`);
    // this needs to happen after everything is added to the scene, just one time
    // loop through all the cubes, and set the coord[] vector for each cube[] to the world vec
    for (let i = 0; i < cubes.length; i++) {
        const worldVec = new THREE.Vector3();
        const cube = cubes[i];
        cube.getWorldPosition(worldVec);
        coords[i].v = worldVec;
    }
    //console.log(coords);
    resetFaces();
}

function resetFaces() {
    const worldVecs = [];
    //console.log(`resetFaces`);
    for (let i = 0; i < cubes.length; i++) {
        const worldVec = new THREE.Vector3();
        cubes[i].getWorldPosition(worldVec);
        worldVec.x = Math.round(worldVec.x*10)/10;
        worldVec.y = Math.round(worldVec.y*10)/10;
        worldVec.z = Math.round(worldVec.z*10)/10;
        worldVecs.push(worldVec);
    }
    for (let faceIndex of faceIndexes) {
        faceIndex.actuals = [];
        for (let index of faceIndex.indexes) {
            const coord = coords[index];
            for (let n = 0; n < worldVecs.length; n++) {
                if (veq(coord.v, worldVecs[n])) {
                    faceIndex.actuals.push(n)
                }
            }
        }
    }
    //console.log(worldVecs);
}

function isCubeInFace(cube, faceIndex) {
    // get cube position and round
    // loop through index actuals
    // for each one, look at coords array and see
    // if xyz matches cube xyz
    
    const worldVec = new THREE.Vector3();
    cube.getWorldPosition(worldVec);
    worldVec.x = Math.round(worldVec.x*10)/10;
    worldVec.y = Math.round(worldVec.y*10)/10;
    worldVec.z = Math.round(worldVec.z*10)/10;

    // okay what is below does not work.
    // first, loop through coords, and find one that matches
    // the index of the coord needs to match the index of this faceIndex.indexes
    // It's an index of an index, and that index of an index needs to then be used
    // to find the actual. Is that true?
    // Wait... isn't this actually much simpler?
    // Maybe I can just hard code the locations??

    for (let ind of faceIndex.indexes) {
        const coord = coords[ind];
        if (coord.v.x == worldVec.x && coord.v.y == worldVec.y && coord.v.z == worldVec.z) {
            // we found it!
            return true;
        }
    }
    return false;
}

function findFaceFromMesh(cube, xDir, yDir) {
    // if xDir is nonzero, then possible faces are y-bottom, y-center, y-top
    // if yDir is nonzero, then possible faces are x-left, x-center, x-right

    // hmmmm how do I do this. I need to loop through the possible face names,
    // then look at the faceIndex with that name

    if (xDir != 0) {
        for (let faceName of ['y-bottom','y-center','y-top']) {
            const faceIndex = faceIndexes.find((p) => p.name == faceName);
            if (isCubeInFace(cube, faceIndex)) {
                return faceName;
            }
        }
    } else {
        for (let faceName of ['x-left', 'x-center', 'x-right']) {
            const faceIndex = faceIndexes.find((p) => p.name == faceName);
            if (isCubeInFace(cube, faceIndex)) {
                return faceName;
            }
        }
    }
}

function findFaceFromGesture() {
    // const gestureData = {
    //     moveStart: null,
    //     moveEnd: null,
    //     slope: null,
    //     xDir: null,
    //     yDir: null
    // }
    const xDir = gestureData.xDir;
    const yDir = gestureData.yDir;
    if (xDir != 0 || yDir != 0) {
        //console.log(gestureData);
        const moveStart = gestureData.moveStart;
        const pointer = new THREE.Vector2();
        const raycaster = new THREE.Raycaster();
        pointer.x = ( moveStart.x / window.innerWidth ) * 2 - 1;
        pointer.y = - ( moveStart.y / window.innerHeight ) * 2 + 1;
        // update the picking ray with the camera and pointer position
        raycaster.setFromCamera( pointer, camera );
        // calculate objects intersecting the picking ray
        const intersects = raycaster.intersectObjects( frontCubes );
    
        if (intersects.length == 0) {
            console.log(`findFaceFromGesture: no intersects!`);
            if (yDir != 0) {
                faceToRotate = 'x-all';
                rotateDir = yDir;
            } else {
                faceToRotate = 'y-all';
                rotateDir = xDir;
            }
            isRotating = true;
        } else {
            console.log(`intersect`, intersects[0]);
            isRotating = true;
            if (intersects[0].normal.x == -1 && yDir != 0) {
                // this is a rotation on the z-front
                faceToRotate = 'z-front';
                rotateDir = yDir;
            } else {

                faceToRotate = findFaceFromMesh(intersects[0].object, xDir, yDir);
                isRotating = true;
                rotateDir = xDir == 0 ? yDir : xDir;
            }
        }
    }
    gestureData.moveStart = null;
    gestureData.moveEnd = null;
    gestureData.slope = null;
    gestureData.xDir = null;
    gestureData.yDir = null;
}

// this does one frame of a rotation
function doRotate(faceName, direction) {

    const face = faceIndexes.filter((f) => f.name == faceName)[0];

    rotatorObj.rotation.set( 0, 0, 0 );
    // add cubes to rotatorobj
    for (let i of face.actuals) {
        rotatorObj.attach(cubes[i]);
    }

    // rotate the rotator
    if (faceName.startsWith('z')) {
        if (frameCount == 1) {
            //console.log(`rotating ${faceName} along z axis`, face);
        }
        rotatorObj.rotation.z += direction * ((Math.PI / 2) / framesPerStep);
    } else if (faceName.startsWith('x')) {
        if (frameCount == 1) {
            //console.log(`rotating ${faceName} along x axis`, face);
        }
        rotatorObj.rotation.x += direction * ((Math.PI / 2) / framesPerStep);
    } else {
        if (frameCount == 1) {
            //console.log(`rotating ${faceName} along y axis`, face);
        }
        rotatorObj.rotation.y += direction * ((Math.PI / 2) / framesPerStep);
    }

    // add cubes back to the parent
    for (let i of face.actuals) {
        cubeMatrix.attach(cubes[i]);
    }
}


function animate() {

    if (isScrambling) {
        if (frameCount == 0) {
            //getNextRotation();
            setRandomRotation();
            resetFaces();
        }
        if (frameCount++ < framesPerStep) {
            doRotate(faceToRotate, rotateDir);
        } else if (frameCount == framesPerStep + 1) {
            resetFaces();
        } else if (frameCount == framesPerStep * 2) {
            frameCount = 0;
            moveHistory.push({ faceToRotate: faceToRotate, rotateDir: rotateDir});
            rotCount++;
            if (rotCount >= maxRots) {
                //console.log(`just hit ${maxRots}, time to solve...`);
                isScrambling = false;
                isInteractive = true;
            }
        }
    } else if (isSolving) {
        if (frameCount++ < framesPerStep) {
            faceToRotate = moveHistory[moveHistory.length-1].faceToRotate;
            //console.log(`undorotate: ${faceToRotate}`, moveHistory);
            rotateDir = moveHistory[moveHistory.length-1].rotateDir*-1;
            doRotate(faceToRotate, rotateDir);
        } else if (frameCount == framesPerStep + 1) {
            resetFaces();
        } else if (frameCount == framesPerStep * 2) {
            frameCount = 0;
            moveHistory.splice(moveHistory.length-1);
            if (moveHistory.length == 0) {
                isSolving = false;
            }
            rotCount++;
        }
    } else if (isInteractive) {
        if (isRotating) {
            // do the rotation
            if (frameCount++ < framesPerStep) {
                doRotate(faceToRotate, rotateDir);
            } else if (frameCount == framesPerStep + 1) {
                resetFaces();
                frameCount = 0;
                moveHistory.push({ faceToRotate: faceToRotate, rotateDir: rotateDir});
                isRotating = false;
            }
        } else {
            // listen for input
            if (gestureData.moveEnd != null) {
                findFaceFromGesture();
            }
        }
    }

    renderer.render(scene, camera);
}

function handleMoveStart(x, y) {
    if (isInteractive) {
        gestureData.moveStart = {x, y};
    }
}

function handleMoveEnd(x, y) {
    if (isInteractive) {
        gestureData.moveEnd = {x, y};
        gestureData.slope = (gestureData.moveEnd.y-gestureData.moveStart.y)/(gestureData.moveEnd.x-gestureData.moveStart.x);
        gestureData.xDir = gestureData.moveStart.x < gestureData.moveEnd.x ? 1 : -1;
        gestureData.yDir = gestureData.moveStart.y < gestureData.moveEnd.y ? 1 : -1;
        if (!isFinite(gestureData.slope)) {
            gestureData.xDir = 0;
            gestureData.yDir = 0;
        } else if (!isFinite(gestureData.slope) || Math.abs(gestureData.slope) >= 1) {
            gestureData.xDir = 0;
        } else {
            gestureData.yDir = 0;
        }
    }

    //console.log(`you moved from ${gestureData.moveStart.x},${gestureData.moveStart.y} to ${gestureData.moveEnd.x},${gestureData.moveEnd.y}`);
    //console.log(`slope is ${gestureData.slope}, xDir is ${gestureData.xDir}, yDir is ${gestureData.yDir}`);
}
    
function reportWindowSize() {
    //console.log(`height: ${window.innerHeight}, width: ${window.innerWidth}`);
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
}

function onMouseStart(event) {
    handleMoveStart(event.clientX, event.clientY);
}

function onTouchStart(event) {
    //console.log('touchstart', event.changedTouches[0]);
    handleMoveStart(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
}

function onTouchMove(event) {
    event.preventDefault();
}

function onMouseEnd(event) {
    if (!touchHappened) {
        handleMoveEnd(event.clientX, event.clientY);
    } else {
        touchHappened = false; // reset in case no more touches
    }
}

function onTouchEnd(event) {
    touchHappened = true;
    handleMoveEnd(event.changedTouches[0].clientX, event.changedTouches[0].clientY);
    //console.log('touchend', event.changedTouches[0]);
}

window.addEventListener("touchstart", onTouchStart, false);
window.addEventListener("touchend", onTouchEnd, false);
window.addEventListener("touchmove", onTouchMove, { passive: false });

window.onresize = reportWindowSize;
window.addEventListener('mousedown', onMouseStart, false);
window.addEventListener('mouseup', onMouseEnd, false);

initializeCoords();

// Position the camera
camera.position.z = 5.5;
camera.position.x = -3;
camera.position.y = 2;
camera.lookAt(0, 0, 0);
