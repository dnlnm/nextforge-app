import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    env: {
      NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "dummy-key",
      SKIP_ENV_VALIDATION: "true",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./"),
      "@repo": path.resolve(import.meta.dirname, "../../packages"),
      "server-only": path.resolve(
        import.meta.dirname,
        "../../node_modules/.bun/server-only@0.0.1/node_modules/server-only/empty.js"
      ),
    },
  },
});
