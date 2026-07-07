import { defineConfig } from "@playwright/test";

/**
 * PromptVault Lite — Playwright E2E Configuration
 *
 * Runs against the local Vite dev server (no Tauri backend).
 * Uses mock __TAURI_INTERNALS__ injection to exercise the full UI flow.
 *
 * Privacy: screenshots/traces/videos are off by default.
 * Enable with --screenshot on --trace on for debugging only.
 * NEVER commit screenshots/traces containing real prompt contents.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 60000,
  expect: {
    timeout: 10000,
  },
  // Retry once to tolerate dev server startup race
  retries: 1,
  workers: 1,
  use: {
    baseURL: "http://localhost:1420",
    browserName: "chromium",
    headless: true,
    viewport: { width: 1280, height: 800 },
    actionTimeout: 10000,
    // Privacy: no screenshots/traces/video by default
    screenshot: "off",
    trace: "off",
    video: "off",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:1420",
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
  // Output directories (gitignored)
  outputDir: "./test-results/artifacts",
  reporter: [["list"], ["json", { outputFile: "./test-results/report.json" }]],
});
