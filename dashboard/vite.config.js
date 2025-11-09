import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/compliance-monitoring/",
  build: {
    outDir: "dist",
    assetsDir: "assets",
  },
  // --- THIS IS THE FIX ---
  // This configures the dev server to send the correct
  // headers to allow the MSAL login popup to work.
  server: {
    headers: {
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
  },
  // --- END OF FIX ---
});
