import * as THREE from "three";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Forma } from "forma-embedded-view-sdk/auto";
export const retrieveGlb = async (fileName, glbType) => {
  return new Promise((resolve, reject) => {
    try {
      const loader = new GLTFLoader();
      const onLoad = (gltf) => resolve(gltf);
      const onError = (e) => reject(e);
      loader.load("../assets/blocking.glb", onLoad, () => {}, onError);
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
};

function rotationMatrixYUpToZUp() {
  const rotationMatrix = new THREE.Matrix4();
  // rotationMatrix.makeRotationX(-Math.PI / 2);
  rotationMatrix.makeRotationY(Math.PI / 2);
  return rotationMatrix;
}

export async function buildAnalysisGeometry() {
  const glb = await retrieveGlb("someting", "something");
  try {
    glb.scene.rotation.y = Math.PI / 2;
    glb.scene.applyMatrix4(rotationMatrixYUpToZUp());
  } catch (err) {
    console.log("here is the error", err);
  }

  return { analysisGeometry: glb.scene };
}

export async function getTerrain() {
  const [terrain] = await Forma.geometry.getPathsByCategory({
    category: "terrain",
  });
  const positions = await Forma.geometry.getTriangles({ path: terrain });
  for (let i = 0; i < positions.length; i += 3) {
    const y = positions[i + 2];
    const z = positions[i + 1];
    positions[i + 2] = z;
    positions[i + 1] = y;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );

  const material = new THREE.MeshBasicMaterial({ color: "red" });
  const mesh = new THREE.Mesh(geometry, material);
  return { terrainMesh: mesh, terrainLines: line };
}

function normalizeScaleAndOffset(
  values,
  limits,
  scale,
  offset,
  textureColorEdgeOffset = 0.0
) {
  const colorScale = (limits[1] - limits[0]) / (values[1] - values[0]);
  const colorOffset = limits[0] - values[0] * colorScale;

  const normalizedScale = (255.0 * scale) / colorScale;
  const normalizedOffset =
    (offset - colorOffset) / colorScale + textureColorEdgeOffset;
  return { normalizedScale, normalizedOffset };
}
