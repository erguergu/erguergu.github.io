import * as THREE from './three.module.js';

import Stats from './stats.module.js';
import { GUI } from './dat.gui.module.js';

import { GLTFLoader } from './GLTFLoader.js';
import { FBXLoader } from './FBXLoader.js';
import { OrbitControls } from './OrbitControls.js';
import { TransformControls } from './TransformControls.js';

let gui;
let guiControls = [];

let container, stats;
let camera, scene, renderer;
let controls, transformControl;

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const onUpPosition = new THREE.Vector2();
const onDownPosition = new THREE.Vector2();

let characterModel;
//let treeModels;

const selectableObjects = [];
let selectedObjects = [];
let selectedBoxes = [];

const params = {
    addCube: addCube,
    addCone: addCone,
    addCylinder: addCylinder,
    addPlane: addPlane,
    addSphere: addSphere,
    addCharacter: addCharacter,
    cloneObject: cloneObject,
    removeObject: removeObject,
    setScale: setScale,
    setRotate: setRotate,
    setMove: setMove,
    createGroup: createGroup,
    ungroup: ungroup,
    changeColor: changeColor,
    lookAt: lookAt
};

init().then(result => animate());

async function init() {
    container = document.getElementById('container');

    characterModel = await loadFbx('./src/ybot.fbx');
    console.log(`character:`, characterModel);

    const treeModels = await loadGltf('./src/lowpoly_forest/scene.gltf');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x303030);

    camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 1, 10000);
    camera.position.set(0, 250, 1000);
    scene.add(camera);

    scene.add(new THREE.AmbientLight(0x666666));

    // const light = new THREE.SpotLight(0xffffff, 1.5);
    // light.position.set(0, 1500, 200);
    // light.angle = Math.PI * 0.2;
    // light.castShadow = true;
    // light.shadow.camera.near = 200;
    // light.shadow.camera.far = 2000;
    // light.shadow.bias = - 0.000222;
    // light.shadow.mapSize.width = 2048;
    // light.shadow.mapSize.height = 2048;
    //scene.add(light);

    const planeGeometry = new THREE.PlaneGeometry(2000, 2000);
    planeGeometry.rotateX(- Math.PI / 2);
    const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.2 });

    const plane = new THREE.Mesh(planeGeometry, planeMaterial);
    plane.position.y = - 200;
    plane.receiveShadow = true;
    scene.add(plane);

    const helper = new THREE.GridHelper(2000, 100);
    helper.position.y = - 199;
    helper.material.opacity = 0.25;
    helper.material.transparent = true;
    scene.add(helper);

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

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.damping = 0.2;
    controls.addEventListener('change', render);

    transformControl = new TransformControls(camera, renderer.domElement);
    console.log(`transformControl:`, transformControl);
    transformControl.setMode("scale");
    transformControl.rotationSnap = 0.0174533*5; // 5 degrees
    transformControl.scaleSnap = .5; 
    transformControl.translationSnap = 10; 
    transformControl.addEventListener('change', render);
    transformControl.addEventListener('dragging-changed', function (event) {
        controls.enabled = !event.value;
    });
    scene.add(transformControl);

    transformControl.addEventListener('objectChange', function (e) {

        // as you alter the object, you must also alter its bounding box
        selectedBoxes.forEach(box => box.update());
    });

    container.addEventListener('pointerdown', onPointerDown);
    container.addEventListener('pointerup', onPointerUp);
    container.addEventListener('pointermove', onPointerMove);
    container.addEventListener('dblclick', lookAt);

    loadTrees(treeModels);
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

    const oneSelected = selectedObjects.length == 1;
    const multSelected = selectedObjects.length > 1;
    const groupSelected = isGroupSelected();

    gui.add(params, 'addCube').name("Add Cube");
    gui.add(params, 'addCone').name("Add Cone");
    gui.add(params, 'addCylinder').name("Add Cylinder");
    gui.add(params, 'addPlane').name("Add Plane");
    gui.add(params, 'addSphere').name("Add Sphere");
    gui.add(params, 'addCharacter').name("Add Character");
    if (oneSelected) {
        if (groupSelected) {
            gui.add(params, 'ungroup').name('Ungroup');
        } else {
            gui.add(params, 'changeColor').name('Change Color');
            gui.add(params, 'lookAt').name('Look At');
        }
        gui.add(params, 'cloneObject').name("Clone");
        gui.add(params, 'removeObject').name("Remove");
        gui.add(params, 'setScale').name("Scale");
        gui.add(params, 'setRotate').name("Rotate");
        gui.add(params, 'setMove').name("Move");
    }
    if (multSelected) {
        gui.add(params, 'createGroup').name('Create Group');
    }
}

function isGroupSelected() {
    const oneSelected = selectedObjects.length == 1;
    return oneSelected && selectedObjects[0].userData.isGroup;
}

function lookAt() {
    if (selectedObjects.length == 1) {
        controls.target = selectedObjects[0].position.clone();
        controls.object.lookAt(selectedObjects[0].position);
    }
}

function addCube(position) {
    const geometry = new THREE.BoxGeometry(40, 40, 40);
    return addObject(geometry, position);
}

function addCone(position) {
    const geometry = new THREE.ConeGeometry(40, 80, 32);
    return addObject(geometry, position);
}

function addCylinder(position) {
    const geometry = new THREE.CylinderGeometry(40, 40, 80, 32);
    return addObject(geometry, position);
}

function addPlane(position) {
    const geometry = new THREE.PlaneGeometry(80, 80, 20, 20);
    const doubleSide = true;
    return addObject(geometry, position, doubleSide);
}

function addSphere(position) {
    const geometry = new THREE.SphereGeometry(40, 32, 16);
    return addObject(geometry, position);
}

function addCharacter(position) {
    return addFbx(characterModel, position);
}

function setObjectPosition(object, position) {

    if (position) {
        object.position.copy(position);
    } else {
        object.position.x = controls.target.x;
        object.position.y = controls.target.y;
        object.position.z = controls.target.z;
    }
}

function multiSelectObject(object) {
    // check if the object is already among the selected, if so remove it from the list
    const highestObject = getHighestLevelObject(object);
    const ind = selectedObjects.findIndex(p => p.uuid == highestObject.uuid);
    if (ind >= 0) {
        const [remObj] = selectedObjects.splice(ind, 1);
        const [remBox] = selectedBoxes.splice(ind, 1);
        scene.remove(remBox);
    } else {

        // otherwise just add the object to the list
        transformControl.detach();
        selectedObjects.push(highestObject);
        const box = new THREE.BoxHelper(highestObject, 0xffffff);
        selectedBoxes.push(box);
        scene.add(box);
    }
    setupGui();
}

function selectObject(object) {
    if (selectedObjects.length == 1 && selectedObjects[0] == object) {
        return;
    }
    deselectObject();
    const highestObject = getHighestLevelObject(object);
    selectedObjects.push(highestObject);
    selectedBoxes.push(new THREE.BoxHelper(highestObject, 0xffffff));
    scene.add(selectedBoxes[0]);
    setupGui();
    console.log(`you selected an object:`, highestObject);
}

function getHighestLevelObject(object) {
    if (object.parent.type == "Scene") {
        return object;
    } else {
        return getHighestLevelObject(object.parent);
    }
}

function deselectObject() {
    transformControl.detach();
    selectedBoxes.forEach(box => scene.remove(box));
    selectedBoxes.length = 0;
    selectedObjects.length = 0;
    setupGui();
}

function changeColor() {
    selectedObjects[0].material.color.set(Math.random() * 0xffffff);
}

function addObject(geometry, position, doubleSide) {
    const material = new THREE.MeshLambertMaterial({ color: Math.random() * 0xffffff, side: doubleSide ? THREE.DoubleSide : THREE.FrontSide });
    const object = new THREE.Mesh(geometry, material);

    setObjectPosition(object, position);

    object.castShadow = true;
    object.receiveShadow = true;
    scene.add(object);
    selectableObjects.push(object);
    selectObject(object);
    console.log(`created object:`, object);
    return object;
}

function addFbx(model, position) {
    const object = cloneFbx(model);
    object.userData.isFbx = true;
    //const object = model;
    setObjectPosition(object, position);
    scene.attach(object);
    selectableObjects.push(object);
    
    return object;
}

function addGltf(model, position) {
    const object = model.clone();
    object.userData.isGltf = false;
    //const object = model;
    setObjectPosition(object, position);
    scene.attach(object);
    selectableObjects.push(object);
    return object;
}

function createGroup() {
    const group = new THREE.Object3D();
    group.userData.isGroup = true;
    const newPosition = new THREE.Vector3();
    selectedObjects.forEach((child) => {
        newPosition.x += child.position.x;
        newPosition.y += child.position.y;
        newPosition.z += child.position.z;
        group.attach(child);
        removeObjectFromArray(child, selectableObjects);
    });
    newPosition.x /= selectedObjects.length;
    newPosition.y /= selectedObjects.length;
    newPosition.z /= selectedObjects.length;
    group.position.copy(newPosition);
    selectedObjects.forEach((child) => {
        child.position.x -= group.position.x;
        child.position.y -= group.position.y;
        child.position.z -= group.position.z;
    });
    deselectObject();
    scene.attach(group);
    selectableObjects.push(group);
    selectObject(group);
    console.log(`group created:`, group);
}

function ungroup() {
    const group = selectedObjects[0];
    const children = [];
    group.children.forEach(child => children.push(child));
    children.forEach(child => {
        scene.attach(child);
        selectableObjects.push(child);
    });
    removeObject(group); // get rid of the group object
    children.forEach(child => multiSelectObject(child));
}

function cloneObject(objectToClone) {
    if (!objectToClone && selectedObjects.length == 1) {
        objectToClone = selectedObjects[0];
    }
    if (!objectToClone) {
        return null;
    }
    const clone = objectToClone.userData.isFbx ? cloneFbx(characterModel) : objectToClone.clone();
    if (objectToClone.userData.isFbx) {
        scene.add(clone);
        clone.position.copy(objectToClone.position);
        clone.quaternion.copy(objectToClone.quaternion);
        clone.scale.copy(objectToClone.scale);
        //clone.position.sub(objectToClone.position);
    } else {
        scene.add(clone);
    }
    if (isGroupSelected()) {
        clone.userData.isGroup = true;
    }
    selectableObjects.push(clone);
    selectObject(clone);
    setMove();
    return clone;
}

function activateTransformControl() {
    if (selectedObjects.length == 1) {
        transformControl.attach(selectedObjects[0]);
    }
}

function setScale() {
    transformControl.setSpace("world");
    transformControl.setMode("scale");
    activateTransformControl();
}

function setRotate() {
    transformControl.setSpace("local");
    transformControl.setMode("rotate");
    activateTransformControl();
}

function setMove() {
    transformControl.setSpace("world");
    transformControl.setMode("translate");
    activateTransformControl();
}

function removeObject(object) {
    if (!object && selectedObjects.length == 1) {
        object = selectedObjects[0];
    }
    scene.remove(object);
    removeObjectFromArray(object, selectableObjects);
    deselectObject();
}

function removeObjectFromArray(object, array) {
    const ind = array.findIndex(p => p.uuid == object.uuid);
    if (ind >= 0) {
        array.splice(ind, 1);
    }
}

function animate() {
    requestAnimationFrame(animate);
    render();
    stats.update();
}

function render() {
    renderer.render(scene, camera);
}

function onPointerDown(event) {
    onDownPosition.x = event.clientX;
    onDownPosition.y = event.clientY;
}

function onPointerUp(event) {

    const controlKeyPressed = event.ctrlKey;

    onUpPosition.x = event.clientX;
    onUpPosition.y = event.clientY;

    if (onDownPosition.distanceTo(onUpPosition) === 0) {
        const raytraceObject = getRaytraceObject(event);
        if (controlKeyPressed) {
            if (raytraceObject) {
                multiSelectObject(raytraceObject);
            }
        }
        else {
            if (raytraceObject) {
                selectObject(raytraceObject)
            } else {
                deselectObject();
            }
        }
    }
}

function onPointerMove(event) {
}

function getRaytraceObject(event) {
    pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
    pointer.y = - (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(pointer, camera);

    const intersects = raycaster.intersectObjects(selectableObjects, true);

    if (intersects.length > 0) {
        const object = intersects[0].object;
        if (object !== transformControl.object) {
            return object;
        }
    }
    return null;
}

async function loadFbx(path) {
    const loader = new FBXLoader();
    return await new Promise(resolve => {
        loader.load(path, resolve);
    });
}

async function loadGltf(path) {
    const loader = new GLTFLoader();
    return await new Promise(resolve => {
        loader.load(path, resolve);
    });
}

function loadTrees(treeGltf) {
    const mainArray = treeGltf.scene.children[0].children[0].children[0].children;
    console.log(`tree array`, mainArray);
    const treeNames = [];
    for (let i = 0; i < 5; i++) { treeNames.push(`Pine00${i}`); }
    for (let i = 0; i < 10; i++) { treeNames.push(`Tree00${i}`); }
    for (let i = 10; i < 12; i++) { treeNames.push(`Tree0${i}`); }
    const min = Math.ceil(0);
    const max = Math.floor(treeNames.length);
    let ind = Math.floor(Math.random() * (max - min) + min);
    ind = 13;
    const randTree = mainArray.find(tree => tree.name == treeNames[ind]);
    console.log(`trying to get item ${ind}`, randTree);
    const instObj = addGltf(randTree);
    instObj.children[0].geometry.translate(1, -.25, -1.5);
}

const cloneFbx = (fbx) => {

    const clone = fbx.clone(true);
    clone.animations = fbx.animations;
    clone.skeleton = { bones: [] };

    const skinnedMeshes = {};

    fbx.traverse(node => {
        if (node.isSkinnedMesh) {
            skinnedMeshes[node.name] = node;
        }
    })

    const cloneBones = {};
    const cloneSkinnedMeshes = {};

    clone.traverse(node => {
        if (node.isBone) {
            cloneBones[node.name] = node;
        }

        if (node.isSkinnedMesh) {
            cloneSkinnedMeshes[node.name] = node;
        }
    })

    for (let name in skinnedMeshes) {
        const skinnedMesh = skinnedMeshes[name];
        const skeleton = skinnedMesh.skeleton;
        const cloneSkinnedMesh = cloneSkinnedMeshes[name];

        const orderedCloneBones = [];

        for (let i=0; i<skeleton.bones.length; i++) {
            const cloneBone = cloneBones[skeleton.bones[i].name];
            orderedCloneBones.push(cloneBone);
        }

        cloneSkinnedMesh.bind(
            new THREE.Skeleton(orderedCloneBones, skeleton.boneInverses),
            cloneSkinnedMesh.matrixWorld);

        // For animation to work correctly:
        clone.skeleton.bones.push(cloneSkinnedMesh);
        clone.skeleton.bones.push(...orderedCloneBones);
    }

    return clone
}