import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
export default defineConfig({
  root,
  plugins: [react()],
  resolve: { alias: { "@": root } },
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    target: "es2022",
    outDir: ".sites-runtime/standalone-build",
    emptyOutDir: true,
    cssCodeSplit: false,
    lib: {
      entry: fileURLToPath(new URL("./main.tsx", import.meta.url)),
      name: "InvestLab",
      formats: ["iife"],
      fileName: () => "investlab.js",
      cssFileName: "investlab",
    },
  },
});
