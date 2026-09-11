/**
 * Opt-in, live document-review verification for the P5 estimator.
 *
 * This intentionally does not mock Anthropic or the estimator scope endpoint.
 * It creates a synthetic, no-contact draft on the local development service,
 * then exercises the same document preparation and extraction path used by the
 * browser. The browser test aborts one request locally to verify that a retry
 * keeps the cached files; the successful retry is a real service request.
 *
 * Safety:
 *   P5_SYNTHETIC_VERIFY=1 npm exec tsx scripts/p5-synthetic-document-verification.mts
 *
 * The script refuses non-local hosts unless P5_SYNTHETIC_ALLOW_NONLOCAL=1.
 * It never visits submit/admin/cron/notification endpoints and aborts any
 * attempt to do so in the browser. It does not print environment values.
 */
import assert from "node:assert/strict";
import {mkdtemp, readFile, writeFile} from "node:fs/promises";
import {tmpdir} from "node:os";
import path from "node:path";
import nextEnv from "@next/env";
import {PDFDocument, StandardFonts, rgb} from "pdf-lib";
import ExcelJS from "exceljs";
import {chromium} from "@playwright/test";
import {analyzeScope} from "../lib/p5/extraction.ts";
import type {AnalysisFile} from "../lib/p5/extraction.ts";
import {SCOPE_FIELDS, type ScopeField} from "../lib/p5/scope.ts";
import {prepareAnalysisFiles, verifyUpload} from "../lib/p5/documents.ts";

nextEnv.loadEnvConfig(process.cwd());

const base = process.env.P5_TEST_BASE_URL || "http://127.0.0.1:5000";
const baseUrl = new URL(base);
const optIn = process.env.P5_SYNTHETIC_VERIFY === "1" || process.env.P5_SYNTHETIC_VERIFY === "true";
const localHosts = new Set(["127.0.0.1", "localhost", "::1"]);
const workDir = await mkdtemp(path.join(tmpdir(), "p5-synthetic-document-verification-"));
const resultPath = path.join(workDir, "results.json");

const numericExpected: Record<string, number> = {
  sqft: 240,
  length: 20,
  width: 12,
  rooms: 1,
  bathrooms: 1,
  stories: 1,
  cabinetBaseLf: 18,
  cabinetUpperLf: 12,
};
const numericFields = new Set(Object.keys(numericExpected));
const photoSourceMarker = "existing-house-photo";
const knownFailureCodes = new Set([
  "analysis-unconfigured",
  "analysis-unauthorized",
  "analysis-model-unavailable",
  "analysis-busy",
  "analysis-provider-unavailable",
  "analysis-request-rejected",
  "analysis-incomplete",
  "analysis-empty",
  "analysis-failed",
]);

function failureCode(value: unknown): string {
  const text = value instanceof Error ? value.message : String(value ?? "");
  const known = [...knownFailureCodes].find(code => text.includes(code));
  if (known) return known;
  if (/unauthor/i.test(text)) return "analysis-unauthorized";
  if (/model|not found/i.test(text)) return "analysis-model-unavailable";
  if (/rate|busy|429/i.test(text)) return "analysis-busy";
  if (/timeout|temporar|5\d\d|provider/i.test(text)) return "analysis-provider-unavailable";
  if (/request|schema|4\d\d/i.test(text)) return "analysis-request-rejected";
  return "unknown";
}

function sanitizedHttpCode(status: number, body: string): string {
  const code = failureCode(body);
  return code === "unknown" ? `http-${status}` : code;
}

function assertLocalTarget() {
  if (!localHosts.has(baseUrl.hostname) && process.env.P5_SYNTHETIC_ALLOW_NONLOCAL !== "1") {
    throw new Error("Refusing a non-local P5_TEST_BASE_URL; use a local development service.");
  }
}

async function preflightService() {
  let response: Response;
  try {
    response = await fetch(new URL("/estimate/scope", baseUrl), {
      signal: AbortSignal.timeout(60_000),
      redirect: "manual",
    });
  } catch {
    throw new Error("SERVICE_PREFLIGHT_FAILED status=unreachable code=connection-failed");
  }
  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(`SERVICE_PREFLIGHT_FAILED status=${response.status} code=${sanitizedHttpCode(response.status, body)}`);
  }
  console.log(`SERVICE_PREFLIGHT_OK status=${response.status}`);
}

const typedScope = [
  "SYNTHETIC VERIFICATION ONLY. No contact information. Kitchen remodel planning scope.",
  "The owner explicitly typed every measurement below; do not infer dimensions from the attached existing-house photo.",
  "Project type: kitchen. Finish level: high-end. Location: Boise, Idaho.",
  "Explicit measurements: project area 240 square feet; length 20 feet; width 12 feet.",
  "Explicit counts: 1 room; 1 bathroom; 1 story.",
  "Explicit cabinet measurements: base cabinet run 18 linear feet; upper cabinet run 12 linear feet.",
  "Replace existing cabinets, install quartz counters, update lighting and plumbing fixtures.",
  "Owner-supplied refrigerator; contractor scope includes cabinet, counter, electrical and plumbing work.",
  "The photo is visual context only. It contains no measurements and must not be used to estimate dimensions.",
].join("\n");

async function makePdf() {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([612, 792]);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const lines = [
    "SYNTHETIC VERIFICATION SUPPORTING SCOPE",
    "No contact information. This document is test data only.",
    "",
    "Kitchen remodel:",
    "Replace existing cabinets and counters; install backsplash;",
    "update electrical lighting and plumbing fixtures.",
    "The attached house photo is visual context only.",
    "Do not infer measurements, areas, scale, or structural conditions",
    "from the photo.",
    "",
    "The explicit typed measurements are supplied separately in the",
    "typed scope and measurement spreadsheet.",
    "Owner supplies the refrigerator. Contractor supplies installation.",
  ];
  let y = 744;
  for (const line of lines) {
    page.drawText(line, {x: 54, y, size: 13, font, color: rgb(0.12, 0.12, 0.12)});
    y -= 27;
  }
  return Buffer.from(await pdf.save());
}

async function makeWorkbook() {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Explicit measurements");
  sheet.addRows([
    ["Field", "Measurement", "Unit", "How supplied"],
    ["Project area", 240, "square feet", "typed by owner"],
    ["Length", 20, "feet", "typed by owner"],
    ["Width", 12, "feet", "typed by owner"],
    ["Rooms", 1, "room", "typed by owner"],
    ["Bathrooms", 1, "bathroom", "typed by owner"],
    ["Stories", 1, "story", "typed by owner"],
    ["Base cabinet run", 18, "linear feet", "typed by owner"],
    ["Upper cabinet run", 12, "linear feet", "typed by owner"],
  ]);
  return Buffer.from(await workbook.xlsx.writeBuffer());
}

async function sourcePhoto() {
  const configured = process.env.P5_SYNTHETIC_PHOTO_PATH;
  const candidate = configured
    ? path.resolve(configured)
    : path.join(process.cwd(), "attached_assets", "image_1783743682112.png");
  try {
    return await readFile(candidate);
  } catch {
    throw new Error(`Missing real existing-house photo fixture: ${candidate}`);
  }
}

function numericValue(value: string) {
  const parsed = Number(value.replaceAll(",", "").trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function assertMappedNumericFacts(extraction: Awaited<ReturnType<typeof analyzeScope>>["extraction"]) {
  for (const [field, expected] of Object.entries(numericExpected)) {
    assert.ok(Object.hasOwn(SCOPE_FIELDS, field), `${field} is not in SCOPE_FIELDS`);
    const facts = extraction.facts.filter(fact => fact.field === field);
    assert.ok(
      facts.some(fact => numericValue(fact.value) === expected),
      `${field} did not map the explicit numeric value ${expected}; received ${facts.map(fact => fact.value).join(", ") || "nothing"}`,
    );
    assert.ok(!extraction.conflicts.some(conflict => conflict.field === field), `${field} unexpectedly conflicted`);
    assert.ok(
      !facts.some(fact => fact.source.toLowerCase().includes(photoSourceMarker) || fact.source.toLowerCase().includes("photo")),
      `${field} was inferred from the photo instead of an explicit source`,
    );
  }
}

async function runDirectAnalysis(files: AnalysisFile[]) {
  let providerStatus: number | undefined;
  const observingFetch: typeof fetch = async (input, init) => {
    const response = await fetch(input, init);
    try {
      if (new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url).hostname === "api.anthropic.com") {
        providerStatus = response.status;
      }
    } catch {
      // The extraction request itself remains the source of truth.
    }
    return response;
  };
  let result: Awaited<ReturnType<typeof analyzeScope>>;
  try {
    result = await analyzeScope(typedScope, files, {}, observingFetch);
  } catch (error) {
    const status = providerStatus === undefined ? "unknown" : String(providerStatus);
    throw new Error(`ANALYSIS_FAILED status=${status} code=${failureCode(error)}`);
  }
  assertMappedNumericFacts(result.extraction);
  console.log(`DIRECT_ANALYSIS_OK provider=${result.provider} model=${result.model} facts=${result.extraction.facts.length}`);
  return result;
}

type BrowserCheck = {
  viewport: string;
  scopeAttempts: number;
  scopeResponses: number[];
  forbiddenRequests: string[];
  passed: boolean;
};

async function runBrowserCheck(files: {pdf: string; photo: string; xlsx: string}) {
  const browserPath = process.env.PLAYWRIGHT_CHROMIUM_PATH;
  const browser = await chromium.launch(browserPath ? {executablePath: browserPath} : undefined);
  const context = await browser.newContext({viewport: {width: 390, height: 900}, hasTouch: true});
  const page = await context.newPage();
  const forbiddenRequests: string[] = [];
  const scopeResponses: number[] = [];
  let scopeAttempts = 0;
  let abortFirstScope = true;
  page.setDefaultTimeout(45_000);
  let stage = "navigation";
  await context.route("**/*", async route => {
    const request = route.request();
    const url = new URL(request.url());
    const pathName = url.pathname.toLowerCase();
    const forbidden = /(^|\/)(submit|admin|cron)(\/|$)/.test(pathName) || pathName.includes("notification");
    if (forbidden) {
      forbiddenRequests.push(`${request.method()} ${url.pathname}`);
      await route.abort("blockedbyclient");
      return;
    }
    if (pathName === "/api/p5-estimator/scope" && request.method() === "POST") {
      scopeAttempts++;
      if (abortFirstScope) {
        abortFirstScope = false;
        await route.abort("connectionreset");
        return;
      }
    }
    await route.continue();
  });
  page.on("response", response => {
    const url = new URL(response.url());
    if (url.pathname === "/api/p5-estimator/scope") scopeResponses.push(response.status());
  });
  try {
    await page.goto(new URL("/estimate/scope", baseUrl).href, {waitUntil: "domcontentloaded", timeout: 60_000});
    const estimator = page.locator("[data-p5-estimator]");
    await estimator.waitFor({state: "visible"});
    const scope = page.locator("#p5-scope");
    stage = "select files";
    await scope.fill(typedScope);
    await page.locator("#p5-files").setInputFiles([files.pdf, files.photo, files.xlsx]);
    for (const name of ["synthetic-scope.pdf", "existing-house-photo.png", "explicit-measurements.xlsx"]) {
      await estimator.getByText(name, {exact: true}).waitFor({state: "visible"});
    }

    // This first failure is a local connection interruption; the next request
    // is not mocked and must reach the running app and Anthropic service.
    stage = "interrupted review";
    await estimator.getByRole("button", {name: "Review my scope", exact: true}).click();
    await estimator.getByRole("alert").waitFor({state: "visible"});
    for (const name of ["synthetic-scope.pdf", "existing-house-photo.png", "explicit-measurements.xlsx"]) {
      await estimator.getByText(name, {exact: true}).waitFor({state: "visible"});
    }

    stage = "real review";
    await estimator.getByRole("button", {name: "Review my scope", exact: true}).click();
    await estimator.getByRole("heading", {name: "Review your project details", exact: true}).waitFor({state: "visible", timeout: 180_000});
    stage = "mapped fields";
    await estimator.getByText("Review or edit details already provided", {exact: true}).click();
    for (const [field, expected] of Object.entries(numericExpected)) {
      const input = page.locator(`#p5-${field}`);
      await input.waitFor({state: "visible"});
      assert.equal(Number((await input.inputValue()).replaceAll(",", "")), expected, `browser mapped ${field}`);
    }

    // Going back must retain the server-stored files and their names.
    await estimator.getByRole("button", {name: "Back", exact: true}).click();
    stage = "back preserved files";
    await scope.waitFor({state: "visible"});
    for (const name of ["synthetic-scope.pdf", "existing-house-photo.png", "explicit-measurements.xlsx"]) {
      await estimator.locator("li").filter({hasText: name}).getByText("Uploaded", {exact: true}).waitFor({state: "visible"});
    }

    // Check the same draft at tablet width without submitting it.
    await page.setViewportSize({width: 768, height: 900});
    await page.reload({waitUntil: "domcontentloaded"});
    await page.locator("#p5-scope").waitFor({state: "visible"});
    for (const name of ["synthetic-scope.pdf", "existing-house-photo.png", "explicit-measurements.xlsx"]) {
      await page.locator("[data-p5-estimator] li").filter({hasText: name}).getByText("Uploaded", {exact: true}).waitFor({state: "visible"});
    }
    assert.equal(scopeAttempts, 2, "one interrupted scope request plus one real retry expected");
    assert.ok(scopeResponses.includes(200), `successful scope response missing: ${scopeResponses.join(",")}`);
    assert.equal(forbiddenRequests.length, 0, `blocked endpoint attempted: ${forbiddenRequests.join(", ")}`);
    return {
      viewport: "390-mobile+768-tablet",
      scopeAttempts,
      scopeResponses,
      forbiddenRequests,
      passed: true,
    } satisfies BrowserCheck;
  } catch (error) {
    const status = scopeResponses.at(-1);
    const code = failureCode(error);
    await page.screenshot({path:path.join(workDir,"browser-failure.png"),fullPage:true});
    console.error(`Browser verification stage: ${stage}; ${error instanceof Error ? error.message : "unknown failure"}`);
    throw new Error(`BROWSER_FAILED status=${status === undefined ? "unknown" : status} code=${code}`);
  } finally {
    await context.close();
    await browser.close();
  }
}

async function main() {
  if (!optIn) {
    console.error("Opt-in required: set P5_SYNTHETIC_VERIFY=1. No service was contacted.");
    process.exitCode = 2;
    return;
  }
  assertLocalTarget();
  // Keep the first network operation a development-service preflight so a
  // genuine HTTP failure is reported before any provider request or draft.
  await preflightService();

  const pdfBytes = await makePdf();
  const xlsxBytes = await makeWorkbook();
  const photoBytes = await sourcePhoto();
  const pdfPath = path.join(workDir, "synthetic-scope.pdf");
  const photoPath = path.join(workDir, "existing-house-photo.png");
  const xlsxPath = path.join(workDir, "explicit-measurements.xlsx");
  await writeFile(pdfPath, pdfBytes);
  await writeFile(photoPath, photoBytes);
  await writeFile(xlsxPath, xlsxBytes);

  const uploads = [
    verifyUpload("synthetic-scope.pdf", pdfBytes),
    verifyUpload("existing-house-photo.png", photoBytes),
    verifyUpload("explicit-measurements.xlsx", xlsxBytes),
  ];
  const prepared = await prepareAnalysisFiles(uploads);
  assert.deepEqual(prepared.manualReview, [], "all synthetic fixtures should be readable automatically");
  assert.equal(prepared.readable.length, 3);
  const spreadsheet = prepared.readable.find(file => file.name === "explicit-measurements.xlsx");
  assert.equal(spreadsheet?.type, "text/plain");
  assert.match(spreadsheet?.data.toString("utf8") || "", /Project area.*240/);
  assert.match(spreadsheet?.data.toString("utf8") || "", /Base cabinet run.*18/);
  assert.equal(uploads.find(file => file.name === "existing-house-photo.png")?.type, "image/png");
  const direct = await runDirectAnalysis(prepared.readable);
  const browser = await runBrowserCheck({pdf: pdfPath, photo: photoPath, xlsx: xlsxPath});
  const output = {
    passed: true,
    scope: "Synthetic verification only; no contact information; no submit/admin/cron/notification request allowed.",
    fixtureDirectory: workDir,
    preparedFiles: prepared.readable.map(file => ({name: file.name, type: file.type, bytes: file.data.length})),
    direct: {
      provider: direct.provider,
      model: direct.model,
      numericFields: Object.keys(numericExpected) as ScopeField[],
      factCount: direct.extraction.facts.length,
    },
    browser,
  };
  await writeFile(resultPath, JSON.stringify(output, null, 2));
  console.log(`BROWSER_CHECK_OK viewport=${browser.viewport} scopeResponses=${browser.scopeResponses.join(",")}`);
  console.log(`RESULTS_WRITTEN ${resultPath}`);
}

main().catch(error => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message.startsWith("SERVICE_PREFLIGHT_FAILED") || message.startsWith("ANALYSIS_FAILED") || message.startsWith("BROWSER_FAILED")
    ? message
    : `SYNTHETIC_VERIFICATION_FAILED code=${failureCode(error)}`);
  process.exitCode = 1;
});