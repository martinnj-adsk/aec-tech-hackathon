import { Forma } from "forma-embedded-view-sdk/auto";

import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const projectId = Forma.getProjectId();

export function App() {
  return <h1>Hello, AECTech: {projectId}!</h1>;
}
