
//import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import { MMOrbitControls } from './MMOrbitControls.js';
import { HeightMapGenerator } from './HeightMap.js';
import { ArrayResizer } from './ArrayResizer.js';
import * as THREE from './three.module.js';
import { FBXLoader } from './FBXLoader.js';

// Player states
const PSTATE = { IDLE: "Idle", WALKFORWARD: "WalkForward", RUNFORWARD: "RunForward", WALKBACKWARD: 'WalkBackward', RUNBACKWARD: 'RunBackward', JUMP: 'Jump' };
const JSTATE = { NOJUMP: "NotJumped", JUMP: "Jumped" };
const GLOBAL = { player: null };

// Ammo JS states
const ASTATE = { DISABLE_DEACTIVATION: 4 }

const WorldParams = {
  MaxFall: -10,
  PlayerStart: { x: 7, y: 20, z: 7 },
  PlayerFallReset: -25,
  TerrainHeight: 55, //50
  Gravity: -9,
  GroundScale: [1000, 1000],
  ScaleSegRatio: 1, // number of segments per ground scale (if it's .6, 1000 scale will have 600 segments)
  HeightMapFile: './src/height500.png',
  Shadows: true
};

const PlayerParams = {
  FootHeightThreshold: -0.58, // negative, the closer to zero the more you can wall walk
  WalkImpulse: .05,
  RunImpulse: .1,
  MaxWalk: 1.5,
  MaxRun: 4,
  JumpPower: 20,
  Friction: .4,
  RollingFriction: .1,
  CapsuleRadius: .3,
  CapsuleHeight: .75,
  Mass: 1,
  ModelScale: .006,
  ModelYShift: -.71,
  ModelFiles: {
    SkinMesh: './src/ybot.fbx',
    Idle: './src/Idle.fbx',
    Walk: './src/Walking.fbx',
    Run: './src/RunForward.fbx',
    Fall: './src/Fall.fbx',
    Jump: './src/Jump.fbx'
  }
};

class OrbitTests {

  constructor() {
    // this didn't need to go here...
    new THREE.ImageBitmapLoader().load(WorldParams.HeightMapFile, (texture) => {
      const loader = new FBXLoader();
      loader.load(PlayerParams.ModelFiles.SkinMesh, (object) => {
        loader.load(PlayerParams.ModelFiles.Idle, (idleObject) => {
          loader.load(PlayerParams.ModelFiles.Walk, (walkObject) => {
            loader.load(PlayerParams.ModelFiles.Run, (runObject) => {
              loader.load(PlayerParams.ModelFiles.Fall, (fallObject) => {
                loader.load(PlayerParams.ModelFiles.Jump, (jumpObject) => {
                  this._Initialize(
                    { groundHeightMapTexture: texture }, 
                    object, 
                    idleObject, 
                    walkObject, 
                    runObject, 
                    fallObject, 
                    jumpObject
                    );
                });
              });
            });
          });
        });
      });
    });
  }

  _Initialize(textures, ybotFbx, idleFbx, walkFbx, runFbx, fallFbx, jumpFbx) {

    // need a scene
    this._scene = new THREE.Scene();

    // clock for physics
    this._clock = new THREE.Clock();

    // physics
    this._enablePhysics = true;
    this._mvPlr = this._movePlayerCallback;

    this._physicsWorld = null;
    this._rigidBodies = [];
    this._tmpTrans = new Ammo.btTransform();

    this.setupPhysicsWorld();
    this._feetOnGroundResult = null; // for collision detection
    this.setupFeetOnGroundResultCallback();

    // camera aspect ratio starts out matching viewport aspect ratio
    this._camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 5000);

    // antialias gets rid of the jaggies
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = WorldParams.Shadows;
    this._canv = document.getElementById('maindiv');

    // black background
    renderer.setClearColor("#000000");

    // fill the whole viewport with the 3d scene
    renderer.setSize(window.innerWidth, window.innerHeight);

    // need to add this to the DOM
    document.getElementById('maindiv').appendChild(renderer.domElement);

    // listen for window resize events
    window.addEventListener('resize', () => {

      // make sure scene always matches viewport size and aspect ratio
      renderer.setSize(window.innerWidth, window.innerHeight);
      this._camera.aspect = window.innerWidth / window.innerHeight;

      // make sure aspect ratio changes do not warp object shapes
      this._camera.updateProjectionMatrix();
    });

    //environment cube texture
    const cubeTextureLoader = new THREE.CubeTextureLoader();
    this._cubeTexture = cubeTextureLoader.load([
      './src/stars1920.png',
      './src/stars1920.png',
      './src/stars1920.png',
      './src/stars1920.png',
      './src/stars1920.png',
      './src/stars1920.png'
    ]);
    this._scene.background = this._cubeTexture;

    const widthSegments = Math.ceil(WorldParams.GroundScale[0] * WorldParams.ScaleSegRatio);
    const heightSegments = Math.ceil(WorldParams.GroundScale[1] * WorldParams.ScaleSegRatio);
    const groundHeightMapTexture = textures.groundHeightMapTexture;
    const flatArray = this.loadTerrainHeightmapTexture(groundHeightMapTexture, widthSegments, heightSegments);

    const terrainHeight = WorldParams.TerrainHeight;
    this._groundPlane = this.createPlane("ground", 0xDD55FF, WorldParams.GroundScale, [0, 0, 0], [0, 0, 0], widthSegments, heightSegments, terrainHeight, flatArray);

    this._playerResetHeight = WorldParams.PlayerFallReset;
    const playerModelObjects = {
      playerModel: ybotFbx,
      playerIdle: idleFbx,
      playerWalk: walkFbx,
      playerRun: runFbx,
      playerFall: fallFbx,
      playerJump: jumpFbx
    };
    this._player = this.createPlayer(playerModelObjects, new THREE.Vector3(WorldParams.PlayerStart.x, WorldParams.PlayerStart.y, WorldParams.PlayerStart.z));
    GLOBAL.player = this._player;
    this._playerState = PSTATE.IDLE;
    this._jumpState = JSTATE.NOJUMP;

    // controls
    const controls = new MMOrbitControls(this._camera, 
      this._player.obj3d, 
      PlayerParams.WalkImpulse,
      PlayerParams.RunImpulse,
      this._mvPlr,
      this._walkForward, 
      this._walkBackward, 
      this._runForward, 
      this._runBackward, 
      this._stopMoving, 
      this._jump, 
      this._groundCheck, 
      this._collisionCheck, 
      renderer.domElement);

    // create our lights
    const light = new THREE.AmbientLight(0xFFFFFF, .4);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);


    // set initial position and rotation of our objects and lights
    this._camera.position.z = WorldParams.PlayerStart.z - 3;
    this._camera.position.y = WorldParams.PlayerStart.y + 2;
    this._camera.position.x = WorldParams.PlayerStart.x - 0;
    this._camera.lookAt(WorldParams.PlayerStart);

    light.position.set(10, 0, 25);

    directionalLight.position.x = 10;
    directionalLight.position.y = 10;
    directionalLight.castShadow = WorldParams.Shadows;

    // add objects and lights to the scene
    this._scene.add(directionalLight);
    this._scene.add(light);

    var render = () => {
      let deltaTime = this._clock.getDelta();
      requestAnimationFrame(render);
      this._player.animation.mixer.update(deltaTime);
      controls.update(deltaTime);
      this.updatePhysics(deltaTime);
      renderer.render(this._scene, this._camera);
    };
    render();
  }

  loadTerrainHeightmapTexture = (texture, desiredWidth, desiredHeight) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.style.display = 'none';
    canvas.height = texture.height;
    canvas.width = texture.width;
    const flatArray = new Array(texture.height * texture.width);
    const initial2d = new Array(texture.width);
    try {
      ctx.drawImage(texture, 0, 0);

      // okay so loop through the returned image
      // but need to put that in a separate 2d array I think...
      // then convert that 2d array into the desired size (need params)
      // then convert that resized 2d array into a flat array...
      for (let y = 0; y < texture.height; y++) {
        const row = new Array(texture.height);
        initial2d[y] = row;
        for (let x = 0; x < texture.width; x++) {
          const thing = ctx.getImageData(x, y, 1, 1);
          const avgColor = (thing.data[0] + thing.data[1] + thing.data[2]) / 3;

          // okay so we can take the average of these levels
          row[x] = avgColor;
        }
      }

      // now initial2d should be the average colors of all the pixels
      // resize it:
      const arrRes = new ArrayResizer();
      const desired2d = arrRes.resizeMatrix(initial2d, desiredWidth, desiredHeight);
      let flatIndex = 0;
      for (let y = 0; y < desired2d.length; y++) {
        const row = desired2d[y];
        for (let x = 0; x < row.length; x++) {
          flatArray[flatIndex++] = row[x];
        }
      }
      return flatArray;
    } catch (ex) {
      console.log(`bad`, ex);
    }
  }

  _movePlayerCallback = (moveDelta) => {

    if (!this._player.feetOnGround) {
      return;
    }

    // get player's physics object
    const body = this._player.physicsBody;

    // here we apply ONLY a force vector. then in the tick we have to clamp linear velocity manually
    const totalScalingFactor = 2;
    const xzScalingFactor = 2.5;
    const yScalingFactor = PlayerParams.JumpPower;

    const calcImpulse = {
      x: moveDelta.y === 0 ? (moveDelta.x * xzScalingFactor) : 0,
      y: moveDelta.y * yScalingFactor,
      z: moveDelta.y === 0 ? (moveDelta.z * xzScalingFactor) : 0
    };

    const resultantImpulse = new Ammo.btVector3(calcImpulse.x, calcImpulse.y, calcImpulse.z);
    resultantImpulse.op_mul(totalScalingFactor);

    body.applyCentralImpulse(resultantImpulse);
  }

  _detectCollision = () => {

    this._feetOnGroundResult.hasContact = false;
    this._physicsWorld.contactPairTest(this._player.physicsBody, this._groundPlane.physicsBody, this._feetOnGroundResult);
    const feetOnGround = this._feetOnGroundResult.hasContact;
    this._player.feetOnGround = feetOnGround;
  }

  _detectCollisionBad() {

    const dispatcher = this._physicsWorld.getDispatcher();
    const numManifolds = dispatcher.getNumManifolds();
    let totalContacts = 0;

    for (let i = 0; i < numManifolds; i++) {

      const contactManifold = dispatcher.getManifoldByIndexInternal(i);
      const numContacts = contactManifold.getNumContacts();
      totalContacts += numContacts;

      for (let j = 0; j < numContacts; j++) {

        let contactPoint = contactManifold.getContactPoint(j);
        let distance = contactPoint.getDistance();
      }
    }
    return totalContacts > 0;
  }

  _walkForward = () => {
    if (this._playerState != PSTATE.WALKFORWARD) {
      this._playerState = PSTATE.WALKFORWARD;
    }
  }

  _walkBackward = () => {
    if (this._playerState != PSTATE.WALKBACKWARD) {
      this._playerState = PSTATE.WALKBACKWARD;
    }
  }

  _runForward = () => {
    if (this._playerState != PSTATE.RUNFORWARD) {
      this._playerState = PSTATE.RUNFORWARD;
    }
  }

  _runBackward = () => {
    if (this._playerState != PSTATE.RUNBACKWARD) {
      this._playerState = PSTATE.RUNBACKWARD;
    }
  }

  _stopMoving = () => {
    if (this._playerState != PSTATE.IDLE) {
      this._playerState = PSTATE.IDLE;
    }
  }

  _jump = () => {
    if (this._jumpState != JSTATE.JUMP) {
      this._jumpState = JSTATE.JUMP;
    }
  }

  _groundCheck = () => {
    return true;
  }

  _collisionCheck = () => {
    return false;
  }

  createPlayer = (playerModelObjects, position) => {

    const {
      playerModel: playerModel,
      playerIdle: playerIdle,
      playerWalk: playerWalk,
      playerRun: playerRun,
      playerFall: playerFall,
      playerJump: playerJump
    } = playerModelObjects;

    const mass = PlayerParams.Mass;

    // Create the three js object
    const obj3d = new THREE.Group();
    const material = new THREE.MeshPhongMaterial({
      transparent: false,
      opacity: 1,
      color: 0xFF0000,
      emissive: 0xFF0000 * .5,
      specular: 0xFF0000 * .5,
      shininess: 67,
      flatShading: true,
      envMap: this._cubeTexture,
      reflectivity: .4
    });

    const capsuleHeight = PlayerParams.CapsuleHeight;
    playerModel.position.y += PlayerParams.ModelYShift;
    playerModel.scale.x = PlayerParams.ModelScale;
    playerModel.scale.y = PlayerParams.ModelScale;
    playerModel.scale.z = PlayerParams.ModelScale;

    const mixer = new THREE.AnimationMixer(playerModel);
    const idleAction = mixer.clipAction(playerIdle.animations[0]);
    const walkAction = mixer.clipAction(playerWalk.animations[0]);
    const runAction = mixer.clipAction(playerRun.animations[0]);
    const fallAction = mixer.clipAction(playerFall.animations[0]);
    const jumpAction = mixer.clipAction(playerJump.animations[0]);
    idleAction.play();

    playerModel.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = WorldParams.Shadows;
        child.receiveShadow = WorldParams.Shadows;
      }
    });

    obj3d.add(playerModel);

    this._scene.add(obj3d);
    obj3d.position.copy(position);

    // Create the ammo js object
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(position.x, position.y, position.z));
    transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
    const motionState = new Ammo.btDefaultMotionState(transform);
    let colShape = null;

    colShape = new Ammo.btCapsuleShape(PlayerParams.CapsuleRadius, capsuleHeight);

    colShape.setMargin(0.05);
    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
    let body = new Ammo.btRigidBody(rbInfo);
    body.setFriction(PlayerParams.Friction); //.4
    body.setRollingFriction(PlayerParams.RollingFriction); // .1
    body.setActivationState(ASTATE.DISABLE_DEACTIVATION);
    body.setAngularFactor(0, 0, 0);
    this._physicsWorld.addRigidBody(body);

    const maxWalk = PlayerParams.MaxWalk;
    const maxRun = PlayerParams.MaxRun;

    const retVal = {
      obj3d: obj3d,
      physicsBody: body,
      isPlayer: true,
      maxWalk: maxWalk,
      maxRun: maxRun,
      animation: {
        mixer: mixer,
        idle: idleAction,
        walk: walkAction,
        run: runAction,
        fall: fallAction,
        jump: jumpAction,

        current: idleAction
      },
      feetOnGround: false, // you can walk
      touchingGround: false // you are not falling
    };
    this._rigidBodies.push(retVal);

    return retVal;
  }

  createPlane = (name, color, scale, position, rotation, widthSegments, heightSegments, terrainMaxHeight, heightMapArr) => {

    const mass = 0;

    const [xScale, yScale, zScale] = [scale[0], .2, scale[1]];
    const [xPos, yPos, zPos] = position;
    const [xRot, yRot, zRot] = rotation;

    const obj3d = new THREE.Object3D();
    const xSegments = widthSegments;
    const zSegments = heightSegments;
    const geometry = new THREE.PlaneGeometry(xScale, zScale, xSegments - 1, zSegments - 1);
    geometry.rotateX(- Math.PI / 2);

    const hmap = new HeightMapGenerator();
    let hmapData = [];
    const terrainMinHeight = 0; // has to be zero right now or my physics will derp i think...

    hmapData = hmap.generateTextureHeightData(widthSegments, heightSegments, terrainMinHeight, terrainMaxHeight, heightMapArr);

    hmap.applyHeightToPlane(geometry, hmapData);

    const doWireframe = true;
    const doMesh = true;
    const mesh = new THREE.Object3D();

    if (doWireframe) {
      const wireframe = new THREE.WireframeGeometry(geometry);
      const lineMat = new THREE.LineBasicMaterial({ color: color, opacity: 0.5, transparent: true });
      mesh.add(new THREE.LineSegments(wireframe, lineMat));
    }
    if (doMesh) {
      const meshMaterial = new THREE.MeshPhongMaterial({
        transparent: false,
        //opacity: .9,
        color: 0x7f00ff,
        emissive: 0xff,
        specular: 0x191900,
        shininess: 67,
        flatShading: true,
        envMap: this._cubeTexture,
        reflectivity: .6,
        side: THREE.DoubleSide
      });
      const phongMesh = new THREE.Mesh(geometry, meshMaterial);      
		  phongMesh.receiveShadow = WorldParams.Shadows;

      mesh.add(phongMesh);
    }

    mesh.position.y = 0 - ((terrainMaxHeight - terrainMinHeight) / 2);

    mesh.name = name;
    const xAxis = new THREE.Vector3(1, 0, 0);
    const yAxis = new THREE.Vector3(0, 1, 0);
    const zAxis = new THREE.Vector3(0, 0, 1);

    mesh.position.z = yScale / 2;
    obj3d.add(mesh);

    obj3d.position.set(xPos, yPos, zPos);
    console.log(`${name} position`, obj3d.position);

    obj3d.rotateOnAxis(xAxis, xRot);
    obj3d.rotateOnAxis(yAxis, yRot);
    obj3d.rotateOnAxis(zAxis, zRot);

    const obj3dQuat = obj3d.quaternion;

    this._scene.add(obj3d);


    // Create the ammo js object
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    console.log(`Setting ${name} phys origin to ${xPos},${yPos},${zPos}`);
    transform.setRotation(new Ammo.btQuaternion(obj3dQuat.x, obj3dQuat.y, obj3dQuat.z, obj3dQuat.w));
    transform.setOrigin(new Ammo.btVector3(xPos, yPos, zPos));
    const motionState = new Ammo.btDefaultMotionState(transform);

    let colShape = hmap.createTerrainShape(hmapData, xSegments, zSegments, terrainMinHeight, terrainMaxHeight, xScale, zScale);
    colShape.setMargin(0.05);

    let localInertia = new Ammo.btVector3(0, 0, 0);
    colShape.calculateLocalInertia(mass, localInertia);
    let rbInfo = new Ammo.btRigidBodyConstructionInfo(mass, motionState, colShape, localInertia);
    const body = new Ammo.btRigidBody(rbInfo);
    body.setFriction(1); // was 1
    body.setRollingFriction(1); // was 1
    body.setActivationState(ASTATE.DISABLE_DEACTIVATION);
    body.setAngularFactor(0, 0, 0);
    this._physicsWorld.addRigidBody(body);

    const retVal = { obj3d: obj3d, physicsBody: body, isPlayer: false, planeGeo: geometry };
    this._rigidBodies.push(retVal);

    return retVal;
  }

  _playAction = (newAction) => {
    const prevAction = this._player.animation.current;
    newAction.play();
    prevAction.stop();
    this._player.animation.current = newAction;
  }

  _handlePlayerAnimation = (linearVelocity) => {

    const current = this._player.animation.current;

    //console.log(`feetOnGround: ${this._player.feetOnGround}`);

    if (linearVelocity.y > 3) {
      const action = this._player.animation.jump;
      if (action != current) {
        this._playAction(action);
      }
    } else if (linearVelocity.y < -3.5) {
      const action = this._player.animation.fall;
      if (action != current) {
        this._playAction(action);
      }
    } else if (this._player.feetOnGround && linearVelocity.speed > 0.1 && linearVelocity.speed <= PlayerParams.MaxWalk) {
      const action = this._player.animation.walk;
      if (action != current) {
        this._playAction(action);
      }
    } else if (this._player.feetOnGround && linearVelocity.speed > PlayerParams.MaxWalk) {
      const action = this._player.animation.run;
      if (action != current) {
        this._playAction(action);
      }
    } else if (this._player.feetOnGround && linearVelocity.speed <= 0.1) {
      const action = this._player.animation.idle;
      if (action != current) {
        this._playAction(action);
      }
    }
  }

  resetPlayerPosition = () => {
    const transform = new Ammo.btTransform();
    transform.setIdentity();
    transform.setOrigin(new Ammo.btVector3(WorldParams.PlayerStart.x, WorldParams.PlayerStart.y, WorldParams.PlayerStart.z));
    transform.setRotation(new Ammo.btQuaternion(0, 0, 0, 1));
    const motionState = new Ammo.btDefaultMotionState(transform);
    this._player.physicsBody.setMotionState(motionState);
  }

  setupPhysicsWorld = () => {
    const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
      dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
      overlappingPairCache = new Ammo.btDbvtBroadphase(),
      solver = new Ammo.btSequentialImpulseConstraintSolver();

    this._physicsWorld = new Ammo.btDiscreteDynamicsWorld(dispatcher, overlappingPairCache, solver, collisionConfiguration);
    this._physicsWorld.setGravity(new Ammo.btVector3(0, WorldParams.Gravity, 0));
    console.log(`physicsWOrld`, this._physicsWorld);

  }

  getPhysObjCoords = (objAmmo) => {
    const transf = objAmmo.getWorldTransform();
    const ammoPosInWorldCoords = transf.getOrigin();
    const x = ammoPosInWorldCoords.x();
    const y = ammoPosInWorldCoords.y();
    const z = ammoPosInWorldCoords.z();
    const ret = { x: x, y: y, z: z };
    return ret;
  }

  limitSpeed = (ammoObj, maxXZ, maxY) => {
    const linVel = ammoObj.getLinearVelocity();
    const linXYZ = { x: linVel.x(), y: linVel.y(), z: linVel.z() };
    const speed = Math.abs(Math.sqrt(linXYZ.x * linXYZ.x + linXYZ.z * linXYZ.z));

    let newX = linXYZ.x;
    let newY = linXYZ.y;
    let newZ = linXYZ.z;

    if (linXYZ.y < maxY) {
      newY = maxY;
    }

    const speeding = speed > maxXZ;
    if (speeding) {
      const ratio = maxXZ / speed;
      newX = linXYZ.x * ratio;
      newZ = linXYZ.z * ratio;
    }

    const linearVelocity = { x: newX, y: newY, z: newZ, speed: speeding ? maxXZ : speed };
    ammoObj.setLinearVelocity(new Ammo.btVector3(linearVelocity.x, linearVelocity.y, linearVelocity.z));

    return linearVelocity;
  }

  updatePhysics = (deltaTime) => {

    if (!this._enablePhysics) {
      return;
    }

    this._detectCollision();

    // Speed Limit
    const maxSpeed = (this._playerState == PSTATE.WALKBACKWARD || this._playerState == PSTATE.WALKFORWARD) ? this._player.maxWalk : this._player.maxRun;
    const maxFall = WorldParams.MaxFall;
    const linearVelocity = this.limitSpeed(this._player.physicsBody, maxSpeed, maxFall);

    // Animate based on velocity...
    this._handlePlayerAnimation(linearVelocity);

    // Step world
    this._physicsWorld.stepSimulation(deltaTime, 10);

    // Loop through all the rigid bodies and update them
    for (let i = 0; i < this._rigidBodies.length; i++) {

      // get the current object
      const obj = this._rigidBodies[i];

      // get its physics object
      const objAmmo = obj.physicsBody;

      // get the three js object
      const obj3d = obj.obj3d;

      // figure out location/rotation of the given physics object
      const myMotionState = objAmmo.getMotionState();

      if (myMotionState) {

        // convert the position from local to world coords
        myMotionState.getWorldTransform(this._tmpTrans);
        const ammoPosInWorldCoords = this._tmpTrans.getOrigin();
        const x = ammoPosInWorldCoords.x();
        const y = ammoPosInWorldCoords.y();
        const z = ammoPosInWorldCoords.z();

        const oldObj3dPos = obj3d.position.clone();

        // Set the three js object's position. (in world coords??)
        obj3d.position.set(x, y, z);

        if (obj.isPlayer) {

          if (y < this._playerResetHeight) {
            this.resetPlayerPosition();
          }
          const moveDelta = obj3d.position.clone();
          moveDelta.sub(oldObj3dPos);
          this._camera.position.add(moveDelta);
        }
      }
    }
  }

  setupFeetOnGroundResultCallback = () => {

    this._feetOnGroundResult = new Ammo.ConcreteContactResultCallback();
    this._feetOnGroundResult.hasContact = false;

    const player = this._player;
    if (!player) {
      console.log(`setupFeetOnGroundResultCallback can't find the player...`);
    }

    this._feetOnGroundResult.addSingleResult = function (cp, colObj0Wrap, partId0, index0, colObj1Wrap, partId1, index1) {

      let contactPoint = Ammo.wrapPointer(cp, Ammo.btManifoldPoint);
      const distance = contactPoint.getDistance();
      const mlocal = contactPoint.get_m_localPointA();
      const xyz = { x: mlocal.x(), y: mlocal.y(), z: mlocal.z() };

      // okay so distance might not matter that much. i'll keep it in...
      if (distance > 0.2) {
        GLOBAL.player.touchingGround = false; 
        return;
      }
      GLOBAL.player.touchingGround = true;

      const footContactDetected = xyz.y < PlayerParams.FootHeightThreshold;
      if (!footContactDetected) {
        //console.log(`Player is touching the 'ground' but not with their feet. You can't move.`, xyz);
      }
      if (!footContactDetected) return; // need to return in case we are touching the ground and a wall

      this.hasContact = footContactDetected;
    }
  }

  setupContactResultCallback = () => {

    cbContactResult = new Ammo.ConcreteContactResultCallback();

    cbContactResult.addSingleResult = function (cp, colObj0Wrap, partId0, index0, colObj1Wrap, partId1, index1) {

      let contactPoint = Ammo.wrapPointer(cp, Ammo.btManifoldPoint);

      const distance = contactPoint.getDistance();

      if (distance > 0) return;

      let colWrapper0 = Ammo.wrapPointer(colObj0Wrap, Ammo.btCollisionObjectWrapper);
      let rb0 = Ammo.castObject(colWrapper0.getCollisionObject(), Ammo.btRigidBody);

      let colWrapper1 = Ammo.wrapPointer(colObj1Wrap, Ammo.btCollisionObjectWrapper);
      let rb1 = Ammo.castObject(colWrapper1.getCollisionObject(), Ammo.btRigidBody);

      let threeObject0 = rb0.threeObject;
      let threeObject1 = rb1.threeObject;

      let tag, localPos, worldPos

      if (threeObject0.userData.tag != "ball") {

        tag = threeObject0.userData.tag;
        localPos = contactPoint.get_m_localPointA();
        worldPos = contactPoint.get_m_positionWorldOnA();

      }
      else {

        tag = threeObject1.userData.tag;
        localPos = contactPoint.get_m_localPointB();
        worldPos = contactPoint.get_m_positionWorldOnB();

      }

      let localPosDisplay = { x: localPos.x(), y: localPos.y(), z: localPos.z() };
      let worldPosDisplay = { x: worldPos.x(), y: worldPos.y(), z: worldPos.z() };

      console.log({ tag, localPosDisplay, worldPosDisplay });
    }
  }
}

let _APP = null;

window.addEventListener('DOMContentLoaded', () => {
  Ammo().then(() => {
    _APP = new OrbitTests();
  })
});

