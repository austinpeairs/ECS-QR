import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "../backend/templates",
    emptyOutDir: true,
    sourcemap: false,
  },
  base: "/",
  server: {
    proxy: {
      "/r": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      // Proxy API requests to your backend
      "/api": {
        target: "http://localhost:5000", // Your backend server URL
        changeOrigin: true, // Needed for virtual hosted sites
      },
      // You might also want to proxy other backend routes like /login, /logout, /auth_callback
      // if your frontend makes direct calls to them (though typically auth redirects are handled by the browser)
      "/login": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/logout": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/auth_callback": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/update_mapping": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      // If you have other specific backend routes accessed by the frontend, add them here
      // For example, if your create_qr_code and upload_file are called directly from frontend
      // and not prefixed with /api
      "/create_qr_code": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/upload_file": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/qr_content": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/delete_qr_code": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
      "/mapping": {
        target: "http://localhost:5000",
        changeOrigin: true,
      },
    },
  },
});
