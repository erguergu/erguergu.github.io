import * as THREE from './three.module.js';

import Stats from './stats.module.js';
import { GUI } from './dat.gui.module.js';

import { GLTFLoader } from './GLTFLoader.js';
import { FBXLoader } from './FBXLoader.js';
import { OrbitControls } from './OrbitControls.js';

let gui;

let container, stats;
let camera, scene, renderer;
let controls;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const onUpPosition = new THREE.Vector2();
const onDownPosition = new THREE.Vector2();
const clock = new THREE.Clock();

const rigidBodies = [];
let physicsWorld, tmpTrans;
let logCount = 0, logMax = 10;
let totalBallsCreated = 0;
let frameCount = 0;
let platform = null;
let ballGeometry = null;
const ballMaterials = [];

init().then(result => animate());

async function init() {

    await loadAmmo();
    setupPhysicsWorld();

    container = document.getElementById('container');
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x303030);
    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(0, 250, 1000);
    scene.add(camera);
    scene.add(new THREE.AmbientLight(0x666666));
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    addDirectionalLight();

    stats = new Stats();
    container.appendChild(stats.dom);

    gui = new GUI();
    setupGui();
    gui.open();
    controls = new OrbitControls(camera, renderer.domElement);
    controls.damping = 0.2;
    controls.addEventListener('change', render);

    // listen for window resize events
    window.addEventListener('resize', () => {

      // make sure scene always matches viewport size and aspect ratio
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;

      // make sure aspect ratio changes do not warp object shapes
      camera.updateProjectionMatrix();
    });

    for (let i = 0; i < 100; i++) {
        ballMaterials.push(new THREE.MeshPhongMaterial( { color: Math.random() * 0xffffff } ));
    }
    addModel(new THREE.Vector3(0,0,0));
    // addModel(new THREE.Vector3(-1500,-1500,-1500));
    // addModel(new THREE.Vector3(1500,-1500,-1500));
    // addModel(new THREE.Vector3(1500,-1500,1500));
    // addModel(new THREE.Vector3(-1500,-1500,1500));
}

// MENU Options
const menu = {
    addBall: {f:addBall, n: 'Add Ball'},
    toggleX: {f:false, n: 'Toggle X Rotate'},
    toggleY: {f:true, n: 'Toggle Y Rotate'},
    toggleZ: {f:false, n: 'Toggle Z Rotate'},
    toggleRainBalls: {f:true, n: 'Toggle Rain Balls'},
    changePlatformColor: {f:changePlatformColor, n: 'Platform Color'}
};


//////////////////////////////
////  AMMO STARTS HERE  //////
//////////////////////////////

async function loadAmmo() {
    return await new Promise(resolve => {
        return Ammo().then(resolve);
    });
}

function setupPhysicsWorld() {
    const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
        dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
        overlappingPairCache = new Ammo.btDbvtBroadphase(),
        solver = new Ammo.btSequentialImpulseConstraintSolver();

    physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    physicsWorld.setGravity(new Ammo.btVector3(0, -1000, 0));
    tmpTrans = new Ammo.btTransform();
}

function updatePhysics(deltaTime) {

    physicsWorld.stepSimulation( deltaTime, 10 );
    const uuidsToRemove = [];

    for (let i = 0; i < rigidBodies.length; i++) {
        // get the three js object
        const obj3d = rigidBodies[i];

        if (obj3d.userData.physicsUpdate) {
            obj3d.userData.physicsUpdate(obj3d, deltaTime);
            if (obj3d.userData.destroyMe) {
                uuidsToRemove.push(obj3d.uuid);
            }
        }
    }
    for (let i = 0; i < uuidsToRemove.length; i++) {
        const objInd = rigidBodies.findIndex(obj => obj.uuid == uuidsToRemove[i]);
        const obj = rigidBodies[objInd];
        rigidBodies.splice(objInd, 1);
        obj.userData.destroy(obj);
    }
}


// Update the Ball in AMMO
function ballPhysicsUpdate(obj3d, deltaTime) {

    // get its physics object
    const objAmmo = obj3d.userData.physicsBody;

    // skip if no physics object
    if (objAmmo) {

        // figure out location/rotation of the given physics object
        const myMotionState = objAmmo.getMotionState();

        if (myMotionState) {
            // convert the position from local to world coords                
            myMotionState.getWorldTransform(tmpTrans);
            const ammoPos = tmpTrans.getOrigin();
            const ammoQuat = tmpTrans.getRotation();

            if (ammoPos.y() < -6000) {
                physicsWorld.removeRigidBody(objAmmo);
                obj3d.userData.destroyMe = true;
            } else {
                // Set the three js object's position and rotation
                obj3d.position.set(ammoPos.x(), ammoPos.y(), ammoPos.z());
                obj3d.quaternion.set( ammoQuat.x(), ammoQuat.y(), ammoQuat.z(), ammoQuat.w() );
            }
        }
    }
}

// Create the Ball in AMMO
function createAmmoBall(radius, obj3d) {
    const position = obj3d.position;
    const mass = 100;
    const friction = .4; // .4
    const rollingFriction = .1; // .1
    const disableDeactivation = 4;

    const transform = new Ammo.btTransform();
    const originVector = new Ammo.btVector3(position.x, position.y, position.z);
    const initialQuat = new Ammo.btQuaternion(0, 0, 0, 1);
    transform.setIdentity();
    transform.setOrigin(originVector);
    transform.setRotation(initialQuat);
    const motionState = new Ammo.btDefaultMotionState(transform);

    const colShape = new Ammo.btSphereShape(radius);

    colShape.setMargin(0.05);
    const localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
    const body = new Ammo.btRigidBody(rbInfo);
    body.setFriction(friction); //.4
    body.setRollingFriction(rollingFriction); // .1
    body.setActivationState(disableDeactivation);
    //body.setAngularFactor(0, 0, 0);
    physicsWorld.addRigidBody(body);

    // Need to destroy all these things...
    transform.__destroy__();
    originVector.__destroy__();
    initialQuat.__destroy__();    
    obj3d.userData.ammoDestroy.push(motionState);
    obj3d.userData.ammoDestroy.push(colShape);
    obj3d.userData.ammoDestroy.push(body);
    localInertia.__destroy__();
    rbInfo.__destroy__();

    return body;
}

// Spin the loaded model
function modelPhysicsUpdate(obj3d, deltaTime) {

    const position = obj3d.position;
    const time = Date.now() * 0.0001;
    if (menu.toggleX.f) { obj3d.rotateX(THREE.Math.degToRad(.2)); }
    if (menu.toggleY.f) { obj3d.rotateY(THREE.Math.degToRad(.1)); }
    if (menu.toggleZ.f) { obj3d.rotateZ(THREE.Math.degToRad(.2)); }
    const quat = obj3d.quaternion;
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    const newPosition = new Ammo.btVector3(position.x, position.y, position.z)
    const newQuat = new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w);
    transform.setOrigin(newPosition);
    transform.setRotation(newQuat);
    const motionState = new Ammo.btDefaultMotionState(transform);
    obj3d.userData.physicsBody.setMotionState(motionState);

    transform.__destroy__();
    newPosition.__destroy__();
    newQuat.__destroy__();
    motionState.__destroy__();
}

// Create model from triangles in AMMO
function generateAmmoObjFromTrianglesConcave(triangles, obj3d) {
    const position = obj3d.position;
    const mass = 0;
    const friction = .4; // .4
    const rollingFriction = .1; // .1
    const disableDeactivation = 4;

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    const originVector = new Ammo.btVector3(position.x, position.y, position.z);
    transform.setOrigin(originVector);
    const motionState = new Ammo.btDefaultMotionState(transform);

    const mesh = new Ammo.btTriangleMesh(true, true);

    for (let i = 0; i < triangles.length; i++) {
        const triangle = triangles[i];
        const triVec1 = triangle[0];
        const triVec2 = triangle[1];
        const triVec3 = triangle[2];
        const ammVec1 = new Ammo.btVector3(triVec1.x, triVec1.y, triVec1.z);
        const ammVec2 = new Ammo.btVector3(triVec2.x, triVec2.y, triVec2.z);
        const ammVec3 = new Ammo.btVector3(triVec3.x, triVec3.y, triVec3.z);
        mesh.addTriangle(
            ammVec1,
            ammVec2,
            ammVec3,
            false
        );
        ammVec1.__destroy__();
        ammVec2.__destroy__();
        ammVec3.__destroy__();
    }
    const shape = new Ammo.btBvhTriangleMeshShape(mesh, true, true);
    shape.setMargin(0.05);
    const localInertia = new Ammo.btVector3(0, 0, 0);
    shape.calculateLocalInertia(mass, localInertia);
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, shape, localInertia);
    const body = new Ammo.btRigidBody(rbInfo);
    body.setFriction(friction); //.4
    body.setRollingFriction(rollingFriction); // .1
    body.setActivationState(disableDeactivation);
    body.setAngularFactor(0, 0, 0);
    physicsWorld.addRigidBody(body);

    transform.__destroy__();
    originVector.__destroy__();
    obj3d.userData.ammoDestroy.push(mesh);
    obj3d.userData.ammoDestroy.push(shape);
    obj3d.userData.ammoDestroy.push(body);
    localInertia.__destroy__();
    rbInfo.__destroy__();


    return body;
}

function generateAmmoObjFromTrianglesConvex(triangles, position, rotation) {
    const mass = 0;
    const friction = .4;
    const rollingFriction = .1;
    const disableDeactivation = 4;
    
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
    //transform.setRotation(new Ammo.btQuaternion(rotation.x, rotation.y, rotation.z, rotation.w));
    const motionState = new Ammo.btDefaultMotionState(transform);
    
    const btConvexHullShape = new Ammo.btConvexHullShape();
    var _vec3_1 = new Ammo.btVector3(0, 0, 0);
    var _vec3_2 = new Ammo.btVector3(0, 0, 0);
    var _vec3_3 = new Ammo.btVector3(0, 0, 0);
    for (let i = 0; i < triangles.length; i++) {
        const triangle = triangles[i];
        _vec3_1.setX(triangle[0].x);
        _vec3_1.setY(triangle[0].y);
        _vec3_1.setZ(triangle[0].z);
        btConvexHullShape.addPoint(_vec3_1, true);
        _vec3_2.setX(triangle[1].x);
        _vec3_2.setY(triangle[1].y);
        _vec3_2.setZ(triangle[1].z);
        btConvexHullShape.addPoint(_vec3_2, true);
        _vec3_3.setX(triangle[2].x);
        _vec3_3.setY(triangle[2].y);
        _vec3_3.setZ(triangle[2].z);
        btConvexHullShape.addPoint(_vec3_3, true);
    }    

    btConvexHullShape.setMargin(0.05);
    const localInertia = new Ammo.btVector3(0, 0, 0);
    btConvexHullShape.calculateLocalInertia(mass, localInertia);
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, btConvexHullShape, localInertia);
    const body = new Ammo.btRigidBody(rbInfo);
    body.setFriction(friction); //.4
    body.setRollingFriction(rollingFriction); // .1
    body.setActivationState(disableDeactivation);
    body.setAngularFactor(0, 0, 0);
    physicsWorld.addRigidBody(body);

    return body;
}

function createTriangleShapeByGeometry(geometry) {
    var mesh = new Ammo.btTriangleMesh(true, true);
    var vertices = geometry.vertices;
    for (var i = 0; i < geometry.faces.length; i++) {
        var face = geometry.faces[i];
        if (face instanceof THREE.Face3) {
            mesh.addTriangle(
                new Ammo.btVector3(vertices[face.a].x, vertices[face.a].y, vertices[face.a].z),
                new Ammo.btVector3(vertices[face.b].x, vertices[face.b].y, vertices[face.b].z),
                new Ammo.btVector3(vertices[face.c].x, vertices[face.c].y, vertices[face.c].z),
                false
            );
        } else if (face instanceof THREE.Face4) {
            mesh.addTriangle(
                new Ammo.btVector3(vertices[face.a].x, vertices[face.a].y, vertices[face.a].z),
                new Ammo.btVector3(vertices[face.b].x, vertices[face.b].y, vertices[face.b].z),
                new Ammo.btVector3(vertices[face.d].x, vertices[face.d].y, vertices[face.d].z),
                false
            );
            mesh.addTriangle(
                new Ammo.btVector3(vertices[face.b].x, vertices[face.b].y, vertices[face.b].z),
                new Ammo.btVector3(vertices[face.c].x, vertices[face.c].y, vertices[face.c].z),
                new Ammo.btVector3(vertices[face.d].x, vertices[face.d].y, vertices[face.d].z),
                false
            );
        }
    }
    var shape = new Ammo.btBvhTriangleMeshShape(mesh, true, true);
    return shape;
}

function someguyscode() {
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(-1.1726552248001099, 2.6692488193511963, 0));
    transform.setRotation(new Ammo.btQuaternion(0.5, -0.5, 0.5, 0.4999999701976776));
    const motionState = new Ammo.btDefaultMotionState(transform);
    
    // Vertices and indices are parsed by GLTF parser by loaders.gl
    const vertices = Entity.vertices;
    const indices = Entity.indices;
    const scale = [0.15933185815811157, 1.1706310510635376, 0.15933185815811157];
    
    const mesh = new Ammo.btTriangleMesh(true, true);
    mesh.setScaling(new Ammo.btVector3(scale[0], scale[1], scale[2]));
    for (let i = 0; i * 3 < indices.length; i++) {
        mesh.addTriangle(
            new Ammo.btVector3(vertices[indices[i * 3] * 3], vertices[indices[i * 3] * 3 + 1], vertices[indices[i * 3] * 3 + 2]),
            new Ammo.btVector3(vertices[indices[i * 3 + 1] * 3], vertices[indices[i * 3 + 1] * 3 + 1], vertices[indices[i * 3 + 1] * 3 + 2]),
            new Ammo.btVector3(vertices[indices[i * 3 + 2] * 3], vertices[indices[i * 3 + 2] * 3 + 1], vertices[indices[i * 3 + 2] * 3 + 2]),
            false
        );
    }
    const shape = new Ammo.btBvhTriangleMeshShape(mesh, true, true);
    
    const localInertia = new Ammo.btVector3(0, 0, 0);
    
    const rbInfo = new Ammo.btRigidBodyConstructionInfo(0, motionState, shape, localInertia);
    const object = new Ammo.btRigidBody(rbInfo);
    
    this._physicsWorld.addRigidBody(object);    
}

/////////////////////////////
////  AMMO STOPS HERE  //////
/////////////////////////////


//-----------------------------------


///////////////////////////////
////  THREE STARTS HERE  //////
///////////////////////////////

function render() {

    const deltaTime = clock.getDelta();

    if (frameCount++ == 30) {
        frameCount = 0;
        if (menu.toggleRainBalls.f) {
            addBall();
            // addBall();
            // addBall();
            // addBall();
            // addBall();
            // addBall();
            // addBall();
        }        
    }

    updatePhysics(deltaTime);
    renderer.render(scene, camera);
}

function animate() {
    requestAnimationFrame(animate);
    render();
    stats.update();
}

function addDirectionalLight() {
    renderer.shadowMap.enabled = true;
    const light = new THREE.DirectionalLight( 0xffffff, .5 );
    light.position.set( 1000, 1000, 1000 ); //default; light shining from top
    light.castShadow = true; // default false
    scene.add(light);

    //Set up shadow properties for the light
    light.shadow.mapSize.width = 20000;
    light.shadow.mapSize.height = 20000;
    light.shadow.camera.near = 0.5;
    light.shadow.camera.far = 20000;
    light.shadow.camera.left = -20000;
    light.shadow.camera.bottom = -20000;
    light.shadow.camera.top = 20000;
    light.shadow.camera.right = 20000;
}

function setupGui() {
    gui.destroy();
    gui = new GUI();

    for (let key of Object.keys(menu)) {
        const param = menu[key];
        gui.add(param, 'f').name(param.n);
    }
}

function toggleXRotate() {
    doXRotate = !doXRotate;
}

function toggleYRotate() {
    doYRotate = !doYRotate;
}

function toggleZRotate() {
    doZRotate = !doZRotate;
}

function toggleRainBalls() {
    doRainBalls = !doRainBalls;
}

function addBall() {
    const radius = 50;
    const widthSegs = 32;
    const heightSegs = 16;
    const initialY = 4000;
    const spawnArea = 1500;

    if (!ballGeometry) {
        ballGeometry = new THREE.SphereGeometry( radius, widthSegs, heightSegs );
    }
    const ind = Math.floor(Math.random()*ballMaterials.length);
    const material = ballMaterials[ind];
    const sphere = new THREE.Mesh( ballGeometry, material );
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    scene.add( sphere );
    sphere.position.y = initialY;
    sphere.position.x = (Math.random() * spawnArea)-(spawnArea/2);
    sphere.position.z = (Math.random() * spawnArea)-(spawnArea/2);
    sphere.userData.ammoDestroy = [];
    sphere.userData.physicsBody = createAmmoBall(radius, sphere);
    sphere.userData.physicsUpdate = ballPhysicsUpdate;
    sphere.userData.destroy = destroyBall;

    rigidBodies.push(sphere);
    if (totalBallsCreated++ % 1000 == 0) {
        console.log(`Total Balls Created: ${totalBallsCreated-1}, current rigidbody count: ${rigidBodies.length}`);
        // i got up to 58,000 before this crashed most recently
    }
}

function destroyBall(ball) {
    scene.remove(ball);
    ball.geometry.dispose();
    ball.material.dispose();
    for (let i = 0; i < ball.userData.ammoDestroy; i++) {
        ball.userData.ammoDestroy[i].__destroy__();
    }
    ball.userData.ammoDestroy.length = 0;
    delete ball.userData.physicsBody;
    delete ball.userData;
    //delete ball.material;
    //delete ball.geometry;
}

async function loadFbx(path) {
    const loader = new FBXLoader();
    return await new Promise(resolve => {
        loader.load(path, resolve);
    });
}

async function addModel(position) {
    const fbx = await loadFbx('./src/ThreeAmmo.fbx');
    const model = extractMesh(fbx);

    model.castShadow = true;
    model.receiveShadow = true;
    platform = model;
    changePlatformColor();

    scene.add(model);

    const vertices = model.geometry.attributes.position.array;
    const triangles = getTriangles(vertices, model.matrixWorld);



    model.updateMatrix();

    model.geometry.applyMatrix4( model.matrix );
    
    model.position.set( 0, 0, 0 );
    model.rotation.set( 0, 0, 0 );
    model.scale.set( 1, 1, 1 );
    model.updateMatrix();

    model.position.x = position.x;
    model.position.y = position.y;
    model.position.z = position.z;


    model.userData.ammoDestroy = [];
    model.userData.physicsBody = generateAmmoObjFromTrianglesConcave(triangles, model);
    model.userData.physicsUpdate = modelPhysicsUpdate;
    rigidBodies.push(model);
    
}

function changePlatformColor() {
    platform.material.color.set(Math.random() * 0xffffff);
}

function getTriangles(vertices, matrixWorld) {
    const triangleVectors = [];
    const triangles = [];

    for (let i = 0; i < vertices.length - 9; i += 9) {
        triangleVectors.push([
            new THREE.Vector3(vertices[i], vertices[i+1], vertices[i+2]),
            new THREE.Vector3(vertices[i+3], vertices[i+4], vertices[i+5]),
            new THREE.Vector3(vertices[i+6], vertices[i+7], vertices[i+8]),
        ]);
    }

    for (let i = 0; i < triangleVectors.length; i++) {
        const [v1, v2, v3] = triangleVectors[i];
        v1.applyMatrix4(matrixWorld);
        v2.applyMatrix4(matrixWorld);
        v3.applyMatrix4(matrixWorld);
        triangles.push([
            { x: v1.x, y: v1.y, z: v1.z },
            { x: v2.x, y: v2.y, z: v2.z },
            { x: v3.x, y: v3.y, z: v3.z }
        ]);
    }

    return triangles;
}

function extractMesh(fbx) {
    return fbx.children.find(child => child.type == 'Mesh');
}

//////////////////////////////
////  THREE STOPS HERE  //////
//////////////////////////////