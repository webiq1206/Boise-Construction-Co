/** Scan distributable scripts and serialized page props, never server chunks. */
import {readFile, readdir, mkdir, writeFile} from "node:fs/promises";
import path from "node:path";

const markers = ["P5 Cost Database 2026.xlsx (Master sheet)", "90-70-17", "Jared Brost: unified overhead instruction, September 10, 2026"];
async function files(directory) {
  const result = [];
  for (const item of await readdir(directory, {withFileTypes: true})) {
    const file = path.join(directory, item.name);
    if (item.isDirectory()) result.push(...await files(file));
    else if (item.isFile()) result.push(file);
  }
  return result;
}
const scripts = (await files(".next/static")).filter(file => /\.(?:js|map)$/.test(file));
const props = (await files(".next/server/app")).filter(file => /\.(?:html|rsc)$/.test(file));
if (!scripts.length || !props.length) throw Error("A completed production build is required.");
const failures = [];
for (const file of [...scripts, ...props]) {
  const text = await readFile(file, "utf8");
  for (const marker of markers) if (text.includes(marker)) failures.push({file, marker});
}
const output = process.env.CONSTRUCTION_PLANNING_EVIDENCE || "test-results/public-planning";
await mkdir(output, {recursive: true});
const report = {passed: failures.length === 0, browserScripts: scripts.length, serializedPages: props.length, markers, failures, scope: "Raw cost-book sentinel rows/source and default finance approval text must not occur in any distributable script or serialized page props. Server-only pricing chunks are intentionally excluded."};
await writeFile(path.join(output, "build-privacy.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify(report));
if (failures.length) process.exitCode = 1;
