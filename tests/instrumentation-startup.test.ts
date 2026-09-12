import test from "node:test";
import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";

const instrumentationPath = fileURLToPath(
  new URL("../instrumentation.ts", import.meta.url),
);
const workerStateKey = "__startupInstrumentationWorkerBoots";
const workerFixture = `
const state = globalThis;
export function bootEstimatorWorker() {
  state[${JSON.stringify(workerStateKey)}] =
    (state[${JSON.stringify(workerStateKey)}] || 0) + 1;
  if (process.env.STARTUP_TEST_WORKER_REJECT === "1") {
    return Promise.reject(new Error("worker rejection sentinel"));
  }
}
`;

type RegistrationOptions = {
  runtime: string;
  environment: string;
  databaseUrl?: string;
  rejectWorker?: boolean;
};

async function waitForWorkerImport() {
  for (let attempt = 0; attempt < 20; attempt++) {
    if ((globalThis as Record<string, unknown>)[workerStateKey] !== undefined) {
      return;
    }
    await new Promise<void>((resolve) => setImmediate(resolve));
  }
}

async function executeRegistration(options: RegistrationOptions) {
  const source = await readFile(instrumentationPath, "utf8");
  const fixtureRoot = await mkdtemp(join(tmpdir(), "instrumentation-startup-"));
  const workerRoot = join(fixtureRoot, "lib", "p5");
  const instrumentationFixture = join(fixtureRoot, "instrumentation.ts");
  const workerFixturePath = join(workerRoot, "backgroundJobs.ts");
  const previousEnvironment = {
    NEXT_RUNTIME: process.env.NEXT_RUNTIME,
    NODE_ENV: process.env.NODE_ENV,
    DATABASE_URL: process.env.DATABASE_URL,
    STARTUP_TEST_WORKER_REJECT: process.env.STARTUP_TEST_WORKER_REJECT,
  };
  const previousFetch = globalThis.fetch;
  let networkCalls = 0;
  const errors: unknown[][] = [];
  const previousError = console.error;

  await mkdir(workerRoot, { recursive: true });
  await writeFile(instrumentationFixture, source);
  await writeFile(workerFixturePath, workerFixture);
  (globalThis as Record<string, unknown>)[workerStateKey] = undefined;
  process.env.NEXT_RUNTIME = options.runtime;
  process.env.NODE_ENV = options.environment;
  if (options.databaseUrl === undefined) {
    delete process.env.DATABASE_URL;
  } else {
    process.env.DATABASE_URL = options.databaseUrl;
  }
  if (options.rejectWorker) {
    process.env.STARTUP_TEST_WORKER_REJECT = "1";
  } else {
    delete process.env.STARTUP_TEST_WORKER_REJECT;
  }
  globalThis.fetch = (async () => {
    networkCalls++;
    throw new Error("network failure sentinel");
  }) as typeof fetch;
  console.error = (...args: unknown[]) => {
    errors.push(args);
  };

  try {
    const instrumentation = (await import(
      `${pathToFileURL(instrumentationFixture).href}?test=instrumentation-startup`
    )) as typeof import("../instrumentation.ts");
    await instrumentation.register();
    await waitForWorkerImport();
    return {
      boots: (globalThis as Record<string, unknown>)[workerStateKey] || 0,
      networkCalls,
      errors,
    };
  } finally {
    console.error = previousError;
    globalThis.fetch = previousFetch;
    if (previousEnvironment.NEXT_RUNTIME === undefined) {
      delete process.env.NEXT_RUNTIME;
    } else {
      process.env.NEXT_RUNTIME = previousEnvironment.NEXT_RUNTIME;
    }
    if (previousEnvironment.NODE_ENV === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousEnvironment.NODE_ENV;
    }
    if (previousEnvironment.DATABASE_URL === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousEnvironment.DATABASE_URL;
    }
    if (previousEnvironment.STARTUP_TEST_WORKER_REJECT === undefined) {
      delete process.env.STARTUP_TEST_WORKER_REJECT;
    } else {
      process.env.STARTUP_TEST_WORKER_REJECT =
        previousEnvironment.STARTUP_TEST_WORKER_REJECT;
    }
    delete (globalThis as Record<string, unknown>)[workerStateKey];
    await rm(fixtureRoot, { recursive: true, force: true });
  }
}

test("startup source allowlist excludes customer maintenance imports and SQL", async () => {
  const source = await readFile(instrumentationPath, "utf8");
  const syntax = ts.createSourceFile(
    "instrumentation.ts",
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  const moduleSpecifiers: string[] = [];
  const collectImports = (node: ts.Node) => {
    if (
      ts.isImportDeclaration(node) &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      moduleSpecifiers.push(`static:${node.moduleSpecifier.text}`);
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      moduleSpecifiers.push(`dynamic:${node.arguments[0].text}`);
    }
    ts.forEachChild(node, collectImports);
  };
  collectImports(syntax);
  assert.deepEqual(moduleSpecifiers, [
    "dynamic:./lib/p5/backgroundJobs",
  ]);
  for (const forbidden of [
    /DATABASE_URL/,
    /@neondatabase\/serverless/,
    /addressValidation/,
    /normalizeStoredAddress/,
    /hasLeadingHouseNumber/,
    /runStartupDbTasks/,
    /UNRESOLVED_PURCHASES/,
    /lead_purchases/,
    /\b(?:SELECT|INSERT|UPDATE|DELETE)\b/i,
  ]) {
    assert.doesNotMatch(source, forbidden);
  }
});

test("production Node startup boots only the estimator worker without a database URL", async () => {
  const result = await executeRegistration({
    runtime: "nodejs",
    environment: "production",
  });

  assert.equal(result.boots, 1);
  assert.equal(result.networkCalls, 0);
  assert.deepEqual(result.errors, []);
});

test("production Node startup never contacts customer storage when DATABASE_URL exists", async () => {
  const result = await executeRegistration({
    runtime: "nodejs",
    environment: "production",
    databaseUrl: "postgresql://startup-customer-db-sentinel.invalid/customer",
  });

  assert.equal(result.boots, 1);
  assert.equal(result.networkCalls, 0);
  assert.deepEqual(result.errors, []);
});

test("nonproduction and edge startup do not boot the worker", async () => {
  for (const options of [
    { runtime: "nodejs", environment: "development" },
    { runtime: "edge", environment: "production" },
  ]) {
    const result = await executeRegistration(options);
    assert.equal(result.boots, 0);
    assert.equal(result.networkCalls, 0);
    assert.deepEqual(result.errors, []);
  }
});

test("worker rejection is handled without rejecting registration", async () => {
  const result = await executeRegistration({
    runtime: "nodejs",
    environment: "production",
    rejectWorker: true,
  });

  assert.equal(result.boots, 1);
  assert.equal(result.networkCalls, 0);
  assert.equal(result.errors.length, 1);
  assert.match(String(result.errors[0][0]), /Startup deferred/);
});