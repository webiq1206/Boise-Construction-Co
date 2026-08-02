import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: process.env.E2E_BASE_URL || "http://127.0.0.1:3456",
    trace: "on-first-retry",
  },
  webServer: process.env.E2E_NO_WEBSERVER
    ? undefined
    : {
        /*
         * `next dev` directly, NOT `npm run dev -- -p 3456`. The dev script is
         * "next dev -p 5000", so the npm form expands to "next dev -p 5000 -p
         * 3456" and the server does not come up on the port Playwright then
         * waits for. Every test in the suite failed with ERR_CONNECTION_REFUSED,
         * which reads like a broken app rather than a broken command line.
         */
        command: "npx next dev -p 3456",
        url: process.env.E2E_BASE_URL || "http://127.0.0.1:3456",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
        env: {
          NODE_ENV: "development",
          PORT: process.env.PORT || "3456",
          HOST: process.env.HOST || "127.0.0.1",
        },
      },
});

