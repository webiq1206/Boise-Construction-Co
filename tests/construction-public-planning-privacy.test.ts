import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {build} from "esbuild";

test("the actual calculator browser graph excludes server pricing, raw cost data and finance policy", async () => {
  const result = await build({entryPoints: ["components/PlanningRangeExplorer.tsx"], bundle: true, write: false, metafile: true, outfile: "/tmp/construction-public-planning-check.js", platform: "browser", format: "esm", tsconfig: "tsconfig.json", loader: {".css": "empty"}, external: ["react", "react/jsx-runtime"], logLevel: "silent"});
  const inputs = Object.keys(result.metafile!.inputs);
  for (const file of inputs) assert.doesNotMatch(file, /(?:^|\/)server\/|shared\/(?:estimateEngine|costBookQuote)\.ts$|lib\/p5\/(?:costBook|planningBooks|priceBook|priceBookData|pricing)\.ts$/, file);
  const code = result.outputFiles!.filter(file => file.path.endsWith(".js")).map(file => file.text).join("\n");
  for (const marker of ["P5 Cost Database 2026.xlsx", "90-70-17", "unified overhead instruction", "annualOverhead", "financeSnapshot"]) assert.equal(code.includes(marker), false, marker);
  assert.ok(code.includes("/api/planning-range"));
});

test("the pricing route is server-only and the browser crypto workaround is removed", () => {
  assert.match(readFileSync("app/api/planning-range/route.ts", "utf8"), /import ["']server-only["']/);
  assert.doesNotMatch(readFileSync("next.config.js", "utf8"), /client-sha256|data\.request === ['"]node:crypto/);
});
