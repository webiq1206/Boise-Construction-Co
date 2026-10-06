#!/usr/bin/env node
/** Permanently paused legacy dispatcher. This command never rewrites a queue. */
const message = "Legacy backlink dispatch is paused. Use a separately approved supported workflow with brand validation, suppression, unsubscribe handling and verified capacity.";
if (process.env.BACKLINK_SEND_ENABLED === "true") {
  console.error(message);
  process.exitCode = 1;
} else {
  console.log(message);
}
