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

    addModel();
}

// MENU Options
const menu = {
    //addModel: {f:addModel, n: 'Add Model'},
    addBall: {f:addBall, n: 'Add Ball'}
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

    for (let i = 0; i < rigidBodies.length; i++) {
        // get the three js object
        const obj3d = rigidBodies[i];

        // get its physics object
        const objAmmo = obj3d.userData.physicsBody;

        // skip if no physics object
        if (objAmmo) {

            // figure out location/rotation of the given physics object
            const myMotionState = objAmmo.getMotionState();

            if (myMotionState) {
                // convert the position from local to world coords                
                myMotionState.getWorldTransform(tmpTrans);
                const ammoPosInWorldCoords = tmpTrans.getOrigin();
                const x = ammoPosInWorldCoords.x();
                const y = ammoPosInWorldCoords.y();
                const z = ammoPosInWorldCoords.z();

                const q = tmpTrans.getRotation();

                if (logCount++ < logMax) {
                    console.log(`x: ${x}, y: ${y}, z: ${z}`, objAmmo);
                    console.log(`isActive`, objAmmo.isActive());
                }

                // Set the three js object's position and rotation
                obj3d.position.set(x, y, z);
                obj3d.quaternion.set( q.x(), q.y(), q.z(), q.w() );
            }
        }
    }
}

function createAmmoBall(radius, position) {
    const mass = 100;
    const friction = .4; // .4
    const rollingFriction = .1; // .1
    const disableDeactivation = 4;

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
    transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
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

    return body;
}

function generateAmmoObjFromTrianglesConcave(triangles, position) {
    const mass = 0;
    const friction = .04; // .4
    const rollingFriction = .01; // .1
    const disableDeactivation = 4;

    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
    const motionState = new Ammo.btDefaultMotionState(transform);

    var mesh = new Ammo.btTriangleMesh(true, true);

    for (let i = 0; i < triangles.length; i++) {
        const triangle = triangles[i];
        const triVec1 = triangle[0];
        const triVec2 = triangle[1];
        const triVec3 = triangle[2];
        mesh.addTriangle(
            new Ammo.btVector3(triVec1.x, triVec1.y, triVec1.z),
            new Ammo.btVector3(triVec2.x, triVec2.y, triVec2.z),
            new Ammo.btVector3(triVec3.x, triVec3.y, triVec3.z),
            false
        );
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
    light.shadow.mapSize.width = 10000; // default
    light.shadow.mapSize.height = 10000; // default
    light.shadow.camera.near = 0.5; // default
    light.shadow.camera.far = 10000; // default
    light.shadow.camera.left = -10000;
    light.shadow.camera.bottom = -10000;
    light.shadow.camera.top = 10000;
    light.shadow.camera.right = 10000;
}
function setupGui() {
    gui.destroy();
    gui = new GUI();

    for (let key of Object.keys(menu)) {
        const param = menu[key];
        gui.add(param, 'f').name(param.n);
    }
}

function addBall() {
    const radius = 75;
    const widthSegs = 32;
    const heightSegs = 16;
    const initialY = 800;

    const geometry = new THREE.SphereGeometry( radius, widthSegs, heightSegs );
    const material = new THREE.MeshPhongMaterial( { color: 0xffff00 } );
    const sphere = new THREE.Mesh( geometry, material );
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    scene.add( sphere );
    sphere.position.y = initialY;
    sphere.userData.physicsBody = createAmmoBall(radius, sphere.position);
    console.log(`Added Ball:`, sphere);

    rigidBodies.push(sphere);
}

async function loadFbx(path) {
    const loader = new FBXLoader();
    return await new Promise(resolve => {
        loader.load(path, resolve);
    });
}

async function addModel() {
    const fbx = await loadFbx('./src/ThreeAmmo.fbx');
    const model = extractMesh(fbx);
    model.castShadow = true;
    model.receiveShadow = true;

    scene.add(model);

    const vertices = model.geometry.attributes.position.array;
    const triangles = getTriangles(vertices);
    const newTriangles = getTrianglesBarf(vertices, model.matrixWorld);

    console.log(`model`, model);
    model.userData.physicsBody = generateAmmoObjFromTrianglesConcave(newTriangles, model.position);
}

async function addModelBarf() {

    const scalefactor = 1;
    const fbx = await loadFbx('./src/ThreeAmmo.fbx');
    const model = extractMesh(fbx);
    const modelVertices = model.geometry.attributes.position.array;
    //scene.add(model);

    //model.rotation.set(-1.1, 0, 0);
    model.position.z = 75;

    console.log(`model`, model);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute( 'position', new THREE.BufferAttribute( modelVertices, 3 ) );
    geometry.rotateX(-Math.PI/2);
    geometry.scale(100, 100, 100);

    // you have to do this or it flickers
    geometry.computeVertexNormals();

    const material = new THREE.MeshPhongMaterial( { color: 0xdd00dd } );
    const mesh = new THREE.Mesh( geometry, material );

    //mesh.rotation.set(-Math.PI/2, 0, 0);
    //mesh.scale.set(100, 100, 100);

    const vertices = geometry.attributes.position.array;

    // okay lets skip this one more time....
    //scene.add(mesh);

    const triangles = getTriangles(vertices, mesh.matrixWorld);

    // now get the EXACT vercices that the triangle thing has
    const tverts = new Float32Array(modelVertices.length);
    for (let i = 0; i < triangles.length; i++) {
        const [tv1, tv2, tv3] = triangles[i];
        tverts[i*9] = tv1.x;
        tverts[i*9+1] = tv1.y;
        tverts[i*9+2] = tv1.z;
        tverts[i*9+3] = tv2.x;
        tverts[i*9+4] = tv2.y;
        tverts[i*9+5] = tv2.z;
        tverts[i*9+6] = tv3.x;
        tverts[i*9+7] = tv3.y;
        tverts[i*9+8] = tv3.z;
    }

    const tvertGeo = new THREE.BufferGeometry();
    tvertGeo.setAttribute( 'position', new THREE.BufferAttribute( tverts, 3 ) );
    tvertGeo.computeVertexNormals();
    const tvertMesh = new THREE.Mesh(tvertGeo, material);
    scene.add(tvertMesh);

    tvertMesh.userData.physicsBody = generateAmmoObjFromTriangles(triangles, model.position, model.quaternion);
}

function getTriangles(vertices) {
    const triangles = [];

    for (let i = 0; i < vertices.length - 9; i += 9) {
        triangles.push([
            { x:vertices[i], y:vertices[i+1], z:vertices[i+2]},
            { x:vertices[i+3], y:vertices[i+4], z:vertices[i+5]},
            { x:vertices[i+6], y:vertices[i+7], z:vertices[i+8]},
        ]);
    }

    console.log(`vertices:`, vertices);
    //console.log(`triangles:`, triangles);
    return triangles;
}

function getTrianglesBarf(vertices, matrixWorld) {
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

    console.log(`triangleVectors:`, triangleVectors);
    //console.log(`triangles:`, triangles);
    return triangles;
}

function extractMesh(fbx) {
    return fbx.children.find(child => child.type == 'Mesh');
}

//////////////////////////////
////  THREE STOPS HERE  //////
//////////////////////////////