import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import base44 from "@base44/vite-plugin";
import path from "path";

export default defineConfig({
  plugins: [react(), base44()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
  server: {
    port: 5173,
  },
});