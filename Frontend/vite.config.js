import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

const envDir = fileURLToPath(new URL('./', import.meta.url));

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, envDir, '');
  const backendBaseUrl = (
    env.VITE_BASE_API ||
    env.BASE_API ||
    'http://localhost:6000'
  ).replace(/\/$/, '');

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: backendBaseUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
