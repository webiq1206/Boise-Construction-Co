---
name: Running Playwright e2e in this workspace
description: How to launch the e2e suite on NixOS where downloaded chromium cannot load shared libs
---
The chromium that `npx playwright install` downloads cannot run on NixOS (missing shared libs such as glib). `playwright.config.ts` honors a `PLAYWRIGHT_CHROMIUM_PATH` env var pointing at a Nix-built chromium (find one under `/nix/store/*playwright-browsers*`).

**Why:** stock Playwright browser downloads are dynamically linked against FHS paths that do not exist on NixOS.

**How to apply:** locate a Nix-built chrome binary, export `PLAYWRIGHT_CHROMIUM_PATH`, then run the e2e suite. Do not assume external-service errors are harmless; verify the test's network isolation.

For notification-free browser verification, block non-fixture API requests as well as mocking estimator submissions.

**Why:** Estimator interactions also trigger a separate session-analytics endpoint. Mocked estimator submissions alone did not prevent synthetic session write attempts during browser checks.

**How to apply:** Register a default API interception before the committed test's more-specific fixture routes. Keep this in the test harness, not application code, and distinguish mocked browser success from real database or provider verification.

Allow for cold development compilation when diagnosing proxy reload timeouts.

**Why:** A cold estimator page exceeded the browser suite's 15-second navigation budget while subsequent requests were fast; a timeout alone did not establish a draft-recovery regression.

**How to apply:** Warm the development route, use a separate longer navigation timeout, and capture static-asset failures. Do not rewrite draft recovery or application caching based only on a cold-load timeout.
