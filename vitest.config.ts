import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import "dotenv/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // Unit tests are *.test.ts; Playwright owns e2e/*.spec.ts. Keep the two
    // runners from colliding (Vitest's default glob also matches .spec.ts).
    include: ["**/*.test.{ts,tsx}"],
    exclude: ["node_modules", "e2e", ".next"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
    },
  },
});
