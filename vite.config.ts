import { defineConfig } from "vite";
import preact from "@preact/preset-vite";

const base = process.env.DEV_SERVER == 1 ? "aec-tech-hackathon" : "";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    {
      name: "html-transform",
      transformIndexHtml: {
        transform: (html) =>
          // Ensure resources starting with #REL# are included in the bundle by vite
          html.replace(/#REL#/g, base),
      },
    },
    preact(),
  ],
  server: {
    port: 8080,
  },
  assetsInclude: ["**/*.glb"],
});
