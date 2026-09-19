import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runner = path.join(root, "scripts", "offline-run.mjs");
const fixture = path.join(root, "tests", "fixtures", "offline-safety-child.mjs");

function run(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [runner, ...args], {
      cwd: options.cwd ?? root,
      env: {
        ...process.env,
        OFFLINE_TEST_SECRET: "must-not-reach-child",
      },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => (stdout += chunk));
    child.stderr.on("data", (chunk) => (stderr += chunk));
    child.once("error", reject);
    child.once("close", (code) => resolve({ code, stdout, stderr }));
  });
}

test("offline runner sanitizes env, blocks outbound traffic, and permits loopback", async () => {
  const result = await run(["test", fixture]);
  assert.equal(result.code, 0, result.stderr);
  assert.doesNotMatch(result.stdout + result.stderr, /must-not-reach-child/);
});

test("offline runner refuses dotenv credentials without reading or naming them", async () => {
  const temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "offline-run-"));
  try {
    await writeFile(path.join(temporaryDirectory, ".env.local"), "API_KEY=do-not-log\n");
    const result = await run(["test", fixture], { cwd: temporaryDirectory });
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /refuses to run while a real dotenv file exists/);
    assert.doesNotMatch(result.stderr, /API_KEY|do-not-log|\.env\.local/);
  } finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
  }
});
