import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/compliance-monitoring/",

  // This helps the dev server
  optimizeDeps: {
    include: ["@azure/msal-browser"],
  },

  build: {
    outDir: "dist",
    assetsDir: "assets",

    // --- THIS IS THE NEW FIX ---
    // This tells the 'npm run build' command (Rollup)
    // how to handle the MSAL package properly.
    commonjsOptions: {
      include: /node_modules/,
      transformMixedEsModules: true,
    },
    // --- END OF SECTION ---
  },
});
