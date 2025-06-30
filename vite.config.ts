import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  ssr: {
    noExternal: ['@txnlab/use-wallet-react', '@txnlab/use-wallet'],
  },
  define: {
    global: 'globalThis',
  },
});