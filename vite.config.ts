import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

const base = process.env.DEV_SERVER ? "/" : "/aec-tech-hackathon";

// https://vitejs.dev/config/
export default defineConfig({
  base,
  server: {
    port: 8080,
  },
  assetsInclude: ["**/*.glb"],
});
