import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const ROOTS = ["app", "components", "shared", "lib", "server", "data", "public/downloads"];
const SKIP_DIRS = new Set(["node_modules", ".next", ".git"]);
const EXT = /\.(ts|tsx|json|mdx?|txt)$/;
// The domain is deliberately unchanged, so boiseremodeling.co is not a finding.
const DOMAIN = /boiseremodeling\.co/gi;
const TERM = /remodel\w*|renovat\w*/gi;

const rows: { file: string; hits: number }[] = [];
function walk(dir: string) {
  let entries: string[];
  try { entries = readdirSync(dir); } catch { return; }
  for (const e of entries) {
    if (SKIP_DIRS.has(e)) continue;
    const p = join(dir, e);
    let s; try { s = statSync(p); } catch { continue; }
    if (s.isDirectory()) { walk(p); continue; }
    if (!EXT.test(e)) continue;
    let text; try { text = readFileSync(p, "utf8"); } catch { continue; }
    const stripped = text.replace(DOMAIN, "");
    const hits = (stripped.match(TERM) ?? []).length;
    if (hits > 0) rows.push({ file: p.replace(/\\/g, "/"), hits });
  }
}
for (const r of ROOTS) walk(r);
rows.sort((a, b) => b.hits - a.hits);
let total = 0;
for (const r of rows) total += r.hits;
console.log(`${rows.length} files, ${total} mentions of remodel/renovate (domain excluded)\n`);
for (const r of rows) console.log(String(r.hits).padStart(5) + "  " + r.file);
