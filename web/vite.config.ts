import path from "path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const rootDir = path.resolve(__dirname, "..");

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, rootDir, "");

  const serverPort = parseInt(env.PORT || "3000", 10);
  const vitePort = parseInt(env.VITE_PORT || "5173", 10);

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: vitePort,
      proxy: {
        "/api": `http://localhost:${serverPort}`,
        "/socket.io": {
          target: `http://localhost:${serverPort}`,
          ws: true,
        },
      },
    },
    build: {
      outDir: "dist",
    },
    test: {
      environment: "happy-dom",
      include: ["src/**/*.{test,spec}.{ts,tsx}"],
    },
  };
});
