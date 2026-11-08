import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  server: {
    host: "localhost",
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: "ws",      // или "wss" если страница открыта по HTTPS-прокси
      host: "localhost",
      port: 5173,
    },
    proxy: {
      "/api": {
       target: "https://localhost:7020",
       changeOrigin: true,
       secure: false,
      },
    },
  },
});
