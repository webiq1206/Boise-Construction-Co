---
name: Running Playwright e2e in this workspace
description: How to launch the e2e suite on NixOS where downloaded chromium cannot load shared libs
---
The chromium that `npx playwright install` downloads cannot run on NixOS (missing shared libs such as glib). `playwright.config.ts` honors a `PLAYWRIGHT_CHROMIUM_PATH` env var pointing at a Nix-built chromium (find one under `/nix/store/*playwright-browsers*`).

**Why:** stock Playwright browser downloads are dynamically linked against FHS paths that do not exist on NixOS.

**How to apply:** locate a Nix-built chrome binary, export `PLAYWRIGHT_CHROMIUM_PATH`, then run the e2e suite. Expect harmless external-network errors (lead dashboard, Resend example.com) in test output.
