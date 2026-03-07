import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const rootDir = path.resolve(__dirname, '..');

export default defineConfig(({ mode }) => {
  // Load .env from the repo root so PORT, VITE_PORT, etc. are available
  const env = loadEnv(mode, rootDir, '');

  const serverPort = parseInt(env.PORT || '3000', 10);
  const vitePort = parseInt(env.VITE_PORT || '5173', 10);

  return {
    plugins: [react()],
    server: {
      port: vitePort,
      proxy: {
        '/api': `http://localhost:${serverPort}`,
        '/socket.io': {
          target: `http://localhost:${serverPort}`,
          ws: true,
        },
      },
    },
    build: {
      outDir: 'dist',
    },
  };
});
