const winWidth =
  window.innerWidth ||
  document.documentElement.clientWidth ||
  document.body.clientWidth;
const winHeight =
  window.innerHeight ||
  document.documentElement.clientHeight ||
  document.body.clientHeight;

console.log(`width: ${winWidth}, height: ${winHeight}`);
let seedPrefix = "applesauce";

let menuVisible = false;

class MazeNode {
  constructor(x, y, index, allNodes, mazeSize) {
    this.x = x;
    this.y = y;
    this.visited = false;
    this.connectedNeighbors = [];
    this.index = index;
    this.allNodes = allNodes;
    this.mazeSize = mazeSize;
    this.rightBarrier = false;
    this.topBarrier = false;
  }

  getNeighborIndexes = () => {
    // the order will be: down, up, left, right
    // I think we have to insert nulls if it doesn't have
    // a given neighbor.
    const mazeSize = this.mazeSize;
    let up = null;
    let down = null;
    let left = null;
    let right = null;

    // get 'down'
    if (this.index > mazeSize - 1) {
      down = this.index - mazeSize;
    }

    // up
    if (this.index < mazeSize * (mazeSize - 1)) {
      up = this.index + mazeSize;
    }

    // left
    if (this.index % mazeSize != 0 && !this.allNodes[this.index - 1].rightBarrier) {
      left = this.index - 1;
    }

    // right
    if ((this.index + 1) % mazeSize != 0 && !this.rightBarrier) {
      right = this.index + 1;
    }

    return [down, up, left, right];
  };

  getUnvisitedNeighbors = () => {
    const neighborIndexes = this.getNeighborIndexes();
    const unvisitedNeighbors = [];
    let unvisitedNeighborCount = 0;
    for (const neighborIndex of neighborIndexes) {
      let arrNeighbor = null;
      if (neighborIndex != null) {
        const neighbor = this.allNodes[neighborIndex];
        if (!neighbor.visited) {
          arrNeighbor = neighbor;
          unvisitedNeighborCount++;
        }
      }

      // this will produce an array with either nulls
      // or actual neighbor nodes but only if they are unvisited.
      unvisitedNeighbors.push(arrNeighbor);
    }
    return unvisitedNeighbors;
  };

  getUnvisitedNeighborCount = () => {
    let theCount = 0;
    for (const index of this.getNeighborIndexes()) {
      if (index != null) {
        const node = this.allNodes[index];
        if (!node.visited) {
          theCount++;
        }
      }
    }
    return theCount;
  };
}

// Create a scene
const scene = new THREE.Scene();
const pCamera = new THREE.PerspectiveCamera();
pCamera.up = new THREE.Vector3(0, 0, 1);
const oCamera = new THREE.OrthographicCamera(1, 1, 1, 1, 0, 1000);
let camera = oCamera;

scene.add(pCamera);
scene.add(oCamera);

let moveX = 0;
let moveY = 0;
let zoomAmount = 0;
let gSize = 8;
const minGSize = 1;
const maxGSize = 500;

const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(1, 1, 1); // Position the light at a 45-degree diagonal angle
scene.add(directionalLight);
scene.add(directionalLight.target);

// Create an ambient light
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5); // Brighter ambient light
scene.add(ambientLight);

const size = 2;
const divisions = 20;

//const gridHelper = new THREE.GridHelper(size, divisions);
//gridHelper.rotation.x = Math.PI / 2;
//scene.add(gridHelper);

// Create a renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

let cubes = [];
let hWalls = [];
let vWalls = [];
let corners = [];

let mazeNodes = [];
let currentPath = [];
let autoGen = true;
let isGeneratingMaze = false;
let currentNode = null;

function clearMaze() {
  console.log(`Will clear the maze... There are ${cubes.length} cubes...`);
  for (const cube of cubes) {
    scene.remove(cube);
  }
  for (const hWall of hWalls) {
    scene.remove(hWall);
  }
  for (const vWall of vWalls) {
    scene.remove(vWall);
  }
  for (const corner of corners) {
    scene.remove(corner);
  }
  cubes = [];
  hWalls = [];
  vWalls = [];
  corners = [];
  mazeNodes = [];
  currentPath = [];
  isGeneratingMaze = false;
  currentNode = null;
}

const cubeSize = 0.4;
const cubeSpacing = 0.1;

const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
const material = new THREE.MeshLambertMaterial({ color: 0x00ffff });
const unvisMat = new THREE.MeshLambertMaterial({ color: 0x00ff00 });

const hGeo = new THREE.BoxGeometry(cubeSize, cubeSpacing, cubeSize);
const wallMat = new THREE.MeshLambertMaterial({ color: 0x9900ff });
const vGeo = new THREE.BoxGeometry(cubeSpacing, cubeSize, cubeSize);
const vMat = new THREE.MeshLambertMaterial({ color: 0x0099ff });
const barMat = new THREE.MeshLambertMaterial({ color: 0xff0000 });

const cornGeo = new THREE.BoxGeometry(cubeSpacing, cubeSpacing, cubeSize);

function drawGrid(gridSize) {
  clearMaze();
  setUpCamera(gridSize);

  for (let x = 0; x < gridSize; x++) {
    const hWall1 = new THREE.Mesh(hGeo, wallMat);
    hWall1.position.x = x * (cubeSize + cubeSpacing) + cubeSize / 2;
    hWall1.position.y = 0 - cubeSpacing / 2;
    scene.add(hWall1);
    hWalls.push(hWall1);
  }

  for (let x = 0; x <= gridSize; x++) {
    const corner = new THREE.Mesh(cornGeo, wallMat);
    corner.position.x = x * (cubeSize + cubeSpacing) - cubeSpacing / 2;
    corner.position.y = -cubeSpacing / 2;
    scene.add(corner);
    corners.push(corner);
  }

  let index = 0;
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const cube = new THREE.Mesh(geometry, unvisMat);
      cube.position.x = x * (cubeSize + cubeSpacing) + cubeSize / 2;
      cube.position.y = y * (cubeSize + cubeSpacing) + cubeSize / 2;

      scene.add(cube);
      cubes.push(cube);
      mazeNodes.push(new MazeNode(x, y, index++, mazeNodes, gridSize));

      const hWall = new THREE.Mesh(hGeo, wallMat);
      hWall.position.x = x * (cubeSize + cubeSpacing) + cubeSize / 2;
      hWall.position.y =
        y * (cubeSize + cubeSpacing) + cubeSize + cubeSpacing / 2;
      scene.add(hWall);
      hWalls.push(hWall);

      if (x == 0) {
        const vWall1 = new THREE.Mesh(vGeo, wallMat);
        vWall1.position.x = 0 - cubeSpacing / 2;
        vWall1.position.y = y * (cubeSize + cubeSpacing) + cubeSize / 2;
        scene.add(vWall1);
        vWalls.push(vWall1);
      }
      const vWall = new THREE.Mesh(vGeo, wallMat);
      vWall.position.x =
        x * (cubeSize + cubeSpacing) + cubeSize + cubeSpacing / 2;
      vWall.position.y = y * (cubeSize + cubeSpacing) + cubeSize / 2;
      scene.add(vWall);
      vWalls.push(vWall);

      const corner = new THREE.Mesh(cornGeo, wallMat);
      corner.position.x = x * (cubeSize + cubeSpacing) - cubeSpacing / 2;
      corner.position.y =
        y * (cubeSize + cubeSpacing) + cubeSize + cubeSpacing / 2;
      scene.add(corner);
      corners.push(corner);

      if (x == gridSize - 1) {
        const lastCorn = new THREE.Mesh(cornGeo, wallMat);
        lastCorn.position.x =
          (x + 1) * (cubeSize + cubeSpacing) - cubeSpacing / 2;
        lastCorn.position.y =
          y * (cubeSize + cubeSpacing) + cubeSize + cubeSpacing / 2;
        scene.add(lastCorn);
        corners.push(lastCorn);
      }
    }
  }

  defineBarriers();

  isGeneratingMaze = true;
}

function generateMazeStep() {
  if (visitedNodeCount() == mazeNodes.length) {
    // this means we're done generating the maze
    isGeneratingMaze = false;
  } else {
    if (currentNode == null || currentNode.getUnvisitedNeighborCount() > 0) {
      visitNode();
    } else {
      backtrackNode();
    }
  }
}

function visitNode() {
  // randomly pick an unvisited neighbor from the currentNode
  // push that neighbor onto the currentPath stack
  // delete the wall between old current node and this new one
  const oldCurrentNode = currentNode;
  if (currentNode == null) {
    // upper left
    // size 2, index 2  -- 2*1 = 2
    // size 3, index 6  -- 3*2 = 6
    // size 4, index 12 -- 4*3 = 12
    currentNode = mazeNodes[gSize * (gSize - 1)];
  } else {
    // pick random neighbor
    currentNode = getRandomUnvisitedNeighbor();
  }
  currentNode.visited = true;
  currentPath.push(currentNode);
  deleteWall(oldCurrentNode);
  setNodeVisitColor(oldCurrentNode);
}

function backtrackNode() {
  // pop an element off the currentPath stack
  // and set currentNode to the new 'last' item in the list
  const oldCurrentNode = currentPath.pop();
  currentNode = currentPath[currentPath.length - 1];
  setNodeVisitColor(oldCurrentNode);
}

function getRandomUnvisitedNeighbor() {
  
  const unvisitedNeighbors = currentNode.getUnvisitedNeighbors();
  const neighborIndexLookup = ["down", "up", "left", "right"];
  const unvisitedNeighborDirs = [];
  let i = 0;
  for (const neighbor of unvisitedNeighbors) {
    if (neighbor != null) {
      const unvisitedDirection = neighborIndexLookup[i];
      unvisitedNeighborDirs.push(unvisitedDirection);
    }
    i++;
  }
  const min = 0;
  const max = unvisitedNeighborDirs.length;
  if (currentNode.x == 6 && currentNode.y == 9) {
    console.log(`itsa me! min:${min},max:${max}`);
  }
  const randomIndex = getRandomIndex(
    min,
    max,
    unvisitedNeighbors,
    neighborIndexLookup
  );
  const randomDir = unvisitedNeighborDirs[randomIndex];
  i = 0;
  for (const lookup of neighborIndexLookup) {
    if (lookup == randomDir) {
      return unvisitedNeighbors[i];
    }
    i++;
  }
}

function getRandomIndex(min, max, unvisitedNeighbors, neighborIndexLookup) {
  return getSeededRandom(min, max, `${currentNode.index}`);
  //var seed = cyrb128(`${seedPrefix}${currentNode.index}`);
  // Four 32-bit component hashes provide the seed for sfc32.
  //var rand = sfc32(seed[0], seed[1], seed[2], seed[3]);

  // Only one 32-bit component hash is needed for mulberry32.
  //var rand = mulberry32(seed[0]);

  // Obtain sequential random numbers like so:
  //var seededRandomNumber = mulberry32(seed[0])();
  //var vanillaRandom = Math.random();

  // totally random
  //return Math.floor(seededRandomNumber * (max - min) + min);
}

function getSeededRandom(min, max, seedPostfix) {
  const seed = cyrb128(`${seedPrefix}${seedPostfix}`);
  const seededRandomNumber = mulberry32(seed[0])();
  return Math.floor(seededRandomNumber * (max - min) + min);
}

function defineBarriers() {
  // the mazes are way too easy with the regular depth-first alg.
  // i think we can make a maze harder by adding vertial or
  // horizontal barriers that go most of the way through the maze.
  // it should only try to put a barrier in somewhere near the middle
  // of every 8 cells.
  // The barrier needs to have at least one gap.
  const numBarriers = Math.floor(gSize / 8);
  console.log(`Num barriers: ${numBarriers}`);
  for (let i = 0; i < numBarriers; i++) {
    let barLoc = Math.floor((gSize / (numBarriers + 1)) * (i + 1));
    let gap = getSeededRandom(0, gSize);
    console.log(`I will draw a barrier at ${barLoc} except at row ${gap}`);
    // okay now go up a column and mark its nodes as barriers
    for (let y = 0; y < gSize; y++) {
      for (let x = 0; x < gSize; x++) {
        // 6 7 8
        // 3 4 5
        // 0 1 2
        // x:1,y:1,ind:4,gSize:3
        
        const ind = y * gSize + x;
        if (x == barLoc && gap != y) {
          mazeNodes[ind].rightBarrier = true;
        }
      }
    }
  }
}

function cyrb128(str) {
  let h1 = 1779033703,
    h2 = 3144134277,
    h3 = 1013904242,
    h4 = 2773480762;
  for (let i = 0, k; i < str.length; i++) {
    k = str.charCodeAt(i);
    h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
    h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
    h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
    h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
  }
  h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
  h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
  h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
  h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
  (h1 ^= h2 ^ h3 ^ h4), (h2 ^= h1), (h3 ^= h1), (h4 ^= h1);
  return [h1 >>> 0, h2 >>> 0, h3 >>> 0, h4 >>> 0];
}

function sfc32(a, b, c, d) {
  return function () {
    a >>>= 0;
    b >>>= 0;
    c >>>= 0;
    d >>>= 0;
    var t = (a + b) | 0;
    a = b ^ (b >>> 9);
    b = (c + (c << 3)) | 0;
    c = (c << 21) | (c >>> 11);
    d = (d + 1) | 0;
    t = (t + d) | 0;
    c = (c + t) | 0;
    return (t >>> 0) / 4294967296;
  };
}

function mulberry32(a) {
  return function () {
    var t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function visitedNodeCount() {
  let nodeCount = 0;
  for (const node of mazeNodes) {
    if (node.visited === true) {
      nodeCount++;
    }
  }
  return nodeCount;
}

function deleteWall(oldCurrentNode) {
  if (oldCurrentNode) {
    let refNode = oldCurrentNode;
    let tarNode = currentNode;
    if (currentNode.index < oldCurrentNode.index) {
      refNode = currentNode;
      tarNode = oldCurrentNode;
    }
    let refNodeIndexes = refNode.getNeighborIndexes();
    let walls = hWalls;

    const bottom = refNodeIndexes[0];
    const top = refNodeIndexes[1];
    const left = refNodeIndexes[2];
    const right = refNodeIndexes[3];
    const index = tarNode.index;

    let isV = false;

    if (left == index || right == index) {
      isV = true;
      walls = vWalls;
    }

    // v walls (path moving horizontally)
    // gSize = 2, ind = 0, wall = v, result = 1 (row is 0)
    // gSize = 2, ind = 2, wall = v, result = 4 (row is 1)
    // gSize = 3, ind = 3, wall = v, result = 5 (row is 1)
    // gSize = 3, ind = 7, wall = v, result = 10 (row is 2)

    // h walls (path moving vertically)
    // gSize = 2, ind = 0, wall = h, result = 2
    // gSize = 3, ind = 4, wall = h, result = 7
    /*
    2, 3
    0, 1
    
    6, 7, 8
    3, 4, 5
    0, 1, 2
    */

    let wallIndex = 0;
    if (isV) {
      // one extra wall per row than the size
      // figure out the row of the cube from the index?
      // okay now i see, the pattern is:
      // index + 1 + (the 'index' of the row we are on)
      let theRow = Math.floor(index / gSize);
      wallIndex = refNode.index + 1 + theRow;
    } else {
      // ooooh this one is actually really easy, it's just index + gSize
      wallIndex = refNode.index + gSize;
    }

    // just try to find *a* wall and mark it yellow
    const myWall = walls[wallIndex];
    myWall.material = material;
    myWall.position.z = -cubeSize;
  }
}

function setNodeVisitColor(oldCurrentNode) {
  if (oldCurrentNode) {
    const vCube = cubes[oldCurrentNode.index];
    vCube.material = material;
  }
  const cube = cubes[currentNode.index];
  cube.material = currentNode.rightBarrier ? barMat : vMat;

  cube.position.z = -cubeSize;
}

function setUpCamera(gridSize) {
  const size = cubeSize * gridSize + cubeSpacing * (gridSize - 1);

  const SCREEN_WIDTH = winWidth;
  const SCREEN_HEIGHT = winHeight;
  const aspect = SCREEN_WIDTH / SCREEN_HEIGHT;
  const aspectInv = SCREEN_HEIGHT / SCREEN_WIDTH;

  const marginSize = size * 0.1;

  const totalWidth = aspect > 1 ? aspect * size * 1.2 : size * 1.2;
  const totalHeight = aspect > 1 ? size * 1.2 : aspectInv * size * 1.2;

  const widthAdjust = (totalWidth - size) / 2;
  const heightAdjust = (totalHeight - size) / 2;

  oCamera.position.z = 100;
  oCamera.position.x = 0;
  oCamera.position.y = 0;
  oCamera.left = 0 - widthAdjust;
  oCamera.right = size + widthAdjust;
  oCamera.top = size + heightAdjust;
  oCamera.bottom = 0 - heightAdjust;
  oCamera.zoom = 1;
  oCamera.lookAt(0, 0, 0);

  oCamera.updateProjectionMatrix();

  pCamera.position.x = cubeSize / 2;
  pCamera.position.y = cubeSize / 2;
  pCamera.position.z = 0;
  pCamera.lookAt(size / 2, size / 2, pCamera.position.z);
  //pCamera.rotateZ(-Math.PI/2);
  oCamera.updateProjectionMatrix();
}

function growMaze() {
  if (gSize < maxGSize) {
    gSize++;
    drawGrid(gSize);
  }
}

function shrinkMaze() {
  if (gSize > minGSize) {
    gSize--;
    drawGrid(gSize);
  }
}

function animate() {
  moveOrtho();
  movePerspective();
  if (autoGen) {
    generateMazeStep();
  }

  //pCamera.rotateZ(.01);
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function moveOrtho() {
  oCamera.position.x += moveX;
  oCamera.position.y += moveY;
  oCamera.zoom += zoomAmount;
  oCamera.updateProjectionMatrix();
}

function movePerspective() {
  pCamera.translateZ(-moveY);
  pCamera.rotateY(-moveX * 3);
}

function keyDown(e) {
  if (menuVisible) {
    return;
  }
  //console.log(`keyDown: ${e.key}`);
  const key = e.key;
  if (key == "s") {
    moveY = -0.01;
  } else if (key == "w") {
    moveY = 0.01;
  } else if (key == "d") {
    moveX = 0.01;
  } else if (key == "a") {
    moveX = -0.01;
  } else if (key == "ArrowUp") {
    zoomAmount = 0.01;
  } else if (key == "ArrowDown") {
    zoomAmount = -0.01;
  }
}

function keyUp(e) {
  if (menuVisible) {
    return;
  }
  const key = e.key;
  //console.log(`keyUp: ${key}`);
  if (key == "w" || key == "s") {
    moveY = 0;
  } else if (key == "d" || key == "a") {
    moveX = 0;
  } else if (key == "ArrowUp" || key == "ArrowDown") {
    zoomAmount = 0;
  } else if (key == "+") {
    growMaze();
  } else if (key == "-") {
    shrinkMaze();
  } else if (key == "Backspace") {
    clearMaze();
  } else if (key == "Enter") {
    autoGen = false;
    generateMazeStep();
  } else if (key == "n") {
    newSeed();
  } else if (key == "c") {
    switchCamera();
  }
}

function switchCamera() {
  camera = camera.isPerspectiveCamera ? oCamera : pCamera;
}

function resizeWindow(e) {
  setUpCamera(gSize);
}

function newSeed() {
  seedPrefix = `${Date.now()}`;
  seedPrefix = getRandomIndex(100000, 999999);
  drawGrid(gSize);
}

function menuToggle() {
  const menuDropdown = document.getElementById("menuDropdown");
  if (menuDropdown.style.display == "block") {
    menuVisible = false;
    menuDropdown.style.display = "none";
  } else {
    menuVisible = true;
    menuDropdown.style.display = "block";
    const sizeInput = document.getElementById("sizeInput");
    const seedInput = document.getElementById("seedInput");
    sizeInput.value = `${gSize}`;
    seedInput.value = `${seedPrefix}`;
  }
}

function menuSizeInc() {
  const sizeInput = document.getElementById("sizeInput");
  const newSize = parseInt(sizeInput.value) + 1;
  sizeInput.value = `${newSize}`;
  menuGenerateMaze();
}

function menuSizeDec() {
  const sizeInput = document.getElementById("sizeInput");
  const newSize = parseInt(sizeInput.value) - 1;
  sizeInput.value = `${newSize}`;
  menuGenerateMaze();
}

function menuRandomSeed() {
  //getRandomIndex(min, max, unvisitedNeighbors, neighborIndexLookup)
  const seedInput = document.getElementById("seedInput");

  seedPrefix = `${Date.now()}`;
  const newSeed = getRandomIndex(100000, 999999);
  seedInput.value = newSeed;
  menuGenerateMaze();
}

function menuGenerateMaze() {
  const sizeInput = document.getElementById("sizeInput");
  const seedInput = document.getElementById("seedInput");
  gSize = parseInt(sizeInput.value);
  seedPrefix = seedInput.value;
  drawGrid(gSize);
}

window.addEventListener("keydown", keyDown, true);
window.addEventListener("keyup", keyUp, true);
window.addEventListener("resize", resizeWindow);

setUpCamera(gSize);
drawGrid(gSize);

// Start the animation
animate();
