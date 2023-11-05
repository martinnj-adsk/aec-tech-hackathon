import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "three/addons/webxr/XRControllerModelFactory.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { getBuildings, getTerrain } from "./download.js";

const scene = new THREE.Scene();
scene.add(new THREE.AxesHelper(50));

const sunlight = new THREE.DirectionalLight(0xffffff, 0.5);
sunlight.position.set(500, 500, 500);
scene.add(sunlight);
let terrainMesh;
let buildingMeshes;
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.y = 300;
camera.position.z = 300;
// camera.up.set(0, 0, 0);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor("#ffffff");
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
const tempMatrix = new THREE.Matrix4();
const raycaster = new THREE.Raycaster();
const marker = new THREE.Mesh(
  new THREE.CircleGeometry(0.25, 32).rotateX(-Math.PI / 2),
  new THREE.MeshBasicMaterial({ color: 0xbcbcbc })
);

scene.add(marker);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.xr.enabled = true;

renderer.xr.addEventListener(
  "sessionstart",
  () => (baseReferenceSpace = renderer.xr.getReferenceSpace())
);

let baseReferenceSpace;
let INTERSECTION;

function onSelectEnd() {
  this.userData.isSelecting = false;

  if (INTERSECTION) {
    const offsetPosition = {
      x: -INTERSECTION.x,
      y: -INTERSECTION.y,
      z: -INTERSECTION.z,
      w: 1,
    };
    const offsetRotation = new THREE.Quaternion();
    const transform = new XRRigidTransform(offsetPosition, offsetRotation);
    const teleportSpaceOffset =
      baseReferenceSpace.getOffsetReferenceSpace(transform);

    renderer.xr.setReferenceSpace(teleportSpaceOffset);
  }
}

function onSelectStart() {
  this.userData.isSelecting = true;
}

const controller1 = renderer.xr.getController(0);
controller1.addEventListener("selectstart", onSelectStart);
controller1.addEventListener("selectend", onSelectEnd);
controller1.addEventListener("connected", function (event) {
  this.add(buildController(event.data));
});
controller1.addEventListener("disconnected", function () {
  this.remove(this.children[0]);
});

document.body.appendChild(renderer.domElement);

document.body.appendChild(VRButton.createButton(renderer));

controller1.addEventListener("connected", (event) => {
  controller1.add(buildController(event.data));
});
scene.add(controller1);

const controller2 = renderer.xr.getController(1);
controller2.addEventListener("selectstart", onSelectStart);
controller2.addEventListener("selectend", onSelectEnd);
controller2.addEventListener("connected", function (event) {
  this.add(buildController(event.data));
});
controller2.addEventListener("disconnected", function () {
  this.remove(this.children[0]);
});
scene.add(controller2);

const controllerModelFactory = new XRControllerModelFactory();

const controllerGrip1 = renderer.xr.getControllerGrip(0);
controllerGrip1.add(
  controllerModelFactory.createControllerModel(controllerGrip1)
);
scene.add(controllerGrip1);

const controllerGrip2 = renderer.xr.getControllerGrip(1);
controllerGrip2.add(
  controllerModelFactory.createControllerModel(controllerGrip2)
);
scene.add(controllerGrip2);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;

function buildController(data) {
  let geometry, material;

  switch (data.targetRayMode) {
    case "tracked-pointer":
      geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3)
      );
      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute([0.5, 0.5, 0.5, 0, 0, 0], 3)
      );

      material = new THREE.LineBasicMaterial({
        vertexColors: true,
        blending: THREE.AdditiveBlending,
      });

      return new THREE.Line(geometry, material);

    case "gaze":
      geometry = new THREE.RingGeometry(0.02, 0.04, 32).translate(0, 0, -1);
      material = new THREE.MeshBasicMaterial({
        opacity: 0.5,
        transparent: true,
      });
      return new THREE.Mesh(geometry, material);
  }

  return new THREE.Mesh();
}

window.addEventListener("resize", onWindowResize);
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  render();
}

let start = false;

let selectStart;
controller1.addEventListener("selectstart", () => {
  const v = new THREE.Vector3();
  controller1.getWorldDirection(v);

  const dir = v.multiplyScalar(-1);
  dir.normalize();
  selectStart = new Date().getTime();
  start = false;
});

controller1.addEventListener("selectend", () => {
  const v = new THREE.Vector3();
  controller1.getWorldDirection(v);

  const dir = v.multiplyScalar(-1);
  dir.normalize();
  start = true;
});

function render() {
  INTERSECTION = undefined;

  if (controller1.userData.isSelecting === true) {
    tempMatrix.identity().extractRotation(controller1.matrixWorld);

    raycaster.ray.origin.setFromMatrixPosition(controller1.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    tempMatrix.identity().extractRotation(controller1.matrixWorld);

    raycaster.ray.origin.setFromMatrixPosition(controller1.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    const intersects = raycaster.intersectObjects([
      terrainMesh,
      ...buildingMeshes,
    ]);

    if (intersects.length > 0) {
      INTERSECTION = intersects[0].point;
    }
  } else if (controller2.userData.isSelecting === true) {
    tempMatrix.identity().extractRotation(controller2.matrixWorld);

    raycaster.ray.origin.setFromMatrixPosition(controller2.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);
    tempMatrix.identity().extractRotation(controller1.matrixWorld);

    raycaster.ray.origin.setFromMatrixPosition(controller1.matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix);

    const intersects = raycaster.intersectObjects([
      terrainMesh,
      ...buildingMeshes,
    ]);

    if (intersects.length > 0) {
      INTERSECTION = intersects[0].point;
    }
  }

  if (INTERSECTION) marker.position.copy(INTERSECTION);

  marker.visible = INTERSECTION !== undefined;
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(render);

getTerrain().then(async (res) => {
  scene.add(res.terrainLines);
  scene.add(res.terrainMesh);
  terrainMesh = res.terrainMesh;
});

getBuildings(scene).then((buildings) => {
  buildingMeshes = buildings;
});
