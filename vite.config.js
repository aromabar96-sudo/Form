import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Pinned to an explicit, uncommon port with strictPort so this never
  // silently drifts to a different port if 5173 happens to be taken by
  // something else running locally (Vite's default behavior is to just
  // increment to the next free port) — the Tauri native shell has this
  // exact URL hardcoded in tauri.conf.json's build.devUrl, and a silent
  // port drift there means the native window loads whatever OTHER dev
  // server happens to be on 5173, not FORM. strictPort:true makes Vite
  // fail loudly with a clear "port in use" error instead, which is much
  // easier to diagnose than a native window silently showing the wrong
  // app entirely.
  server: {
    port: 5183,
    strictPort: true,
  },
  build: {
    // Split the heavy 3D stack into its own chunk — it changes far less
    // often than app code and lets browsers cache it independently.
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three/')) return 'three';
          if (id.includes('@react-three')) return 'r3f';
        },
      },
    },
  },
});
