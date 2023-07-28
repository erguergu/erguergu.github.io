const winWidth =
  window.innerWidth ||
  document.documentElement.clientWidth ||
  document.body.clientWidth;
const winHeight =
  window.innerHeight ||
  document.documentElement.clientHeight ||
  document.body.clientHeight;

console.log(`width: ${winWidth}, height: ${winHeight}`);
let seedPrefix = "apples";

class MazeNode {
  constructor(index, allNodes, mazeSize) {
    this.visited = false;
    this.connectedNeighbors = [];
    this.index = index;
    this.allNodes = allNodes;
    this.mazeSize = mazeSize;
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
    if (this.index % mazeSize != 0) {
      left = this.index - 1;
    }

    // right
    if ((this.index + 1) % mazeSize != 0) {
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
var camera = new THREE.OrthographicCamera(1, 1, 1, 1, 0, 1000);

scene.add(camera);

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
const ambientLight = new THREE.AmbientLight(0xffffff, 0.3); // Brighter ambient light
scene.add(ambientLight);

const size = 2;
const divisions = 20;

//const gridHelper = new THREE.GridHelper(size, divisions);
//gridHelper.rotation.x = Math.PI / 2;
//scene.add(gridHelper);

// Create a renderer
const renderer = new THREE.WebGLRenderer();
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
      mazeNodes.push(new MazeNode(index++, mazeNodes, gridSize));

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

  isGeneratingMaze = true;
}

function generateMazeStep() {
  // instead of doing a while loop,
  // can I do this with steps? how would
  // that look...
  // I think I need about three or four functions that
  // could get called:
  // visitNode - that would have to clear a wall and set the
  //             cube to a 'current' color (Blue)
  //             I think we should have all the cube start as purple too.
  //             Yellow for visited and for deleting a wall.
  // backtrackNode - that would just change the previous node to yellow
  //                 and set the new node to blue
  // Okay maybe it's just two functions?

  // Okay this dumb thing lost some of my notes.
  // I think the last bit was to say that this function should be called
  // generateMazeStep, and it needs logic to flip the switch for generating.
  if (visitedNodeCount() == mazeNodes.length) {
    // this means we're done generating the maze
    isGeneratingMaze = false;
  } else {
    // figure out if it's visitNode or backtrackNode now:
    // if currentNode has any unvisited neighbors
    //   then do visitNode
    // else
    //   do backtrack
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
  /*
    getRandomUnvisitedNeighbor = () => {
    const unvisitedNeighbors = this.getUnvisitedNeighbors();
    // okay this is kind of hard. the array could look something like
    // [null, node1, node2, null]
    // I need to be able to pick one of those, and know which one it is
    // maybe something like this
    const neighborIndexLookup = ["down", "up", "left", "right"];
    // hm I need to think more about this.
    // actually maybe this should be a function that is outside
    // of the class. Maybe I just call the getUnvisitedNeighbors function
    // from down below, and then do the logic to randomly pick one.
    // Within that logic, we will know the direction, and based on the
    // direction, we can calculate which wall to erase
  };
  */

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
  var seed = cyrb128(`${seedPrefix}${currentNode.index}`);
  // Four 32-bit component hashes provide the seed for sfc32.
  //var rand = sfc32(seed[0], seed[1], seed[2], seed[3]);

  // Only one 32-bit component hash is needed for mulberry32.
  //var rand = mulberry32(seed[0]);

  // Obtain sequential random numbers like so:
  var seededRandomNumber = mulberry32(seed[0])();
  var vanillaRandom = Math.random();

  // totally random
  return Math.floor(seededRandomNumber * (max - min) + min);
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
  }
}

function setNodeVisitColor(oldCurrentNode) {
  if (oldCurrentNode) {
    const vCube = cubes[oldCurrentNode.index];
    vCube.material = material;
  }
  const cube = cubes[currentNode.index];
  cube.material = vMat;
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

  camera.position.z = 100;
  camera.position.x = 0;
  camera.position.y = 0;
  camera.left = 0 - widthAdjust;
  camera.right = size + widthAdjust;
  camera.top = size + heightAdjust;
  camera.bottom = 0 - heightAdjust;
  camera.zoom = 1;
  camera.lookAt(0, 0, 0);

  camera.updateProjectionMatrix();
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
  if (autoGen) {
    generateMazeStep();
  }
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}

function moveOrtho() {
  camera.position.x += moveX;
  camera.position.y += moveY;
  camera.zoom += zoomAmount;
  camera.updateProjectionMatrix();
}

function keyDown(e) {
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
  }
}

function resizeWindow(e) {
  //addEventListener("resize", (event) => {});
  setUpCamera(gSize);
}

function newSeed() {
  seedPrefix = `${Date.now()}`;
  drawGrid(gSize);
}

window.addEventListener("keydown", keyDown, true);
window.addEventListener("keyup", keyUp, true);
window.addEventListener("resize", resizeWindow);

setUpCamera(gSize);
drawGrid(gSize);

// Start the animation
animate();
