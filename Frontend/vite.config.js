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
    build: {
      cssCodeSplit: true,
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined;
            }

            if (
              id.includes('/react/') ||
              id.includes('/react-dom/') ||
              id.includes('/react-router-dom/')
            ) {
              return 'react-vendor';
            }

            if (
              id.includes('/react-redux/') ||
              id.includes('/@reduxjs/toolkit/') ||
              id.includes('/@tanstack/react-query/')
            ) {
              return 'state-vendor';
            }

            if (
              id.includes('/@emotion/react/') ||
              id.includes('/@emotion/styled/') ||
              id.includes('/@mui/icons-material/') ||
              id.includes('/@mui/material/')
            ) {
              return 'ui-vendor';
            }

            if (
              id.includes('/@stripe/react-stripe-js/') ||
              id.includes('/@stripe/stripe-js/')
            ) {
              return 'stripe-vendor';
            }

            return 'vendor';
          },
        },
      },
    },
  };
});
