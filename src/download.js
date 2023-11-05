import * as THREE from "three";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { Forma } from "forma-embedded-view-sdk/auto";
export const retrieveGlb = async (fileName, glbType) => {
  return new Promise((resolve, reject) => {
    try {
      const loader = new GLTFLoader();
      const onLoad = (gltf) => resolve(gltf);
      const onError = (e) => reject(e);
      loader.load(fileName, onLoad, () => {}, onError);
    } catch (err) {
      console.log(err);
      reject(err);
    }
  });
};

function orientUp() {
  
}
//blocking - buildings
export async function buildAnalysisGeometry() {
  const glb = await retrieveGlb("../assets/blocking.glb", "something");
  try {
    glb.scene.rotation.x = -Math.PI / 2;
    const newMaterial = new THREE.MeshBasicMaterial({ color: "blue"})
    glb.scene.traverse((o)=> {
      if (o.isMesh) {
        console.log("mesh")
        o.material = newMaterial
        o.receiveShadow = true;
        o.castShadow = true;
        console.log(o)
      };
    });
    // const edges = new THREE.EdgesGeometry(glb);
    // const line = new THREE.LineSegments(
    //   glb.scene,
    //   new THREE.LineBasicMaterial({ color: 0xffffff })
    //   );
    console.log(glb.scene.geometry);
    return { analysisGeometry: glb.scene };
  } catch (err) {
    console.log("here is the error", err);
  }
}

export async function getBuildings(scene) {
  const buildingPaths = await Forma.geometry.getPathsByCategory({
    category: "building",
  });
  const positions = await Promise.all(
      buildingPaths.map((b) => Forma.geometry.getTriangles({ path: b }))
    )
  
  positions.forEach(m => {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(m, 3));

  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0x181818 })
  );

  line.rotation.x = -Math.PI /2
  const material = new THREE.MeshBasicMaterial({ color: "white" });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
  scene.add(mesh)
  scene.add(line)  
  });
}


export async function getTerrain() {
  const [terrain] = await Forma.geometry.getPathsByCategory({
    category: "terrain",
  });
  const positions = await Forma.geometry.getTriangles({ path: terrain });
  // for (let i = 0; i < positions.length; i += 3) {
  //   const y = positions[i + 2];
  //   const z = positions[i + 1];
  //   positions[i + 2] = z;
  //   positions[i + 1] = y;
  // }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0xffffff })
  );

  line.rotation.x = -Math.PI /2
  const material = new THREE.MeshBasicMaterial({ color: "grey" });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2;
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
