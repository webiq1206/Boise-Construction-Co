import { readFileSync } from "fs";
const files = process.argv.slice(2);
const DOMAIN = /boiseremodeling\.co/gi;
const TERM = /remodel\w*|renovat\w*/i;
for (const f of files) {
  let text; try { text = readFileSync(f, "utf8"); } catch { console.log("MISSING " + f); continue; }
  const lines = text.split(/\r?\n/);
  console.log("\n===== " + f);
  lines.forEach((l, i) => {
    const stripped = l.replace(DOMAIN, "");
    if (TERM.test(stripped)) console.log(String(i + 1).padStart(5) + "| " + l.trim().slice(0, 165));
  });
}
