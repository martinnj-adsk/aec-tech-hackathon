import * as THREE from "three";
import { VRButton } from "three/addons/webxr/VRButton.js";
import { XRControllerModelFactory } from "./XRControllerModelFactory.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { getBuildings, getTerrain } from "./download.js";

const scene = new THREE.Scene();
scene.add(new THREE.AxesHelper(50));

const sunlight = new THREE.DirectionalLight(0xffffff, 0.5);
sunlight.position.set(500, 500, 500);
scene.add(sunlight);

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setClearColor("#ffffff");
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.xr.enabled = true;

document.body.appendChild(renderer.domElement);

document.body.appendChild(VRButton.createButton(renderer));

const controller1 = renderer.xr.getController(1);
controller1.addEventListener("connected", (event) => {
  controller1.add(buildController(event.data));
});
scene.add(controller1);

const controllerModelFactory = new XRControllerModelFactory();

const controllerGrip1 = renderer.xr.getControllerGrip(1);
controllerGrip1.add(
  controllerModelFactory.createControllerModel(controllerGrip1)
);
scene.add(controllerGrip1);

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
  renderer.render(scene, camera);
}

renderer.setAnimationLoop(render);

getTerrain().then(async (res) => {
  scene.add(res.terrainLines);
  scene.add(res.terrainMesh);
});

getBuildings(scene);
