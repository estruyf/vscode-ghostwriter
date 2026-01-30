import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => ({
  plugins: [tailwindcss(), react()],
  optimizeDeps: {
    exclude: ["lucide-react"],
  },
  root: "./webview",
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      protocol: "ws",
      host: "localhost",
      port: 5173,
    },
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    },
  },
  build: {
    outDir: path.resolve(__dirname, "out/webview"),
    emptyOutDir: true,
    sourcemap: mode === "development" ? "inline" : false,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name].js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name].[ext]",
        format: "iife",
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./webview/src"),
    },
  },
}));
