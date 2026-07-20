import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "server-only": path.resolve(__dirname, "src/tests/stubs/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    globalSetup: path.resolve(__dirname, "src/tests/global-setup.ts"),
    include: ["src/tests/**/*.test.ts"],
    maxWorkers: 1,
    minWorkers: 1,
    coverage: {
      reporter: ["text", "html"],
    },
  },
});
