import * as THREE from "three";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Forma } from "forma-embedded-view-sdk/auto";
import { createNoiseCanvas } from "./utils";
export const retrieveGlb = async (fileName, glbType) => {
  return new Promise((resolve, reject) => {
    try {
      const loader = new GLTFLoader();
      const onLoad = (gltf) => resolve(gltf);
      const onError = (e) => reject(e);
      loader.load(fileName, onLoad, () => {}, onError);
    } catch (err) {
      reject(err);
    }
  });
};

function orientUp() {}

export async function getBuildings(scene) {
  const paths = await Forma.geometry.getPathsByCategory({
    category: "building",
  });
  paths.push(
    ...(await Forma.geometry.getPathsByCategory({ category: "generic" }))
  );
  const positions = await Promise.all(
    paths.map((b) => Forma.geometry.getTriangles({ path: b }))
  );

  return positions.map((m) => {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(m, 3));

    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: 0x181818 })
    );

    line.rotation.x = -Math.PI / 2;
    const material = new THREE.MeshBasicMaterial({ color: "white" });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.rotation.x = -Math.PI / 2;
    scene.add(mesh);
    scene.add(line);
    return mesh;
  });
}

export async function getTerrain() {
  const [terrain] = await Forma.geometry.getPathsByCategory({
    category: "terrain",
  });
  const positions = await Forma.geometry.getTriangles({ path: terrain });
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.computeBoundingBox();
  const width = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
  const height = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
  const newUvs = new Array((2 * positions.length) / 3);
  for (let i = 0; i < positions.length / 3; i++) {
    newUvs[2 * i] = (positions[3 * i] - geometry.boundingBox.min.x) / width;
    newUvs[2 * i + 1] =
      (positions[3 * i + 1] - geometry.boundingBox.min.y) / height;
  }

  geometry.setAttribute("uv", new THREE.Float32BufferAttribute(newUvs, 2));
  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );

  line.rotation.x = -Math.PI / 2;
  const noiseCanvas = await getNoiseAnalysis();
  const canvasTexture = new THREE.CanvasTexture(noiseCanvas);
  canvasTexture.minFilter = THREE.NearestFilter;
  canvasTexture.magFilter = THREE.NearestFilter;
  const material = new THREE.MeshBasicMaterial({
    map: canvasTexture,
    opacity: 0.6,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  return { terrainMesh: mesh, terrainLines: line };
}

export async function getNoiseAnalysis() {
  const analysisList = await Forma.analysis.list({ analysisTypes: ["noise"] });
  if (analysisList.length === 0) {
    return;
  }
  const analysisData = await Forma.analysis.getGroundGrid({
    analysis: analysisList[0],
  });
  return createNoiseCanvas(analysisData);
}
