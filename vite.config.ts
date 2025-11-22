import { defineConfig } from 'vite';

export default defineConfig({
  base: '/cmpm-121-F/', 
  build: {
    chunkSizeWarningLimit: 1600,
  }
});