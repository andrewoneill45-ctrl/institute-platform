import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
export default defineConfig({
  plugins: [react()],
  /* stamped at build time: data URLs carry it, so every deploy busts the
     one-hour data cache without touching the cache headers */
  define: { __ASI_BUILD__: JSON.stringify(Date.now().toString(36)) },
});
