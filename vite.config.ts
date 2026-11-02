import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Sandboxed template previews have an opaque origin ("null"), so the local servers must allow
// cross-origin reads of the 3D model, like public/_headers does on Cloudflare Pages.
export default defineConfig({
  plugins: [react()],
  server: { cors: true },
  preview: { cors: true },
});
