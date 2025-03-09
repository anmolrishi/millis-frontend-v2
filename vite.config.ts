import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0", // Listen on all network interfaces
    proxy: {
      '/api': {
        target: 'https://03279385-3d79-446e-89a3-82d7a644a6e3-00-7h1owk45iklh.sisko.replit.dev',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
});
