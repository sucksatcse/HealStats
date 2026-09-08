import { defineConfig, loadEnv } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import path from "node:path"
import { pathToFileURL } from "node:url"

// Vite config — https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const emitSourcemaps = mode === "development"

  return {
    base: process.env.FIGMA_PUBLIC_URL
      ? `${process.env.FIGMA_PUBLIC_URL}/`
      : "/",
    envDir: path.resolve(__dirname, "../"),
    build: {
      sourcemap: emitSourcemaps ? "inline" : false,
      minify: !emitSourcemaps,
    },
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "healstats-geocoding-dev",
        async configureServer(server) {
          // Dev only: no configurePreviewServer, no server secrets in define/client code.
          const env = {
            ...loadEnv(mode, path.resolve(__dirname, "../"), ""),
            ...process.env,
          }
          const { createGeocodingMiddleware, configFromEnv } = await import(
            pathToFileURL(path.resolve(__dirname, "server/geocoding.mjs")).href
          )
          const middleware = createGeocodingMiddleware({
            ...configFromEnv(env),
            supabaseUrl: env.SUPABASE_URL || env.VITE_SUPABASE_URL,
            supabaseAnonKey:
              env.SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY,
          })
          server.middlewares.use(middleware)
          server.httpServer?.once("close", () => {
            void middleware.close()
          })
        },
      },
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    optimizeDeps: {
      include: ["react-leaflet", "leaflet"],
    },
    server: {
      host: "0.0.0.0",
      port: parseInt(process.env.PORT || "8443"),
      strictPort: true,
      allowedHosts: true,
      fs: {
        // Preserve Vite's defaults; private cache/checkpoints must never be served.
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "**/.cache/**"],
      },
    },
    preview: {
      host: "0.0.0.0",
      port: parseInt(process.env.PORT || "8443"),
      allowedHosts: true,
    },
  }
}) // dev server config
