import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/compliance-monitoring/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },

  // --- ADD THIS SECTION ---
  // This tells Vite to find and pre-bundle this
  // package, which fixes the Rollup error.
  optimizeDeps: {
    include: ["@azure/msal-browser"],
  },
  // --- END OF SECTION ---
});
