import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    hmr: { overlay: false },
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: false },
      includeAssets: ["logo.jpeg"],
      manifest: {
        name: "Shiva Shakti Shamiyana",
        short_name: "Shamiyana",
        description: "Shamiyana rental business management",
        theme_color: "#0f0a1f",
        background_color: "#0f0a1f",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/logo.jpeg", sizes: "192x192", type: "image/jpeg" },
          { src: "/logo.jpeg", sizes: "512x512", type: "image/jpeg" },
          { src: "/logo.jpeg", sizes: "512x512", type: "image/jpeg", purpose: "any maskable" },
        ],
      },
      workbox: {
        navigateFallbackDenylist: [/^\/~oauth/],
        runtimeCaching: [
          {
            urlPattern: ({ request }) => request.mode === "navigate",
            handler: "NetworkFirst",
            options: { cacheName: "html", networkTimeoutSeconds: 3 },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
    dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime", "@tanstack/react-query", "@tanstack/query-core"],
  },
}));
