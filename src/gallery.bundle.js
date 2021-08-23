


/***/ "./src/ammo.js":
/*!*********************!*\
  !*** ./src/ammo.js ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "ammo": () => /* binding */ ammo,
/* harmony export */   "loadAmmo": () => /* binding */ loadAmmo,
/* harmony export */   "default": () => /* binding */ ammo
/* harmony export */ });
/* provided dependency */ var Ammo = __webpack_require__(/*! ammo.js */ "./node_modules/ammo.js/builds/ammo.js");
let ammo = null;

async function loadAmmo() {
  ammo = await Ammo();
}




/***/ }),

/***/ "./src/controllable.js":
/*!*****************************!*\
  !*** ./src/controllable.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => __WEBPACK_DEFAULT_EXPORT__
/* harmony export */ });
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_0__);


/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  addDevControl(guilFolder, controllableName, propName, options) {
    const controllable = this[`_${controllableName}`];
    if (controllable && controllable[propName] !== undefined) {
      if (options) {
        // controller with range
        const { range } = options;
        if (range && !lodash__WEBPACK_IMPORTED_MODULE_0___default().isUndefined(range.min) && !lodash__WEBPACK_IMPORTED_MODULE_0___default().isUndefined(range.max)) {
          return guilFolder.add(controllable, propName, range.min, range.max);
        }
      }

      // simple controller
      return guilFolder.add(controllable, propName);
    }

    throw Error(`No ${controllableName} properties found on controllable`);
  },
});


/***/ }),

/***/ "./src/datastore.js":
/*!**************************!*\
  !*** ./src/datastore.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => /* binding */ dataStore
/* harmony export */ });
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./entity.js */ "./src/entity.js");
/* harmony import */ var _entities_character_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./entities/character.js */ "./src/entities/character.js");
/* harmony import */ var _physics_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./physics.js */ "./src/physics.js");
/* harmony import */ var _entities_planet_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./entities/planet.js */ "./src/entities/planet.js");
/* harmony import */ var _graphics_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./graphics.js */ "./src/graphics.js");
/* harmony import */ var _entities_art_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./entities/art.js */ "./src/entities/art.js");
/* harmony import */ var _lib_maths_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./lib/maths.js */ "./src/lib/maths.js");








class Datastore {
  constructor() {
    this._entities = [];
  }

  // careful, order of adding entities matters (because of order dependencies between physic updates)
  init() {
    let character = this.addCharacter();
    this.addPlanet(character);
    this.addArts();
  }

  async addArts() {
    const response = await fetch('/assets/tests/arts.json');
    const artsData = await response.json();
    artsData.forEach((artInfo) => {
      let art = new _entities_art_js__WEBPACK_IMPORTED_MODULE_5__.Art(
        artInfo.name,
        {
          position: (0,_lib_maths_js__WEBPACK_IMPORTED_MODULE_6__.getRandomSpherePosition)(5.5),
          dimensions: {
            height: 0.75,
            width: 1,
          },
        },
        artInfo
      );

      art.init();
      this.addEntity(art);
      _physics_js__WEBPACK_IMPORTED_MODULE_2__.default.addToWorld(art);
      _graphics_js__WEBPACK_IMPORTED_MODULE_4__.default.addToScene(art);
    });
  }

  addPlanet(character) {
    let planet = new _entities_planet_js__WEBPACK_IMPORTED_MODULE_3__.default(
      'planet',
      {
        position: { x: 0, y: 0, z: 0 },
        radius: 5,
      },
      character
    );
    planet.init();
    this.addEntity(planet);
    _physics_js__WEBPACK_IMPORTED_MODULE_2__.default.addToWorld(planet);
    _graphics_js__WEBPACK_IMPORTED_MODULE_4__.default.addToScene(planet);
    return planet;
  }

  addCharacter() {
    let character = new _entities_character_js__WEBPACK_IMPORTED_MODULE_1__.default('characterController', {
      mass: 1,
      position: { x: 0, y: 5.5, z: 0 },
      dimensions: {
        radius: 0.25,
        height: 1,
      },
    });
    character.init();
    this.addEntity(character);
    _physics_js__WEBPACK_IMPORTED_MODULE_2__.default.addToWorld(character);
    _graphics_js__WEBPACK_IMPORTED_MODULE_4__.default.addToScene(character);
    return character;
  }

  addEntity(entity) {
    if (!(entity instanceof _entity_js__WEBPACK_IMPORTED_MODULE_0__.default)) {
      throw new TypeError();
    }
    this._entities.push(entity);
  }

  updateEntitiesPhysics() {
    this._entities.forEach((entity) => entity.updatePhysic());
  }

  updateEntitiesGraphics() {
    this._entities.forEach((entity) => entity.updateGraphic());
  }

  findByName(name) {
    return this._entities.find((entity) => entity.name === name);
  }
}

let dataStore = new Datastore();



/***/ }),

/***/ "./src/debug-view.js":
/*!***************************!*\
  !*** ./src/debug-view.js ***!
  \***************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "DEBUG_VIEWPORT_MIN_SIZE": () => /* binding */ DEBUG_VIEWPORT_MIN_SIZE,
/* harmony export */   "DEBUG_VIEWPORT_MAX_SIZE": () => /* binding */ DEBUG_VIEWPORT_MAX_SIZE,
/* harmony export */   "default": () => /* binding */ debugview
/* harmony export */ });
/* harmony import */ var three_build_three_module_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! three/build/three.module.js */ "./node_modules/three/build/three.module.js");
/* harmony import */ var three_examples_jsm_controls_OrbitControls_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! three/examples/jsm/controls/OrbitControls.js */ "./node_modules/three/examples/jsm/controls/OrbitControls.js");
/* harmony import */ var _controllable_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./controllable.js */ "./src/controllable.js");
/* harmony import */ var _graphics_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./graphics.js */ "./src/graphics.js");





const DEBUG_VOLUME = 10;
const INITIAL_DEBUG_VIEWPORT_SIZE = 300;
const HALF_DEBUG_VOLUME = DEBUG_VOLUME * 0.5;
const DEBUG_VIEWPORT_MIN_SIZE = 200;
const DEBUG_VIEWPORT_MAX_SIZE = 600;

class DebugView {
  constructor() {
    this._controls = { show: false, debugViewportSize: INITIAL_DEBUG_VIEWPORT_SIZE };
    this._domElement = document.createElement('div');
    this._domElement.id = 'debugView';

    Object.assign(this._domElement.style, {
      position: 'absolute',
      width: `${this._controls.debugViewportSize}px`,
      height: `${this._controls.debugViewportSize}px`,
      bottom: 0,
      left: 0,
      display: 'none',
    });

    this._debugCamera = new three_build_three_module_js__WEBPACK_IMPORTED_MODULE_0__.OrthographicCamera(
      -HALF_DEBUG_VOLUME,
      HALF_DEBUG_VOLUME,
      HALF_DEBUG_VOLUME,
      -HALF_DEBUG_VOLUME,
      1,
      100
    );

    this._orbit = new three_examples_jsm_controls_OrbitControls_js__WEBPACK_IMPORTED_MODULE_1__.OrbitControls(this._debugCamera, this._domElement);
  }

  init() {
    document.body.appendChild(this._domElement);
    Object.assign(this._debugCamera.position, { x: 5, y: 5, z: 5 });
    this._debugCamera.lookAt(0, 0, 0);
    this._orbit.update();
  }

  updateSize() {
    const { debugViewportSize: newSize } = this._controls;
    Object.assign(this._domElement.style, {
      width: newSize + 'px',
      height: newSize + 'px',
    });
  }

  animate() {
    const renderer = _graphics_js__WEBPACK_IMPORTED_MODULE_3__.default.getRenderer();
    const { debugViewportSize: viewportSize } = this._controls;
    this.animationFrameHandler = requestAnimationFrame(this.animate.bind(this));
    renderer.setViewport(0, 0, viewportSize, viewportSize);
    renderer.setScissor(0, 0, viewportSize, viewportSize);
    renderer.setScissorTest(true);
    renderer.render(_graphics_js__WEBPACK_IMPORTED_MODULE_3__.default.getMainScene(), this._debugCamera);
  }

  toggle(enabled) {
    if (enabled) {
      this.animate();
      this._domElement.style.display = 'block';
    } else {
      cancelAnimationFrame(this.animationFrameHandler);
      this._domElement.style.display = 'none';
    }
  }
}

Object.assign(DebugView.prototype, _controllable_js__WEBPACK_IMPORTED_MODULE_2__.default);
let debugview = new DebugView();




/***/ }),

/***/ "./src/entities/art.js":
/*!*****************************!*\
  !*** ./src/entities/art.js ***!
  \*****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "Art": () => /* binding */ Art
/* harmony export */ });
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../entity.js */ "./src/entity.js");
/* harmony import */ var _physics_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../physics.js */ "./src/physics.js");
/* harmony import */ var _ammo_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../ammo.js */ "./src/ammo.js");
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! three */ "./node_modules/three/build/three.module.js");
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../util.js */ "./src/util.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _lib_art_painter_js__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../lib/art-painter.js */ "./src/lib/art-painter.js");









class Art extends _entity_js__WEBPACK_IMPORTED_MODULE_0__.default {
  constructor(name, initProps, infos) {
    super(name, initProps);

    const {
      dimensions: { width, height },
    } = initProps;

    if (lodash__WEBPACK_IMPORTED_MODULE_5___default().isUndefined(width) || lodash__WEBPACK_IMPORTED_MODULE_5___default().isUndefined(height)) {
      this._throwMissingInitialPropsError(['dimensions.width', 'dimensions.height']);
    }

    if (lodash__WEBPACK_IMPORTED_MODULE_5___default().isUndefined(infos)) {
      throw Error(`Missing infos for art piece ${name}`);
    }

    this._infos = infos;
    this._btCollisionFlag = _physics_js__WEBPACK_IMPORTED_MODULE_1__.BT_FLAGS.CF_STATIC_OBJECT;
    this._shape = new _ammo_js__WEBPACK_IMPORTED_MODULE_2__.default.btBoxShape(new _ammo_js__WEBPACK_IMPORTED_MODULE_2__.default.btVector3(width / 2, height / 2, 0.1));
  }

  _initGraphic() {
    const {
      dimensions: { width, height },
      position,
    } = this._initProps;

    const artMesh = new three__WEBPACK_IMPORTED_MODULE_3__.Object3D();
    const widePlane = new three__WEBPACK_IMPORTED_MODULE_3__.PlaneGeometry(width, height);
    const thinPlane = new three__WEBPACK_IMPORTED_MODULE_3__.PlaneGeometry(0.01, height);
    const basicWhiteMaterial = new three__WEBPACK_IMPORTED_MODULE_3__.MeshBasicMaterial({ side: three__WEBPACK_IMPORTED_MODULE_3__.DoubleSide });

    let texturedMaterial = new three__WEBPACK_IMPORTED_MODULE_3__.MeshBasicMaterial();
    const frontMesh = new three__WEBPACK_IMPORTED_MODULE_3__.Mesh(widePlane, texturedMaterial);
    (0,_lib_art_painter_js__WEBPACK_IMPORTED_MODULE_6__.applyArtTexture)(this._infos, texturedMaterial);
    artMesh.add(frontMesh);

    const backSide = new three__WEBPACK_IMPORTED_MODULE_3__.Mesh(widePlane, texturedMaterial);
    backSide.rotateY(Math.PI);
    backSide.position.set(0, 0, -0.01);
    artMesh.add(backSide);

    const rightSide = new three__WEBPACK_IMPORTED_MODULE_3__.Mesh(thinPlane, basicWhiteMaterial);
    rightSide
      .rotateY(Math.PI / 2)
      .translateZ(width / 2)
      .translateX(0.005);
    artMesh.add(rightSide);

    const leftSide = new three__WEBPACK_IMPORTED_MODULE_3__.Mesh(thinPlane, basicWhiteMaterial);
    leftSide
      .rotateY(Math.PI / 2)
      .translateZ(-width / 2)
      .translateX(0.005);
    artMesh.add(leftSide);

    artMesh.position.set(position.x, position.y, position.z);
    this.graphic = artMesh;
  }

  init() {
    super.init();
    const { position } = this._initProps;

    // align with sphere origin
    let sphereCenterDirection = new three__WEBPACK_IMPORTED_MODULE_3__.Vector3(position.x, position.y, position.z).normalize();

    // extract up axis of character transform basis
    let up = new three__WEBPACK_IMPORTED_MODULE_3__.Vector3();
    this.graphic.matrixWorld.extractBasis(new three__WEBPACK_IMPORTED_MODULE_3__.Vector3(), up, new three__WEBPACK_IMPORTED_MODULE_3__.Vector3());

    let verticalAlignmentRotation = new three__WEBPACK_IMPORTED_MODULE_3__.Quaternion()
      .setFromUnitVectors(up, sphereCenterDirection)
      .multiply((0,_util_js__WEBPACK_IMPORTED_MODULE_4__.bt2ThreeQuat)(this.body.getWorldTransform().getRotation()));

    this.body.getWorldTransform().setRotation((0,_util_js__WEBPACK_IMPORTED_MODULE_4__.three2BtQuat)(verticalAlignmentRotation));
    const orientation = this.body.getWorldTransform().getRotation();
    this.graphic.quaternion.set(orientation.x(), orientation.y(), orientation.z(), orientation.w());
  }

  updateGraphic() {
    super.updateGraphic();
  }
}


/***/ }),

/***/ "./src/entities/character.js":
/*!***********************************!*\
  !*** ./src/entities/character.js ***!
  \***********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => /* binding */ CharacterEntity
/* harmony export */ });
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../entity.js */ "./src/entity.js");
/* harmony import */ var _input_controller_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../input-controller.js */ "./src/input-controller.js");
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! three */ "./node_modules/three/build/three.module.js");
/* harmony import */ var _ammo_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../ammo.js */ "./src/ammo.js");
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ../util.js */ "./src/util.js");
/* harmony import */ var _physics_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../physics.js */ "./src/physics.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var _graphics_js__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! ../graphics.js */ "./src/graphics.js");










const V_LOOK_ANGLE_MAX = three__WEBPACK_IMPORTED_MODULE_2__.MathUtils.degToRad(60);

class CharacterEntity extends _entity_js__WEBPACK_IMPORTED_MODULE_0__.default {
  constructor(name, initProps) {
    super(name, initProps);

    const {
      mass,
      position,
      dimensions: { radius, height },
    } = this._initProps;

    if (lodash__WEBPACK_IMPORTED_MODULE_6___default().isUndefined(mass) || lodash__WEBPACK_IMPORTED_MODULE_6___default().isUndefined(position) || lodash__WEBPACK_IMPORTED_MODULE_6___default().isUndefined(radius) || lodash__WEBPACK_IMPORTED_MODULE_6___default().isUndefined(height)) {
      this._throwMissingInitialPropsError();
    }

    this._shape = new _ammo_js__WEBPACK_IMPORTED_MODULE_3__.default.btCylinderShape(new _ammo_js__WEBPACK_IMPORTED_MODULE_3__.default.btVector3(radius * 0.5, height * 0.5, 0));
    this._verticalLookRotation = 0;
  }

  _initBody() {
    const { mass, position } = this._initProps;
    let transform = new _ammo_js__WEBPACK_IMPORTED_MODULE_3__.default.btTransform();
    transform.setIdentity();
    transform.setOrigin((0,_util_js__WEBPACK_IMPORTED_MODULE_4__.three2BtVec3)(position));
    transform.setRotation(new _ammo_js__WEBPACK_IMPORTED_MODULE_3__.default.btQuaternion(0, Math.PI, 0, 1));
    let motionState = new _ammo_js__WEBPACK_IMPORTED_MODULE_3__.default.btDefaultMotionState(transform);
    let localInertia = new _ammo_js__WEBPACK_IMPORTED_MODULE_3__.default.btVector3(0, 0, 0);
    this._shape.calculateLocalInertia(mass, localInertia);
    let rbInfo = new _ammo_js__WEBPACK_IMPORTED_MODULE_3__.default.btRigidBodyConstructionInfo(mass, motionState, this._shape, localInertia);
    let body = new _ammo_js__WEBPACK_IMPORTED_MODULE_3__.default.btRigidBody(rbInfo);
    body.setDamping(0, 1);
    body.setActivationState(_physics_js__WEBPACK_IMPORTED_MODULE_5__.BT_STATES.DISABLE_DEACTIVATION);
    this.body = body;
  }

  _initGraphic() {
    const {
      position,
      dimensions: { radius, height },
    } = this._initProps;
    const characterCylinder = new three__WEBPACK_IMPORTED_MODULE_2__.CylinderGeometry(radius, radius, height, 32);
    const characterMat = new three__WEBPACK_IMPORTED_MODULE_2__.MeshLambertMaterial({ color: 0xff00ff });
    const cylinder = new three__WEBPACK_IMPORTED_MODULE_2__.Mesh(characterCylinder, characterMat);
    cylinder.position.set(position.x, position.y, position.z);

    this._localAxesHelper = new three__WEBPACK_IMPORTED_MODULE_2__.AxesHelper(1);
    this._localAxesHelper.visible = true;
    cylinder.add(this._localAxesHelper);
    cylinder.add(_graphics_js__WEBPACK_IMPORTED_MODULE_7__.default.getMainCamera());
    this.graphic = cylinder;
  }

  _move() {
    let scalingFactor = 0.02;
    let moveX = _input_controller_js__WEBPACK_IMPORTED_MODULE_1__.default.getMoveX();
    let moveZ = _input_controller_js__WEBPACK_IMPORTED_MODULE_1__.default.getMoveZ();
    let deltaMouseX = _input_controller_js__WEBPACK_IMPORTED_MODULE_1__.default.getDeltaMouseX() * 0.01;
    let deltaMouseY = _input_controller_js__WEBPACK_IMPORTED_MODULE_1__.default.getDeltaMouseY() * 0.01;

    if (moveX === 0 && moveZ === 0 && deltaMouseX === 0 && deltaMouseY === 0) return;

    let movement = new three__WEBPACK_IMPORTED_MODULE_2__.Vector3(moveX, 0, moveZ).normalize();
    movement.multiplyScalar(scalingFactor);
    let wantedWorldPos = this.graphic.localToWorld(movement);
    this.body
      .getWorldTransform()
      .setOrigin(new _ammo_js__WEBPACK_IMPORTED_MODULE_3__.default.btVector3(wantedWorldPos.x, wantedWorldPos.y, wantedWorldPos.z));

    let rotation = new three__WEBPACK_IMPORTED_MODULE_2__.Quaternion();
    rotation.setFromAxisAngle(new three__WEBPACK_IMPORTED_MODULE_2__.Vector3(0, 1, 0), deltaMouseX);
    let newOri = this.body.getWorldTransform().getRotation().op_mulq((0,_util_js__WEBPACK_IMPORTED_MODULE_4__.three2BtQuat)(rotation));
    this.body.getWorldTransform().setRotation(newOri);
    this._verticalLookRotation += deltaMouseY;
    this._verticalLookRotation = three__WEBPACK_IMPORTED_MODULE_2__.MathUtils.clamp(
      this._verticalLookRotation,
      -V_LOOK_ANGLE_MAX,
      V_LOOK_ANGLE_MAX
    );
    _graphics_js__WEBPACK_IMPORTED_MODULE_7__.default.getMainCamera().rotation.set(-this._verticalLookRotation, Math.PI, 0);
  }

  updatePhysic() {
    this._move();
  }
}


/***/ }),

/***/ "./src/entities/planet.js":
/*!********************************!*\
  !*** ./src/entities/planet.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => /* binding */ PlanetEntity
/* harmony export */ });
/* harmony import */ var _entity_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../entity.js */ "./src/entity.js");
/* harmony import */ var _ammo_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ../ammo.js */ "./src/ammo.js");
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ../util.js */ "./src/util.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! three */ "./node_modules/three/build/three.module.js");
/* harmony import */ var _physics_js__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../physics.js */ "./src/physics.js");








class PlanetEntity extends _entity_js__WEBPACK_IMPORTED_MODULE_0__.default {
  constructor(name, initProps, character) {
    super(name, initProps);

    if (lodash__WEBPACK_IMPORTED_MODULE_3___default().isUndefined(initProps.radius) || lodash__WEBPACK_IMPORTED_MODULE_3___default().isUndefined(character)) {
      this._throwMissingInitialPropsError();
    }

    this._characterEntity = character;
    this._btCollisionFlag = _physics_js__WEBPACK_IMPORTED_MODULE_5__.BT_FLAGS.CF_STATIC_OBJECT;
    this._shape = new _ammo_js__WEBPACK_IMPORTED_MODULE_1__.default.btSphereShape(initProps.radius);
    this._shape.setMargin(0.05);
    this._sphere = {
      visible: true
    }
  }

  _loadMaterial() {
    let material = new three__WEBPACK_IMPORTED_MODULE_4__.MeshStandardMaterial();
    const loader = new three__WEBPACK_IMPORTED_MODULE_4__.TextureLoader().setPath('assets/textures/floor/');

    material.map = loader.load('hardwood-brown-planks-albedo.png');
    material.map.encoding = three__WEBPACK_IMPORTED_MODULE_4__.sRGBEncoding;

    material.metalnessMap = loader.load('hardwood-brown-planks-metallic.png');
    material.roughnessMap = loader.load('hardwood-brown-planks-roughness.png');
    material.normalMap = loader.load('hardwood-brown-planks-normal-ogl.png');

    const tiling = new three__WEBPACK_IMPORTED_MODULE_4__.Vector2(20, 20);
    ['map', 'roughnessMap', 'metalnessMap', 'normalMap'].forEach((mapName) => {
      material[mapName].wrapS = material[mapName].wrapT = three__WEBPACK_IMPORTED_MODULE_4__.RepeatWrapping;
      material[mapName].repeat = tiling;
    });

    return material;
  }

  _initGraphic() {
    const { radius, position } = this._initProps;

    const geometry = new three__WEBPACK_IMPORTED_MODULE_4__.SphereGeometry(radius, 32, 32);
    const material = this._loadMaterial();
    const sphere = new three__WEBPACK_IMPORTED_MODULE_4__.Mesh(geometry, material);
    sphere.position.set(position.x, position.y, position.z);

    this.graphic = sphere;
  }

  _applyAttraction() {
    let sphereOrigin = this.body.getWorldTransform().getOrigin();
    let characterOrigin = this._characterEntity.body.getWorldTransform().getOrigin();

    // compute and apply sphere gravity to character body
    let sphereAttractionForce = new _ammo_js__WEBPACK_IMPORTED_MODULE_1__.default.btVector3(
      characterOrigin.x() - sphereOrigin.x(),
      characterOrigin.y() - sphereOrigin.y(),
      characterOrigin.z() - sphereOrigin.z()
    );
    sphereAttractionForce.normalize();
    sphereAttractionForce.op_mul(_physics_js__WEBPACK_IMPORTED_MODULE_5__.gravity);
    this._characterEntity.body.applyForce(sphereAttractionForce, _ammo_js__WEBPACK_IMPORTED_MODULE_1__.default.btVector3(0, 0, 0));

    // align character up with sphere origin
    const gravityDirection = (0,_util_js__WEBPACK_IMPORTED_MODULE_2__.bt2ThreeVec3)(sphereAttractionForce).normalize().multiplyScalar(-1);

    // extract up axis of character transform basis
    let characterUp = new three__WEBPACK_IMPORTED_MODULE_4__.Vector3();
    this._characterEntity.graphic.matrixWorld.extractBasis(
      new three__WEBPACK_IMPORTED_MODULE_4__.Vector3(),
      characterUp,
      new three__WEBPACK_IMPORTED_MODULE_4__.Vector3()
    );

    // apply rotation to align up with gravity vector
    let verticalAlignmentRotation = new three__WEBPACK_IMPORTED_MODULE_4__.Quaternion()
      .setFromUnitVectors(characterUp, gravityDirection)
      .multiply((0,_util_js__WEBPACK_IMPORTED_MODULE_2__.bt2ThreeQuat)(this._characterEntity.body.getWorldTransform().getRotation()));

    this._characterEntity.body.getWorldTransform().setRotation((0,_util_js__WEBPACK_IMPORTED_MODULE_2__.three2BtQuat)(verticalAlignmentRotation));
  }

  updatePhysic() {
    this._applyAttraction();
  }

  toggleVisibility(){
    this.graphic.visible = this._sphere.visible;
  }

}


/***/ }),

/***/ "./src/entity.js":
/*!***********************!*\
  !*** ./src/entity.js ***!
  \***********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => __WEBPACK_DEFAULT_EXPORT__
/* harmony export */ });
/* harmony import */ var _ammo_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./ammo.js */ "./src/ammo.js");
/* harmony import */ var _controllable_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./controllable.js */ "./src/controllable.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! lodash */ "./node_modules/lodash/lodash.js");
/* harmony import */ var lodash__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(lodash__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _util_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./util.js */ "./src/util.js");
/* harmony import */ var _physics_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./physics.js */ "./src/physics.js");






// Abstract
class Entity {
  constructor(name = 'jane do', initProps = {}) {
    if (lodash__WEBPACK_IMPORTED_MODULE_2___default().isUndefined(initProps.position)) {
      this._throwMissingInitialPropsError('position');
    }

    this.name = name;
    this.body = null;
    this.graphic = null;
    this._initProps = initProps;
  }

  _throwMissingInitialPropsError(...propsName) {
    throw Error(`Missing initial properties ${propsName.join(',')} for ${this.name}`);
  }

  init() {
    this._initBody();
    this._initGraphic();
  }

  _initBody() {
    const { position } = this._initProps;

    let transform = new _ammo_js__WEBPACK_IMPORTED_MODULE_0__.default.btTransform();
    transform.setIdentity();
    transform.setOrigin((0,_util_js__WEBPACK_IMPORTED_MODULE_3__.three2BtVec3)(position));
    transform.setRotation(new _ammo_js__WEBPACK_IMPORTED_MODULE_0__.default.btQuaternion(0, 0, 0, 1));
    let motionState = new _ammo_js__WEBPACK_IMPORTED_MODULE_0__.default.btDefaultMotionState(transform);

    let localInertia = new _ammo_js__WEBPACK_IMPORTED_MODULE_0__.default.btVector3(0, 0, 0);
    this._shape.calculateLocalInertia(0, localInertia);

    let rbInfo = new _ammo_js__WEBPACK_IMPORTED_MODULE_0__.default.btRigidBodyConstructionInfo(0, motionState, this._shape, localInertia);
    let body = new _ammo_js__WEBPACK_IMPORTED_MODULE_0__.default.btRigidBody(rbInfo);

    if (!lodash__WEBPACK_IMPORTED_MODULE_2___default().isUndefined(this._btCollisionFlag)) {
      body.setCollisionFlags(this._btCollisionFlag);
    }

    this.body = body;
  }

  _initGraphic() {
    throw Error('Missing implementation');
  }

  updatePhysic() {}

  updateGraphic() {
    let ms = this.body.getMotionState();
    if (ms && !(this.body.getCollisionFlags() === _physics_js__WEBPACK_IMPORTED_MODULE_4__.BT_FLAGS.CF_STATIC_OBJECT)) {
      let transform = new _ammo_js__WEBPACK_IMPORTED_MODULE_0__.default.btTransform();
      ms.getWorldTransform(transform);
      const origin = transform.getOrigin();
      const rotation = transform.getRotation();
      this.graphic.position.set(origin.x(), origin.y(), origin.z());
      this.graphic.quaternion.set(rotation.x(), rotation.y(), rotation.z(), rotation.w());
    }
  }
}

Object.assign(Entity.prototype, _controllable_js__WEBPACK_IMPORTED_MODULE_1__.default);
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (Entity);


/***/ }),

/***/ "./src/graphics.js":
/*!*************************!*\
  !*** ./src/graphics.js ***!
  \*************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => /* binding */ graphics
/* harmony export */ });
/* harmony import */ var three_build_three_module_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! three/build/three.module.js */ "./node_modules/three/build/three.module.js");
/* harmony import */ var _controllable_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./controllable.js */ "./src/controllable.js");



class Graphics {
  constructor() {
    this._scene = new three_build_three_module_js__WEBPACK_IMPORTED_MODULE_0__.Scene();
    this._mainCamera = new three_build_three_module_js__WEBPACK_IMPORTED_MODULE_0__.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    this._renderer = new three_build_three_module_js__WEBPACK_IMPORTED_MODULE_0__.WebGLRenderer();
  }

  init() {
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this._renderer.domElement);
    this._renderer.domElement.style.cursor = 'none';

    const light = new three_build_three_module_js__WEBPACK_IMPORTED_MODULE_0__.AmbientLight(0x4c4c4c, 3); // soft white light
    this._scene.add(light);

    const directionalLight = new three_build_three_module_js__WEBPACK_IMPORTED_MODULE_0__.DirectionalLight(0xfff6dd, 3);
    this._scene.add(directionalLight);

    this._axesHelper = new three_build_three_module_js__WEBPACK_IMPORTED_MODULE_0__.AxesHelper(50);
    this._axesHelper.visible = false;
    this._scene.add(this._axesHelper);

    const loader = new three_build_three_module_js__WEBPACK_IMPORTED_MODULE_0__.CubeTextureLoader().setPath('assets/skybox/');
    this._scene.background = loader.load([
      'right.png',
      'left.png',
      'top.png',
      'bottom.png',
      'front.png',
      'back.png',
    ]);

    this._mainCameraHelper = new three_build_three_module_js__WEBPACK_IMPORTED_MODULE_0__.CameraHelper(this._mainCamera);
    this._mainCameraHelper.visible = false;
    this._scene.add(this._mainCameraHelper);

    window.addEventListener('resize', () => this._handleResize());
  }

  _handleResize() {
    this._renderer.setSize(window.innerWidth, window.innerHeight);
    this._mainCamera.ratio = window.innerWidth / window.innerHeight;
    this._mainCamera.updateProjectionMatrix();
  }

  getMainCamera() {
    return this._mainCamera;
  }

  getRenderer() {
    return this._renderer;
  }

  getMainScene() {
    return this._scene;
  }

  addToScene(entity) {
    this._scene.add(entity.graphic);
  }

  render() {
    this._renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
    this._renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
    this._renderer.setScissorTest(true);
    this._renderer.render(this._scene, this._mainCamera);
  }
}

Object.assign(Graphics.prototype, _controllable_js__WEBPACK_IMPORTED_MODULE_1__.default);

const graphics = new Graphics();



/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _style_global_css__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./style/global.css */ "./src/style/global.css");
/* harmony import */ var three_build_three_module_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! three/build/three.module.js */ "./node_modules/three/build/three.module.js");
/* harmony import */ var _ammo_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./ammo.js */ "./src/ammo.js");
/* harmony import */ var _datastore_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./datastore.js */ "./src/datastore.js");
/* harmony import */ var _debug_view_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./debug-view.js */ "./src/debug-view.js");






(async () => {
  await (0,_ammo_js__WEBPACK_IMPORTED_MODULE_2__.loadAmmo)();

  // we need to have AmmoJs loaded before importing all these modules
  const [
    { default: inputController },
    { default: physicsEngine },
    { default: graphicsEngine },
    { default: devtools },
  ] = await Promise.all([
    Promise.resolve(/*! import() */).then(__webpack_require__.bind(__webpack_require__, /*! ./input-controller.js */ "./src/input-controller.js")),
    Promise.resolve(/*! import() */).then(__webpack_require__.bind(__webpack_require__, /*! ./physics.js */ "./src/physics.js")),
    Promise.resolve(/*! import() */).then(__webpack_require__.bind(__webpack_require__, /*! ./graphics.js */ "./src/graphics.js")),
    Promise.all(/*! import() */[__webpack_require__.e("vendors-node_modules_dat_gui_build_dat_gui_module_js"), __webpack_require__.e("src_devtools_js")]).then(__webpack_require__.bind(__webpack_require__, /*! ./devtools.js */ "./src/devtools.js")),
  ]);

  let clock = new three_build_three_module_js__WEBPACK_IMPORTED_MODULE_1__.Clock();

  // !! order matters here

  inputController.init();
  graphicsEngine.init();
  physicsEngine.init();
  _datastore_js__WEBPACK_IMPORTED_MODULE_3__.default.init();
  _debug_view_js__WEBPACK_IMPORTED_MODULE_4__.default.init();
  devtools.init();

  update();

  function update() {
    let deltaTime = clock.getDelta();

    physicsEngine.updatePhysics(deltaTime);
    graphicsEngine.render();

    requestAnimationFrame(update);
  }
})();


/***/ }),

/***/ "./src/input-controller.js":
/*!*********************************!*\
  !*** ./src/input-controller.js ***!
  \*********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => /* binding */ controller
/* harmony export */ });
const defaultKeys = {
  87: 'forward', // w
  83: 'back', // s
  65: 'left', // a
  68: 'right', // d
};

class InputController {
  constructor({ keyCodes = defaultKeys } = {}) {
    this._keyCodes = keyCodes;
    this._moveDirection = {
      forward: 0,
      back: 0,
      left: 0,
      right: 0,
    };

    this._mouseX = this._latestMouseX = 0;
    this._mouseY = this._latestMouseY = 0;
  }

  init() {
    document.addEventListener('keydown', this._handleKeyDown.bind(this));
    document.addEventListener('keyup', this._handleKeyUp.bind(this));
    document.addEventListener('mousemove', this._initMouseMoveHandling.bind(this), { once: true });
  }

  _initMouseMoveHandling(event) {
    this._mouseX = this._latestMouseX = event.clientX;
    this._mouseY = this._latestMouseY = event.clientY;

    document.addEventListener('mousemove', this._handleMouseMove.bind(this));
  }

  _handleMouseMove(event) {
    this._latestMouseX = event.clientX;
    this._latestMouseY = event.clientY;
  }

  _handleKeyDown(event) {
    let keyCode = event.keyCode;
    this._moveDirection[this._keyCodes[keyCode]] = 1;
  }

  _handleKeyUp(event) {
    let keyCode = event.keyCode;
    this._moveDirection[this._keyCodes[keyCode]] = 0;
  }

  getMoveX() {
    return this._moveDirection.left - this._moveDirection.right;
  }

  getMoveZ() {
    return this._moveDirection.forward - this._moveDirection.back;
  }

  getDeltaMouseX() {
    if (this._mouseX === this._latestMouseX) {
      return 0;
    }

    let delta = this._mouseX - this._latestMouseX;
    this._mouseX = this._latestMouseX;
    return delta;
  }

  getDeltaMouseY() {
    if (this._mouseY === this._latestMouseY) {
      return 0;
    }

    let delta = this._mouseY - this._latestMouseY;
    this._mouseY = this._latestMouseY;
    return delta;
  }
}

let controller = new InputController();



/***/ }),

/***/ "./src/lib/art-painter.js":
/*!********************************!*\
  !*** ./src/lib/art-painter.js ***!
  \********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "applyArtTexture": () => /* binding */ applyArtTexture
/* harmony export */ });
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! three */ "./node_modules/three/build/three.module.js");


function applyArtTexture({ imageUrl, name, year, artist, algo, id }, material) {
  let canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 600;

  let img = new Image();
  let ctx = canvas.getContext('2d');
  ctx.fillStyle = '#FFFFFF';

  ctx.fillRect(0, 0, 800, 600);
  img.onload = () => {
    ctx.drawImage(img, 20, 44);
    ctx.fillStyle = '#000000';
    ctx.font = '32px arial';
    ctx.fillText(`${name}`, 552, 400);
    ctx.font = '20px arial';
    ctx.fillText(`${artist}`, 552, 450);
    ctx.fillText(`${year}`, 552, 480);
    ctx.fillText(`${algo}`, 552, 510);
    ctx.fillText(`${id}`, 552, 540);
    material.map = new three__WEBPACK_IMPORTED_MODULE_0__.CanvasTexture(canvas);
    material.needsUpdate = true;
  };
  img.src = imageUrl;
}


/***/ }),

/***/ "./src/lib/constants.js":
/*!******************************!*\
  !*** ./src/lib/constants.js ***!
  \******************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "MathConst": () => /* binding */ MathConst
/* harmony export */ });
const MathConst = {
  H_PI: Math.PI * 0.5,
  PI_2: Math.PI * 2,
};


/***/ }),

/***/ "./src/lib/maths.js":
/*!**************************!*\
  !*** ./src/lib/maths.js ***!
  \**************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "getRandomSpherePosition": () => /* binding */ getRandomSpherePosition
/* harmony export */ });
/* harmony import */ var _constants__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./constants */ "./src/lib/constants.js");
/* harmony import */ var random__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! random */ "./node_modules/random/index.js");
/* harmony import */ var random__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(random__WEBPACK_IMPORTED_MODULE_1__);



// http://corysimon.github.io/articles/uniformdistn-on-sphere/
function getRandomSpherePosition(radius) {
  const teta = _constants__WEBPACK_IMPORTED_MODULE_0__.MathConst.PI_2 * random__WEBPACK_IMPORTED_MODULE_1___default().float();
  const phi = Math.acos(1 - 2 * random__WEBPACK_IMPORTED_MODULE_1___default().float());
  return {
    x: radius * Math.sin(phi) * Math.sin(teta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.cos(teta),
  };
}


/***/ }),

/***/ "./src/physics.js":
/*!************************!*\
  !*** ./src/physics.js ***!
  \************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "BT_STATES": () => /* binding */ BT_STATES,
/* harmony export */   "BT_FLAGS": () => /* binding */ BT_FLAGS,
/* harmony export */   "gravity": () => /* binding */ gravity,
/* harmony export */   "default": () => /* binding */ physics
/* harmony export */ });
/* harmony import */ var _datastore_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./datastore.js */ "./src/datastore.js");
/* harmony import */ var _ammo_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ammo.js */ "./src/ammo.js");



const BT_STATES = {
  DISABLE_DEACTIVATION: 4,
};

const BT_FLAGS = {
  CF_STATIC_OBJECT: 1,
  CF_KINEMATIC_OBJECT: 2,
};

const gravity = -9.8;

class Physics {
  constructor() {
    this._world = null;
  }

  async init() {
    let collisionConfiguration = new _ammo_js__WEBPACK_IMPORTED_MODULE_1__.default.btDefaultCollisionConfiguration(),
      dispatcher = new _ammo_js__WEBPACK_IMPORTED_MODULE_1__.default.btCollisionDispatcher(collisionConfiguration),
      overlappingPairCache = new _ammo_js__WEBPACK_IMPORTED_MODULE_1__.default.btDbvtBroadphase(),
      solver = new _ammo_js__WEBPACK_IMPORTED_MODULE_1__.default.btSequentialImpulseConstraintSolver();

    this._world = new _ammo_js__WEBPACK_IMPORTED_MODULE_1__.default.btDiscreteDynamicsWorld(
      dispatcher,
      overlappingPairCache,
      solver,
      collisionConfiguration
    );
    this._world.setGravity(new _ammo_js__WEBPACK_IMPORTED_MODULE_1__.default.btVector3(0, 0, 0));
  }

  // allows to add entities to the physical world
  addToWorld(entity) {
    this._world.addRigidBody(entity.body);
  }

  updatePhysics(deltaTime) {
    _datastore_js__WEBPACK_IMPORTED_MODULE_0__.default.updateEntitiesPhysics();
    this._world.stepSimulation(deltaTime, 10);
    _datastore_js__WEBPACK_IMPORTED_MODULE_0__.default.updateEntitiesGraphics(); // todo: this is odd, graphics update should be probably better elsewhere
  }
}
const physics = new Physics();




/***/ }),

/***/ "./src/util.js":
/*!*********************!*\
  !*** ./src/util.js ***!
  \*********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "btInspectQuat": () => /* binding */ btInspectQuat,
/* harmony export */   "btInspectVec3": () => /* binding */ btInspectVec3,
/* harmony export */   "bt2ThreeVec3": () => /* binding */ bt2ThreeVec3,
/* harmony export */   "bt2ThreeQuat": () => /* binding */ bt2ThreeQuat,
/* harmony export */   "three2BtQuat": () => /* binding */ three2BtQuat,
/* harmony export */   "three2BtVec3": () => /* binding */ three2BtVec3
/* harmony export */ });
/* harmony import */ var three__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! three */ "./node_modules/three/build/three.module.js");
/* harmony import */ var _ammo_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./ammo.js */ "./src/ammo.js");



function btInspectQuat(quaternion) {
  return `{x: ${quaternion.x()}, y: ${quaternion.y()}, z: ${quaternion.z()}, w: ${quaternion.w()}}`;
}

function btInspectVec3(vector) {
  return `{x: ${vector.x()}, y: ${vector.y()}, z: ${vector.z()}}`;
}

function bt2ThreeVec3(vector) {
  return new three__WEBPACK_IMPORTED_MODULE_0__.Vector3(vector.x(), vector.y(), vector.z());
}

function bt2ThreeQuat(quaternion) {
  return new three__WEBPACK_IMPORTED_MODULE_0__.Quaternion(quaternion.x(), quaternion.y(), quaternion.z(), quaternion.w());
}

function three2BtQuat(quaternion) {
  return new _ammo_js__WEBPACK_IMPORTED_MODULE_1__.default.btQuaternion(quaternion.x, quaternion.y, quaternion.z, quaternion.w);
}

function three2BtVec3(vector) {
  return new _ammo_js__WEBPACK_IMPORTED_MODULE_1__.default.btVector3(vector.x, vector.y, vector.z);
}


/***/ }),

/***/ "?8465":
/*!************************!*\
  !*** crypto (ignored) ***!
  \************************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "?65c5":
/*!********************!*\
  !*** fs (ignored) ***!
  \********************/
/***/ (() => {

/* (ignored) */

/***/ }),

/***/ "?0f27":
/*!**********************!*\
  !*** path (ignored) ***!
  \**********************/
/***/ (() => {

/* (ignored) */

/***/ })

 	});
/************************************************************************/
 	// The module cache
 	var __webpack_module_cache__ = {};
 	
 	// The require function
 	function __webpack_require__(moduleId) {
 		// Check if module is in cache
 		if(__webpack_module_cache__[moduleId]) {
 			return __webpack_module_cache__[moduleId].exports;
 		}
 		// Create a new module (and put it into the cache)
 		var module = __webpack_module_cache__[moduleId] = {
 			id: moduleId,
 			loaded: false,
 			exports: {}
 		};
 	
 		// Execute the module function
 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
 	
 		// Flag the module as loaded
 		module.loaded = true;
 	
 		// Return the exports of the module
 		return module.exports;
 	}
 	
 	// expose the modules object (__webpack_modules__)
 	__webpack_require__.m = __webpack_modules__;
 	
/************************************************************************/
 	/* webpack/runtime/amd define */
 	(() => {
 		__webpack_require__.amdD = function () {
 			throw new Error('define cannot be used indirect');
 		};
 	})();
 	
 	/* webpack/runtime/amd options */
 	(() => {
 		__webpack_require__.amdO = {};
 	})();
 	
 	/* webpack/runtime/compat get default export */
 	(() => {
 		// getDefaultExport function for compatibility with non-harmony modules
 		__webpack_require__.n = (module) => {
 			var getter = module && module.__esModule ?
 				() => module['default'] :
 				() => module;
 			__webpack_require__.d(getter, { a: getter });
 			return getter;
 		};
 	})();
 	
 	/* webpack/runtime/define property getters */
 	(() => {
 		// define getter functions for harmony exports
 		__webpack_require__.d = (exports, definition) => {
 			for(var key in definition) {
 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
 				}
 			}
 		};
 	})();
 	
 	/* webpack/runtime/ensure chunk */
 	(() => {
 		__webpack_require__.f = {};
 		// This file contains only the entry chunk.
 		// The chunk loading function for additional chunks
 		__webpack_require__.e = (chunkId) => {
 			return Promise.all(Object.keys(__webpack_require__.f).reduce((promises, key) => {
 				__webpack_require__.f[key](chunkId, promises);
 				return promises;
 			}, []));
 		};
 	})();
 	
 	/* webpack/runtime/get javascript chunk filename */
 	(() => {
 		// This function allow to reference async chunks
 		__webpack_require__.u = (chunkId) => {
 			// return url for filenames based on template
 			return "" + chunkId + ".bundle.js";
 		};
 	})();
 	
 	/* webpack/runtime/global */
 	(() => {
 		__webpack_require__.g = (function() {
 			if (typeof globalThis === 'object') return globalThis;
 			try {
 				return this || new Function('return this')();
 			} catch (e) {
 				if (typeof window === 'object') return window;
 			}
 		})();
 	})();
 	
 	/* webpack/runtime/hasOwnProperty shorthand */
 	(() => {
 		__webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop)
 	})();
 	
 	/* webpack/runtime/load script */
 	(() => {
 		var inProgress = {};
 		var dataWebpackPrefix = "ai-gallery:";
 		// loadScript function to load a script via script tag
 		__webpack_require__.l = (url, done, key, chunkId) => {
 			if(inProgress[url]) { inProgress[url].push(done); return; }
 			var script, needAttach;
 			if(key !== undefined) {
 				var scripts = document.getElementsByTagName("script");
 				for(var i = 0; i < scripts.length; i++) {
 					var s = scripts[i];
 					if(s.getAttribute("src") == url || s.getAttribute("data-webpack") == dataWebpackPrefix + key) { script = s; break; }
 				}
 			}
 			if(!script) {
 				needAttach = true;
 				script = document.createElement('script');
 		
 				script.charset = 'utf-8';
 				script.timeout = 120;
 				if (__webpack_require__.nc) {
 					script.setAttribute("nonce", __webpack_require__.nc);
 				}
 				script.setAttribute("data-webpack", dataWebpackPrefix + key);
 				script.src = url;
 			}
 			inProgress[url] = [done];
 			var onScriptComplete = (prev, event) => {
 				// avoid mem leaks in IE.
 				script.onerror = script.onload = null;
 				clearTimeout(timeout);
 				var doneFns = inProgress[url];
 				delete inProgress[url];
 				script.parentNode && script.parentNode.removeChild(script);
 				doneFns && doneFns.forEach((fn) => fn(event));
 				if(prev) return prev(event);
 			}
 			;
 			var timeout = setTimeout(onScriptComplete.bind(null, undefined, { type: 'timeout', target: script }), 120000);
 			script.onerror = onScriptComplete.bind(null, script.onerror);
 			script.onload = onScriptComplete.bind(null, script.onload);
 			needAttach && document.head.appendChild(script);
 		};
 	})();
 	
 	/* webpack/runtime/make namespace object */
 	(() => {
 		// define __esModule on exports
 		__webpack_require__.r = (exports) => {
 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
 			}
 			Object.defineProperty(exports, '__esModule', { value: true });
 		};
 	})();
 	
 	/* webpack/runtime/node module decorator */
 	(() => {
 		__webpack_require__.nmd = (module) => {
 			module.paths = [];
 			if (!module.children) module.children = [];
 			return module;
 		};
 	})();
 	
 	/* webpack/runtime/publicPath */
 	(() => {
 		var scriptUrl;
 		if (__webpack_require__.g.importScripts) scriptUrl = __webpack_require__.g.location + "";
 		var document = __webpack_require__.g.document;
 		if (!scriptUrl && document) {
 			if (document.currentScript)
 				scriptUrl = document.currentScript.src
 			if (!scriptUrl) {
 				var scripts = document.getElementsByTagName("script");
 				if(scripts.length) scriptUrl = scripts[scripts.length - 1].src
 			}
 		}
 		// When supporting browsers where an automatic publicPath is not supported you must specify an output.publicPath manually via configuration
 		// or pass an empty string ("") and set the __webpack_public_path__ variable from your code to use your own logic.
 		if (!scriptUrl) throw new Error("Automatic publicPath is not supported in this browser");
 		scriptUrl = scriptUrl.replace(/#.*$/, "").replace(/\?.*$/, "").replace(/\/[^\/]+$/, "/");
 		__webpack_require__.p = scriptUrl;
 	})();
 	
 	/* webpack/runtime/jsonp chunk loading */
 	(() => {
 		// no baseURI
 		
 		// object to store loaded and loading chunks
 		// undefined = chunk not loaded, null = chunk preloaded/prefetched
 		// Promise = chunk loading, 0 = chunk loaded
 		var installedChunks = {
 			"gallery": 0
 		};
 		
 		
 		__webpack_require__.f.j = (chunkId, promises) => {
 				// JSONP chunk loading for javascript
 				var installedChunkData = __webpack_require__.o(installedChunks, chunkId) ? installedChunks[chunkId] : undefined;
 				if(installedChunkData !== 0) { // 0 means "already installed".
 		
 					// a Promise means "currently loading".
 					if(installedChunkData) {
 						promises.push(installedChunkData[2]);
 					} else {
 						if(true) { // all chunks have JS
 							// setup Promise in chunk cache
 							var promise = new Promise((resolve, reject) => {
 								installedChunkData = installedChunks[chunkId] = [resolve, reject];
 							});
 							promises.push(installedChunkData[2] = promise);
 		
 							// start chunk loading
 							var url = __webpack_require__.p + __webpack_require__.u(chunkId);
 							// create error before stack unwound to get useful stacktrace later
 							var error = new Error();
 							var loadingEnded = (event) => {
 								if(__webpack_require__.o(installedChunks, chunkId)) {
 									installedChunkData = installedChunks[chunkId];
 									if(installedChunkData !== 0) installedChunks[chunkId] = undefined;
 									if(installedChunkData) {
 										var errorType = event && (event.type === 'load' ? 'missing' : event.type);
 										var realSrc = event && event.target && event.target.src;
 										error.message = 'Loading chunk ' + chunkId + ' failed.\n(' + errorType + ': ' + realSrc + ')';
 										error.name = 'ChunkLoadError';
 										error.type = errorType;
 										error.request = realSrc;
 										installedChunkData[1](error);
 									}
 								}
 							};
 							__webpack_require__.l(url, loadingEnded, "chunk-" + chunkId, chunkId);
 						} else installedChunks[chunkId] = 0;
 					}
 				}
 		};
 		
 		// no prefetching
 		
 		// no preloaded
 		
 		// no HMR
 		
 		// no HMR manifest
 		
 		// no deferred startup
 		
 		// install a JSONP callback for chunk loading
 		var webpackJsonpCallback = (parentChunkLoadingFunction, data) => {
 			var [chunkIds, moreModules, runtime] = data;
 			// add "moreModules" to the modules object,
 			// then flag all "chunkIds" as loaded and fire callback
 			var moduleId, chunkId, i = 0, resolves = [];
 			for(;i < chunkIds.length; i++) {
 				chunkId = chunkIds[i];
 				if(__webpack_require__.o(installedChunks, chunkId) && installedChunks[chunkId]) {
 					resolves.push(installedChunks[chunkId][0]);
 				}
 				installedChunks[chunkId] = 0;
 			}
 			for(moduleId in moreModules) {
 				if(__webpack_require__.o(moreModules, moduleId)) {
 					__webpack_require__.m[moduleId] = moreModules[moduleId];
 				}
 			}
 			if(runtime) runtime(__webpack_require__);
 			if(parentChunkLoadingFunction) parentChunkLoadingFunction(data);
 			while(resolves.length) {
 				resolves.shift()();
 			}
 		
 		}
 		
 		var chunkLoadingGlobal = self["webpackChunkai_gallery"] = self["webpackChunkai_gallery"] || [];
 		chunkLoadingGlobal.forEach(webpackJsonpCallback.bind(null, 0));
 		chunkLoadingGlobal.push = webpackJsonpCallback.bind(null, chunkLoadingGlobal.push.bind(chunkLoadingGlobal));
 		
 		// no deferred startup
 	})();
