import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.CMEP_BASE_URL ?? "http://localhost:3100";
const traceMode = (process.env.CMEP_PLAYWRIGHT_TRACE as "off" | "on" | "retain-on-failure" | "on-first-retry" | undefined) ?? "on-first-retry";
const screenshotMode = (process.env.CMEP_PLAYWRIGHT_SCREENSHOT as "off" | "on" | "only-on-failure" | undefined) ?? "off";
const videoMode = (process.env.CMEP_PLAYWRIGHT_VIDEO as "off" | "on" | "retain-on-failure" | "on-first-retry" | undefined) ?? "off";
const managedServer = process.env.CMEP_PLAYWRIGHT_MANAGED_SERVER === "external";

export default defineConfig({
  testDir: "./src/tests/e2e",
  timeout: 90_000,
  fullyParallel: false,
  outputDir: process.env.CMEP_PLAYWRIGHT_OUTPUT_DIR ?? "test-results/playwright",
  use: {
    baseURL,
    trace: traceMode,
    screenshot: screenshotMode,
    video: videoMode,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: managedServer
    ? undefined
    : {
        command: "npm run start -- --port 3100",
        url: "http://localhost:3100",
        reuseExistingServer: false,
        timeout: 120_000,
      },
  globalSetup:
    process.env.CMEP_PLAYWRIGHT_SKIP_GLOBAL_SETUP === "true"
      ? undefined
      : require.resolve("./src/tests/e2e/global-setup.ts"),
});
