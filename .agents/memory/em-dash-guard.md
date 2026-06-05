---
name: em-dash build guard
description: Why builds fail on typographic em-dashes and the guard's deliberate scope.
---

# Em-dash build guard

`scripts/verify-no-em-dash.ts` runs in the `prebuild` chain, so every
`npm run build` (and thus every publish via `build.sh`) FAILS if a typographic
em-dash (U+2014) appears in scanned files. It also flags HTML-entity
(`&mdash;`, `&#8212;`, `&#x2014;`) and unicode-escape (`\u2014`, `\u{2014}`)
forms.

**Use a hyphen `-` (spaced where it reads as punctuation) instead of an em-dash**
in all content and code, including comments.

**Scope is deliberate:** only `.ts/.tsx/.js/.jsx/.mjs/.cjs/.css/.svg/.html` are
scanned. Markdown (e.g. `replit.md`) and `.json` are intentionally excluded.

**Why:** replit.md and similar docs are machine-edited and would cause flaky
build failures; the requirement targets site body content and source code, which
live in the scanned extensions.

**How to apply:** if a build fails on this check, replace the offending em-dash
with `-`. If you ever need to widen/narrow what's checked, edit
`SCAN_EXTENSIONS` / `EXCLUDED_DIRS` in the script.
