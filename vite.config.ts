import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@growing/admin-shell": path.resolve(
          __dirname,
          "../packages/admin-shell/src/index.ts",
        ),
        "@growing/content-markdown": path.resolve(
          __dirname,
          "../packages/content-markdown/src/index.ts",
        ),
        "@growing/contracts": path.resolve(__dirname, "../packages/contracts/src/index.ts"),
        "@growing/ui": path.resolve(__dirname, "../packages/ui/src/index.ts"),
      },
    },
    server: {
      port: 5174,
      host: true, // Allow external connections
      cors: true, // Enable CORS for development server
      proxy: {
        "/api": {
          target: env.VITE_API_URL || "http://localhost:3001",
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on("error", (err, _req, _res) => {
              console.log("proxy error", err);
            });
            proxy.on("proxyReq", (proxyReq, req, _res) => {
              console.log(
                "Sending Request to the Target:",
                req.method,
                req.url,
              );
            });
            proxy.on("proxyRes", (proxyRes, req, _res) => {
              console.log(
                "Received Response from the Target:",
                proxyRes.statusCode,
                req.url,
              );
            });
          },
        },
      },
    },
    build: {
      // Production build optimizations
      target: "es2020",
      outDir: "dist",
      assetsDir: "assets",
      sourcemap: mode === "development",
      minify: mode === "production" ? "terser" : false,
      terserOptions: {
        compress: {
          drop_console: mode === "production",
          drop_debugger: mode === "production",
        },
      },
      rollupOptions: {
        output: {
          manualChunks: {
            // Split vendor chunks for better caching
            vendor: ["react", "react-dom"],
            antd: ["antd"],
            refine: ["@refinedev/core", "@refinedev/antd"],
          },
        },
      },
      // Chunk size warning limit (in kbytes)
      chunkSizeWarningLimit: 1000,
    },
    optimizeDeps: {
      // Pre-bundle dependencies for faster development
      include: [
        "react",
        "react-dom",
        "antd",
        "@refinedev/core",
        "@refinedev/antd",
        "@refinedev/react-router-v6",
        "@refinedev/simple-rest",
        "react-router-dom",
        "@ant-design/icons",
      ],
      exclude: ["@growing/content-markdown"],
    },
    define: {
      // Make env variables available to the app
      __APP_ENV__: JSON.stringify(env.VITE_APP_ENV),
    },
  };
});
